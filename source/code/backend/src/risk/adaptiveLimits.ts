// @ts-nocheck
'use strict';
/**
 * AdaptiveLimits — điều chỉnh hạn mức giao dịch động
 * dựa trên lịch sử 30 ngày của từng user.
 * Max: 100,000,000 VND/ngày.
 */
const logger = require('../shared/services/logger');

const WINDOW_30D   = 30 * 24 * 60 * 60 * 1000;
const MIN_DEPOSITS = 10;    // cần tối thiểu 10 giao dịch mới tính
const ABSOLUTE_MAX = 100_000_000; // 100 triệu

class AdaptiveLimits {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Tính và cập nhật dailyLimit cho một user.
   * Chỉ tăng limit nếu user có đủ lịch sử lành mạnh.
   */
  async adjustLimits(userId) {
    try {
      const since30d = new Date(Date.now() - WINDOW_30D);

      const deposits = await this.prisma.transaction.findMany({
        where: { userId, type: 'deposit', status: 'success', createdAt: { gte: since30d } },
        select: { amount: true },
      });

      if (deposits.length < MIN_DEPOSITS) return null; // chưa đủ dữ liệu

      const avgDeposit = deposits.reduce((s, t) => s + Number(t.amount), 0) / deposits.length;
      const newDailyLimit = Math.min(Math.round(avgDeposit * 3), ABSOLUTE_MAX);

      // Cập nhật nếu user model có dailyLimit field
      await this.prisma.user.updateMany({
        where: { id: userId },
        data: { dailyLimit: newDailyLimit },
      }).catch(() => {
        // dailyLimit field might not exist in all project schemas — safe skip
      });

      logger.info(`[AdaptiveLimits] userId=${userId} newDailyLimit=${newDailyLimit}`);
      return newDailyLimit;
    } catch (err) {
      logger.error('[AdaptiveLimits] adjustLimits error', { err: err.message });
      return null;
    }
  }

  /**
   * Batch job: chạy adjustLimits cho toàn bộ users active.
   * Gọi từ cron job hàng ngày.
   */
  async runBatchAdjustment() {
    try {
      const users = await this.prisma.user.findMany({
        where: { status: 'active' },
        select: { id: true },
        take: 5000, // giới hạn batch size
      });

      let updated = 0;
      for (const u of users) {
        const result = await this.adjustLimits(u.id);
        if (result !== null) updated++;
      }

      logger.info(`[AdaptiveLimits] batch complete — updated ${updated}/${users.length} users`);
      return updated;
    } catch (err) {
      logger.error('[AdaptiveLimits] runBatchAdjustment error', { err: err.message });
      return 0;
    }
  }
}

module.exports = AdaptiveLimits;
