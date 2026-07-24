// @ts-nocheck
'use strict';
/**
 * DeviceFingerprint — phát hiện thiết bị/IP lạ.
 *   • Thiết bị mới + giao dịch lớn → medium risk
 *   • > 5 thiết bị / user → high risk
 *   • Đổi quốc gia đột ngột trong < 5 phút → critical
 */
const logger = require('../shared/services/logger');

let geoip = null;
try { geoip = require('geoip-lite'); } catch { /* optional dep */ }

const MAX_DEVICES      = 5;
const COUNTRY_SWITCH_MS = 5 * 60 * 1000;

class DeviceFingerprint {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Đăng ký / kiểm tra thiết bị khi user đăng nhập.
   * @param {string}  userId
   * @param {string}  fingerprint  – client-side browser fingerprint hash
   * @param {string}  ip
   * @param {string}  [userAgent]
   * @returns {{ risk: 'low'|'medium'|'high'|'critical', reason: string|null }}
   */
  async checkDevice(userId, fingerprint, ip, userAgent = '') {
    try {
      const adminPrisma = this._adminPrisma();

      // ── Resolve country ───────────────────────────────────────────
      let country = null;
      if (geoip && ip) {
        const geo = geoip.lookup(ip);
        country = geo?.country || null;
      }

      // ── Known device? ─────────────────────────────────────────────
      const existing = await adminPrisma.userDevice.findUnique({
        where: { userId_fingerprint: { userId, fingerprint } },
      });

      if (existing) {
        // Update lastSeen + detect country switch
        const lastCountry = existing.country;
        const lastSeenMs  = new Date(existing.lastSeen).getTime();

        await adminPrisma.userDevice.update({
          where: { userId_fingerprint: { userId, fingerprint } },
          data: { lastSeen: new Date(), ip, country },
        });

        if (
          lastCountry && country &&
          lastCountry !== country &&
          Date.now() - lastSeenMs < COUNTRY_SWITCH_MS
        ) {
          return { risk: 'critical', reason: 'country_switch', from: lastCountry, to: country };
        }
        return { risk: 'low', reason: null };
      }

      // ── New device ────────────────────────────────────────────────
      const deviceCount = await adminPrisma.userDevice.count({ where: { userId } });
      if (deviceCount >= MAX_DEVICES) {
        return { risk: 'high', reason: 'too_many_devices', count: deviceCount };
      }

      // New device + recent large tx?
      const recentLargeTx = await this.prisma.transaction.findFirst({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          amount: { gte: 1_000_000 },
        },
      }).catch(() => null);

      // Register the new device
      await adminPrisma.userDevice.create({
        data: { userId, fingerprint, ip, userAgent, country },
      });

      if (recentLargeTx) {
        return { risk: 'medium', reason: 'new_device_large_tx' };
      }
      return { risk: 'low', reason: null };
    } catch (err) {
      logger.error('[DeviceFingerprint] checkDevice error', { err: err.message });
      return { risk: 'low', reason: null };
    }
  }

  _adminPrisma() {
    const { getPrismaClient } = require('../../config/databases');
    return getPrismaClient('admin');
  }
}

module.exports = DeviceFingerprint;
