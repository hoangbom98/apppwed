// @ts-nocheck
'use strict';
/**
 * TransactionMonitor — phát hiện giao dịch bất thường:
 *   • Nạp tiền vượt ngưỡng 50M trong 10 phút
 *   • Rút > 90% số vừa nạp trong < 1h
 *   • Tần suất giao dịch > 10/phút
 *   • Số tiền lệch > 3 σ so với trung bình 7 ngày
 *   • Chuyển đến tài khoản mới tạo (< 1 ngày)
 */
const logger = require('../shared/services/logger');

const WINDOW_7D  = 7  * 24 * 60 * 60 * 1000;
const WINDOW_10M = 10 * 60 * 1000;
const WINDOW_1H  =      60 * 60 * 1000;
const DEPOSIT_SPIKE = 50_000_000;
const FREQUENCY_MAX = 10; // per minute

class TransactionMonitor {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Evaluate a pending deposit/withdrawal for anomalies.
   * @returns {{ risk: 'low'|'medium'|'high'|'critical', reason: string|null }}
   */
  async evaluate(userId, amount, type = 'withdraw') {
    try {
      // ── 1. Velocity: how many transactions in last minute? ────────
      const since1m = new Date(Date.now() - 60_000);
      const txCount1m = await this.prisma.transaction.count({
        where: { userId, createdAt: { gte: since1m } },
      });
      if (txCount1m > FREQUENCY_MAX) {
        return { risk: 'high', reason: 'high_frequency' };
      }

      // ── 2. Deposit spike: > 50M in 10 minutes ────────────────────
      if (type === 'deposit' && amount > DEPOSIT_SPIKE) {
        const since10m = new Date(Date.now() - WINDOW_10M);
        const recentDeposit = await this.prisma.transaction.aggregate({
          where: { userId, type: 'deposit', createdAt: { gte: since10m } },
          _sum: { amount: true },
        });
        const total10m = Number(recentDeposit._sum?.amount || 0) + amount;
        if (total10m > DEPOSIT_SPIKE) {
          return { risk: 'high', reason: 'deposit_spike' };
        }
      }

      // ── 3. Withdraw-after-deposit pattern ─────────────────────────
      if (type === 'withdraw') {
        const lastDeposit = await this.prisma.transaction.findFirst({
          where: { userId, type: 'deposit', status: 'success' },
          orderBy: { createdAt: 'desc' },
        });
        if (
          lastDeposit &&
          Date.now() - new Date(lastDeposit.createdAt).getTime() < WINDOW_1H &&
          amount > Number(lastDeposit.amount) * 0.9
        ) {
          return { risk: 'high', reason: 'withdraw_after_deposit' };
        }
      }

      // ── 4. Statistical anomaly: > 3 σ from 7-day average ─────────
      const history = await this.prisma.transaction.findMany({
        where: { userId, createdAt: { gte: new Date(Date.now() - WINDOW_7D) } },
        select: { amount: true },
      });
      if (history.length >= 5) {
        const nums = history.map(t => Math.abs(Number(t.amount)));
        const avg  = nums.reduce((a, b) => a + b, 0) / nums.length;
        const std  = Math.sqrt(nums.reduce((s, n) => s + (n - avg) ** 2, 0) / nums.length);
        if (std > 0 && Math.abs(amount) > avg + 3 * std) {
          return { risk: 'medium', reason: 'amount_anomaly', avg: Math.round(avg), std: Math.round(std) };
        }
      }

      return { risk: 'low', reason: null };
    } catch (err) {
      logger.error('[TransactionMonitor] evaluate error', { err: err.message });
      return { risk: 'low', reason: null };
    }
  }

  /**
   * Check internal transfer to a brand-new account.
   * @returns {{ risk: 'low'|'medium'|'high', reason: string|null }}
   */
  async checkInternalTransfer(fromUserId, toUserId) {
    try {
      const toUser = await this.prisma.user.findUnique({
        where: { id: toUserId },
        select: { createdAt: true },
      });
      if (!toUser) return { risk: 'high', reason: 'unknown_recipient' };

      const ageMs = Date.now() - new Date(toUser.createdAt).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        return { risk: 'high', reason: 'transfer_to_new_account' };
      }
      return { risk: 'low', reason: null };
    } catch (err) {
      logger.error('[TransactionMonitor] checkInternalTransfer error', { err: err.message });
      return { risk: 'low', reason: null };
    }
  }
}

module.exports = TransactionMonitor;
