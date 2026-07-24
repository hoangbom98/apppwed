// @ts-nocheck
'use strict';
/**
 * GeolocationMonitor — phát hiện rủi ro từ quốc gia / IP quốc tế.
 *   • IP từ quốc gia rủi ro cao → high
 *   • Đổi quốc gia đột ngột trong < 5 phút → critical
 *   • IP nước ngoài truy cập endpoint nhạy cảm nhiều lần → high
 *   • IP trong blacklist quốc tế → critical
 */
const redis  = require('../config/redis');
const logger = require('../shared/services/logger');

let geoip = null;
try { geoip = require('geoip-lite'); } catch { /* optional */ }

// Danh sách quốc gia được phép (cấu hình động qua SystemConfig)
const DEFAULT_ALLOWED  = ['VN'];
// Quốc gia rủi ro cao (cấu hình động)
const HIGH_RISK_COUNTRIES = [];

const COUNTRY_SWITCH_MS    = 5 * 60 * 1000;
const FOREIGN_REQUEST_LIMIT = 50;  // requests per 5 minutes
const FOREIGN_WINDOW_SEC   = 300;

class GeolocationMonitor {
  constructor(prisma) {
    this.prisma = prisma; // admin prisma
  }

  /**
   * Kiểm tra IP của request.
   * @returns {{ risk: 'low'|'medium'|'high'|'critical', reason: string|null, country: string|null }}
   */
  async checkLocation(ip, userId = null) {
    try {
      if (!geoip || !ip) return { risk: 'low', reason: null, country: null };

      const geo = geoip.lookup(ip);
      if (!geo) return { risk: 'unknown', reason: 'no_geo_data', country: null };

      const country = geo.country;

      // ── 1. High-risk country ──────────────────────────────────────
      if (HIGH_RISK_COUNTRIES.includes(country)) {
        return { risk: 'high', reason: 'high_risk_country', country };
      }

      // ── 2. International blacklist (DB) ───────────────────────────
      const blacklisted = await this.prisma.ipBlacklist.findFirst({
        where: { ip, type: 'international' },
      }).catch(() => null);

      if (blacklisted) {
        return { risk: 'critical', reason: 'international_blacklist', country };
      }

      // ── 3. Country switch detection (only for authenticated users) ─
      if (userId) {
        const lastDevice = await this.prisma.userDevice.findFirst({
          where:   { userId },
          orderBy: { lastSeen: 'desc' },
        }).catch(() => null);

        if (lastDevice?.country && lastDevice.country !== country) {
          const timeDiff = Date.now() - new Date(lastDevice.lastSeen).getTime();
          if (timeDiff < COUNTRY_SWITCH_MS) {
            return {
              risk:    'critical',
              reason:  'sudden_country_switch',
              from:    lastDevice.country,
              to:      country,
              country,
            };
          }
        }
      }

      // ── 4. Foreign IP flood on sensitive endpoints ────────────────
      if (!DEFAULT_ALLOWED.includes(country)) {
        const key   = `foreign:${ip}`;
        const count = await redis.incr(key);
        if (count === 1) await redis.setEx(key, FOREIGN_WINDOW_SEC, String(count));

        if (count > FOREIGN_REQUEST_LIMIT) {
          return { risk: 'high', reason: 'foreign_flood', count, country };
        }
      }

      return { risk: 'low', reason: null, country };
    } catch (err) {
      logger.error('[GeolocationMonitor] checkLocation error', { err: err.message });
      return { risk: 'low', reason: null, country: null };
    }
  }

  /**
   * Auto-handle critical geo risks.
   */
  async handleCriticalGeoRisk(userId, ip, reason, details = {}) {
    try {
      if (userId) {
        await this.prisma.user.update({
          where: { id: userId },
          data:  { status: 'suspended' },
        });
      }

      if (ip) {
        await this.prisma.ipBlacklist.upsert({
          where:  { ip },
          create: {
            ip,
            type:      'international',
            reason,
            addedBy:   'system',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          update: { reason, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        });
      }

      await this.prisma.securityLog.create({
        data: {
          userId,
          ip,
          type:     'geo_risk',
          action:   ip ? 'ip_blocked' : 'account_suspended',
          details:  { reason, ...details },
          severity: 'critical',
        },
      });

      logger.security('geo_risk_critical', { userId, ip, reason, details });
    } catch (err) {
      logger.error('[GeolocationMonitor] handleCriticalGeoRisk error', { err: err.message });
    }
  }
}

module.exports = GeolocationMonitor;
