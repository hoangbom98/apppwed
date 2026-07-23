// @ts-nocheck
'use strict';
/**
 * CashFlowForecast — 30-day deposit projection based on historical averages
 * and trend. Also alerts when reserve days drop below threshold.
 */
const logger = require('../../../../shared/services/logger');

const ALERT_THRESHOLD_DAYS = 7;

class CashFlowForecast {
  constructor(gamePrisma, adminPrisma) {
    this.game  = gamePrisma;
    this.admin = adminPrisma;
  }

  // ── Generate 30-day deposit forecast ─────────────────────────────────────
  async forecast(days = 30) {
    const cutoff = new Date(Date.now() - 90 * 86400000);

    const txns = await this.game.lkvipTransaction.findMany({
      where:   { type: 'deposit', status: 'completed', createdAt: { gte: cutoff } },
      select:  { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }).catch(() => []);

    if (!txns.length) {
      return Array.from({ length: days }, (_, i) => ({
        date:      new Date(Date.now() + (i + 1) * 86400000).toISOString().slice(0, 10),
        predicted: 0,
      }));
    }

    const total    = txns.reduce((s, t) => s + Number(t.amount), 0);
    const avgDaily = total / 90;

    // Simple linear trend
    const trend    = this._trend(txns);
    const result   = [];

    for (let i = 1; i <= days; i++) {
      const d        = new Date(Date.now() + i * 86400000);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const factor   = isWeekend ? 0.7 : 1.0;
      const predicted = Math.max(0, avgDaily * factor * (1 + trend * i));
      result.push({ date: d.toISOString().slice(0, 10), predicted: Math.round(predicted) });
    }

    return result;
  }

  // ── Check reserve adequacy + alert ───────────────────────────────────────
  async checkReserve() {
    const [balanceAgg, dailyCostAgg] = await Promise.allSettled([
      // Sum of all user balances as a proxy for total platform reserves
      this.game.user.aggregate({ _sum: { balance: true } }),
      this.game.lkvipTransaction.aggregate({
        where:  { type: 'withdraw', status: 'completed', createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        _sum:   { amount: true },
      }),
    ]);

    const totalBalance = Number(balanceAgg.value?._sum?.balance || 0);
    const monthlyOut   = Number(dailyCostAgg.value?._sum?.amount || 0);
    const dailyCost    = monthlyOut / 30 || 1;
    const reserveDays  = totalBalance / dailyCost;

    if (reserveDays < ALERT_THRESHOLD_DAYS) {
      logger.warn(`[CashFlow] Reserve < ${ALERT_THRESHOLD_DAYS} days (${reserveDays.toFixed(1)}d)`);
      try {
        await this.admin.opsAlert.create({
          data: {
            type:     'cash_reserve_low',
            message:  `⚠️ Quỹ dự trữ chỉ còn ~${reserveDays.toFixed(1)} ngày. Cần bổ sung vốn.`,
            severity: 'high',
          },
        });
      } catch { /* alert table may not exist yet */ }
    }

    return { totalBalance, dailyCost, reserveDays: reserveDays.toFixed(2) };
  }

  // ── Simple linear trend coefficient ─────────────────────────────────────
  _trend(txns) {
    if (txns.length < 2) return 0;
    const first = Number(txns[0].amount);
    const last  = Number(txns[txns.length - 1].amount);
    if (!first) return 0;
    return (last - first) / first / txns.length;
  }
}

module.exports = CashFlowForecast;
