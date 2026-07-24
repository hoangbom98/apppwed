// @ts-nocheck
'use strict';
/**
 * ComplianceMonitor — tuân thủ KYC / AML.
 *   • KYC: tự động yêu cầu xác minh nếu deposit > 20M hoặc total > 50M
 *   • AML: cảnh báo giao dịch lớn > 100M (báo cáo pháp lý)
 *   • AML: chuỗi giao dịch cơ cấu (structuring) — nhiều tx nhỏ tổng > ngưỡng
 */
const logger = require('../shared/services/logger');

const KYC_SINGLE_THRESHOLD = 20_000_000;  // 20 triệu
const KYC_TOTAL_THRESHOLD  = 50_000_000;  // 50 triệu tổng tích lũy
const AML_LARGE_TX         = 100_000_000; // 100 triệu — báo cáo AML
const STRUCTURING_WINDOW   = 24 * 60 * 60 * 1000;
const STRUCTURING_LIMIT    = 50_000_000;  // tổng nhiều tx nhỏ < 10M trong 24h

class ComplianceMonitor {
  constructor(prisma) {
    this.prisma = prisma; // admin prisma
  }

  /**
   * Kiểm tra KYC trước khi xử lý giao dịch.
   * @returns {{ action: 'ok'|'kyc_required'|'blocked', reason: string|null }}
   */
  async checkKyc(userId, amount) {
    try {
      const user = await this.prisma.user.findUnique({
        where:  { id: userId },
        select: { kycLevel: true },
      });
      if (!user) return { action: 'ok', reason: null };

      const isVerified = ['level1', 'level2', 'verified'].includes(user.kycLevel);
      if (isVerified) return { action: 'ok', reason: null };

      // Tổng deposit đã thực hiện
      const totalAgg = await this.prisma.transaction.aggregate({
        where: { userId, type: 'deposit', status: 'success' },
        _sum:  { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } }));

      const totalDeposit = Number(totalAgg._sum?.amount || 0);

      if (amount > KYC_SINGLE_THRESHOLD || totalDeposit > KYC_TOTAL_THRESHOLD) {
        // Đặt kycLevel thành pending
        await this.prisma.user.update({
          where: { id: userId },
          data:  { kycLevel: 'pending_review' },
        });
        logger.info(`[ComplianceMonitor] KYC required for userId=${userId}`);
        return { action: 'kyc_required', reason: 'threshold_exceeded' };
      }

      return { action: 'ok', reason: null };
    } catch (err) {
      logger.error('[ComplianceMonitor] checkKyc error', { err: err.message });
      return { action: 'ok', reason: null };
    }
  }

  /**
   * AML check — large transaction + structuring detection.
   * @returns {{ action: 'ok'|'aml_alert', reason: string|null }}
   */
  async checkAml(userId, transactionId, amount, type = 'deposit') {
    try {
      // ── 1. Large single transaction ───────────────────────────────
      if (amount >= AML_LARGE_TX) {
        await this._createAmlAlert(userId, transactionId, 'large_transaction', {
          amount, threshold: AML_LARGE_TX,
        });
        return { action: 'aml_alert', reason: 'large_transaction' };
      }

      // ── 2. Structuring detection (nhiều tx nhỏ tổng > 50M/ngày) ──
      const since24h = new Date(Date.now() - STRUCTURING_WINDOW);
      const dailyAgg = await this.prisma.transaction.aggregate({
        where: { userId, type, status: { in: ['success', 'pending'] }, createdAt: { gte: since24h } },
        _sum:  { amount: true },
        _count: true,
      });

      const dailyTotal = Number(dailyAgg._sum?.amount || 0);
      const txCount    = dailyAgg._count || 0;

      if (dailyTotal + amount > STRUCTURING_LIMIT && txCount >= 5) {
        await this._createAmlAlert(userId, transactionId, 'structuring', {
          dailyTotal, txCount, newAmount: amount, limit: STRUCTURING_LIMIT,
        });
        return { action: 'aml_alert', reason: 'structuring' };
      }

      return { action: 'ok', reason: null };
    } catch (err) {
      logger.error('[ComplianceMonitor] checkAml error', { err: err.message });
      return { action: 'ok', reason: null };
    }
  }

  async _createAmlAlert(userId, transactionId, ruleTriggered, details) {
    try {
      await this.prisma.amlAlert.create({
        data: { userId, transactionId, ruleTriggered, details, status: 'new' },
      });
      logger.warn('[ComplianceMonitor] AML alert created', { userId, ruleTriggered });
    } catch (err) {
      logger.error('[ComplianceMonitor] _createAmlAlert error', { err: err.message });
    }
  }
}

module.exports = ComplianceMonitor;
