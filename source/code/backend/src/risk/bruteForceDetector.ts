// @ts-nocheck
'use strict';
/**
 * BruteForceDetector — chống tấn công brute-force đăng nhập.
 *   • Block IP tạm thời sau 5 lần thất bại trong 5 phút
 *   • Escalate lên critical sau 20+ lần
 */
const redis  = require('../config/redis');
const logger = require('../shared/services/logger');

const ATTEMPT_WINDOW_SEC = 300;   // 5 phút
const BLOCK_THRESHOLD    = 5;
const BLOCK_DURATION_SEC = 900;   // 15 phút
const CRITICAL_THRESHOLD = 20;
const CRITICAL_BLOCK_SEC = 86400; // 24 giờ

class BruteForceDetector {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Kiểm tra trước khi cho phép đăng nhập.
   * @returns {{ blocked: boolean, reason: string|null, severity: string }}
   */
  async checkLoginAttempt(ip, email = '') {
    try {
      // IP đã bị block?
      const blockedIp = await redis.get(`blocked:ip:${ip}`);
      if (blockedIp) return { blocked: true, reason: 'ip_blocked', severity: 'high' };

      // Account bị block?
      if (email) {
        const blockedAcc = await redis.get(`blocked:acc:${email}`);
        if (blockedAcc) return { blocked: true, reason: 'account_locked', severity: 'high' };
      }

      // Đếm attempts
      const ipKey  = `brute:ip:${ip}`;
      const ipCnt  = Number(await redis.get(ipKey) || 0);

      if (ipCnt >= CRITICAL_THRESHOLD) {
        await redis.setEx(`blocked:ip:${ip}`, CRITICAL_BLOCK_SEC, '1');
        await this._logEvent(null, ip, 'brute_force', 'ip_blocked_critical', { attempts: ipCnt }, 'critical');
        return { blocked: true, reason: 'critical_brute_force', severity: 'critical' };
      }
      if (ipCnt >= BLOCK_THRESHOLD) {
        await redis.setEx(`blocked:ip:${ip}`, BLOCK_DURATION_SEC, '1');
        await this._logEvent(null, ip, 'brute_force', 'ip_blocked', { attempts: ipCnt }, 'high');
        return { blocked: true, reason: 'brute_force', severity: 'high' };
      }

      return { blocked: false, reason: null, severity: 'low' };
    } catch (err) {
      logger.error('[BruteForce] checkLoginAttempt error', { err: err.message });
      return { blocked: false, reason: null, severity: 'low' };
    }
  }

  /** Gọi khi đăng nhập THẤT BẠI — tăng counter */
  async recordFailure(ip, email = '') {
    const ipKey  = `brute:ip:${ip}`;
    const accKey = `brute:acc:${email}`;

    await redis.incr(ipKey);
    await redis.setEx(ipKey, ATTEMPT_WINDOW_SEC, String((Number(await redis.get(ipKey) || 1))));

    if (email) {
      const cnt = Number(await redis.get(accKey) || 0) + 1;
      await redis.setEx(accKey, ATTEMPT_WINDOW_SEC, String(cnt));

      // Lock account after 10 failures per account
      if (cnt >= 10) {
        await redis.setEx(`blocked:acc:${email}`, BLOCK_DURATION_SEC, '1');
      }
    }
  }

  /** Gọi khi đăng nhập THÀNH CÔNG — xóa counter */
  async recordSuccess(ip, email = '') {
    await redis.del(`brute:ip:${ip}`, `brute:acc:${email}`);
  }

  async _logEvent(userId, ip, type, action, details, severity = 'medium') {
    try {
      const { getPrismaClient } = require('../../config/databases');
      const adminPrisma = getPrismaClient('admin');
      await adminPrisma.securityLog.create({
        data: { userId, ip, type, action, details, severity },
      });
    } catch { /* non-fatal */ }
  }
}

module.exports = BruteForceDetector;
