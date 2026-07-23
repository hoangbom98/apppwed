// @ts-nocheck
'use strict';
/**
 * FraudDetector — phát hiện đa tài khoản, multi-account fraud.
 *   • > 3 users cùng IP → high
 *   • > 2 users cùng fingerprint → high
 *   • > 10 đăng ký trong 5 phút (cùng hệ thống) → medium
 */
const logger = require('../shared/services/logger');

class FraudDetector {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Kiểm tra ngay sau khi user đăng ký / đăng nhập.
   * @returns {{ risk: 'low'|'medium'|'high', reason: string|null }}
   */
  async checkMultiAccount(userId, fingerprint, ip) {
    try {
      const adminPrisma = this._adminPrisma();

      // ── Cùng IP → nhiều users? ────────────────────────────────────
      if (ip) {
        const usersAtIp = await adminPrisma.userDevice.findMany({
          where: { ip, userId: { not: userId } },
          distinct: ['userId'],
          select: { userId: true },
        });
        if (usersAtIp.length > 3) {
          return { risk: 'high', reason: 'many_users_same_ip', count: usersAtIp.length };
        }
      }

      // ── Cùng fingerprint → nhiều users? ──────────────────────────
      if (fingerprint) {
        const usersAtDevice = await adminPrisma.userDevice.findMany({
          where: { fingerprint, userId: { not: userId } },
          distinct: ['userId'],
          select: { userId: true },
        });
        if (usersAtDevice.length > 2) {
          return { risk: 'high', reason: 'many_users_same_device', count: usersAtDevice.length };
        }
      }

      // ── Đăng ký hàng loạt? ───────────────────────────────────────
      const since5m = new Date(Date.now() - 5 * 60 * 1000);
      const recentRegistrations = await adminPrisma.user.count({
        where: { createdAt: { gte: since5m }, id: { not: userId } },
      });
      if (recentRegistrations > 10) {
        return { risk: 'medium', reason: 'rapid_registration_burst', count: recentRegistrations };
      }

      return { risk: 'low', reason: null };
    } catch (err) {
      logger.error('[FraudDetector] checkMultiAccount error', { err: err.message });
      return { risk: 'low', reason: null };
    }
  }

  /**
   * Tạm khóa user và tạo risk alert.
   */
  async handleMultiAccountFraud(userId, reason) {
    try {
      const adminPrisma = this._adminPrisma();

      // Suspend user
      await adminPrisma.user.update({
        where: { id: userId },
        data: { status: 'suspended' },
      });

      // Find or create a risk rule for multi_account
      const rule = await this._getOrCreateRule(adminPrisma, 'multi_account', 'Multi-account fraud detection');

      await adminPrisma.riskAlert.create({
        data: {
          userId,
          ruleId:       rule.id,
          details:      { reason },
          status:       'new',
        },
      });
    } catch (err) {
      logger.error('[FraudDetector] handleMultiAccountFraud error', { err: err.message });
    }
  }

  async _getOrCreateRule(prisma, name, description) {
    let rule = await prisma.riskRule.findFirst({ where: { name } });
    if (!rule) {
      rule = await prisma.riskRule.create({
        data: { name, description, action: 'suspend', status: 'active' },
      });
    }
    return rule;
  }

  _adminPrisma() {
    const { getPrismaClient } = require('../../config/databases');
    return getPrismaClient('admin');
  }
}

module.exports = FraudDetector;
