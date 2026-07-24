// @ts-nocheck
'use strict';
/**
 * CLVPredictor — Customer Lifetime Value calculation.
 *
 * Uses a simple Recency-weighted 12-month projection:
 *   projected_monthly = avg_monthly_deposit × recency_weight
 *   CLV_12m           = projected_monthly × 12
 *
 * Stores results in admin DB (opsUserSegment.clv).
 */

class CLVPredictor {
  constructor(gamePrisma, adminPrisma) {
    this.game  = gamePrisma;
    this.admin = adminPrisma;
  }

  // ── Calculate CLV for one user ────────────────────────────────────────────
  async calculate(userId) {
    // userId is a cuid string in game schema
    const uid  = String(userId);
    const cut6 = new Date(Date.now() - 180 * 86400000);

    // 6-month deposit history (lkvipTransaction exists in game schema)
    const txns = await this.game.lkvipTransaction.findMany({
      where:  { userId: uid, type: 'deposit', createdAt: { gte: cut6 } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }).catch(() => []);

    if (!txns.length) return { userId: uid, clv: 0, avgMonthly: 0, months: 0 };

    const totalRevenue = txns.reduce((s, t) => s + Number(t.amount), 0);

    // Span in months (at least 1)
    const first = new Date(txns[0].createdAt).getTime();
    const last  = new Date(txns[txns.length - 1].createdAt).getTime();
    const months = Math.max(1, (last - first) / (30 * 86400000));

    const avgMonthly = totalRevenue / months;

    // Recency weight: penalise users inactive more than 14 days
    const daysSinceLast = (Date.now() - last) / 86400000;
    const recencyWeight = Math.max(0, 1 - daysSinceLast / 30);

    const clv = avgMonthly * recencyWeight * 12;

    // Persist — opsUserSegment.userId is Int; hash cuid to stable int
    const adminUid = Math.abs(uid.split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 0));
    try {
      await this.admin.opsUserSegment.upsert({
        where:  { project_userId: { project: 'game', userId: adminUid } },
        create: { project: 'game', userId: adminUid, segment: 'bronze', clv, avgMonthly },
        update: { clv, avgMonthly, updatedAt: new Date() },
      });
    } catch { /* segment row may not exist yet */ }

    return { userId: uid, clv, avgMonthly, months, recencyWeight };
  }

  // ── Top N users by CLV ────────────────────────────────────────────────────
  async getTopUsers(limit = 20) {
    try {
      return await this.admin.opsUserSegment.findMany({
        where:   { clv: { gt: 0 } },
        orderBy: { clv: 'desc' },
        take:    limit,
        select:  { userId: true, clv: true, avgMonthly: true, segment: true },
      });
    } catch {
      return [];
    }
  }
}

module.exports = CLVPredictor;
