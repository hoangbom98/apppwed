'use strict';
/**
 * DdosDetector — phát hiện DDoS / request flooding.
 *   • > 500 requests / phút từ 1 IP → block 1 giờ
 *   • > 1000 requests / phút → block 24 giờ
 */
const redis  = require('../config/redis');
const logger = require('../shared/services/logger');

const WINDOW_SEC      = 60;
const THRESHOLD       = 500;
const CRITICAL_THRESHOLD = 1000;
const BLOCK_SEC       = 3600;
const CRITICAL_BLOCK  = 86400;

class DdosDetector {
  /**
   * Được gọi trên mỗi request vào.
   * @returns {{ blocked: boolean, reason: string|null }}
   */
  async check(ip) {
    try {
      // Đã block?
      const isBlocked = await redis.get(`blocked:ip:${ip}`);
      if (isBlocked) return { blocked: true, reason: 'ddos_blocked' };

      // Tăng counter
      const key = `ddos:${ip}`;
      const count = await redis.incr(key);

      // Set expiry chỉ lần đầu (count === 1)
      if (count === 1) {
        await redis.setEx(key, WINDOW_SEC, String(count));
      }

      if (count > CRITICAL_THRESHOLD) {
        await redis.setEx(`blocked:ip:${ip}`, CRITICAL_BLOCK, '1');
        await this._logEvent(ip, count, 'critical');
        return { blocked: true, reason: 'ddos_critical' };
      }

      if (count > THRESHOLD) {
        await redis.setEx(`blocked:ip:${ip}`, BLOCK_SEC, '1');
        await this._logEvent(ip, count, 'high');
        return { blocked: true, reason: 'ddos' };
      }

      return { blocked: false, reason: null };
    } catch (err) {
      logger.error('[DdosDetector] check error', { err: err.message });
      return { blocked: false, reason: null };
    }
  }

  async _logEvent(ip, count, severity) {
    try {
      const adminPrisma = this._adminPrisma();
      await adminPrisma.securityLog.create({
        data: {
          ip,
          type:     'ddos',
          action:   'ip_blocked',
          details:  { count, window: WINDOW_SEC },
          severity,
        },
      });
      logger.security('ddos_blocked', { ip, count, severity });
    } catch { /* non-fatal */ }
  }

  _adminPrisma() {
    const { getPrismaClient } = require('../../config/databases');
    return getPrismaClient('admin');
  }
}

module.exports = DdosDetector;
