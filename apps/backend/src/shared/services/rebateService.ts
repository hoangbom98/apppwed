// @ts-nocheck
'use strict';
/**
 * Rebate / Cashback Service — Learned from BoYue RebateService pattern
 * 
 * Flow:
 *   1. Each bet → tracked in BetStats (aggregated daily per user per gameType)
 *   2. T+0 end-of-day (23:59) → calculate pending rebates
 *   3. T+1 daily cron (01:00) → settle pending → claimable
 *   4. User claims → claimable → claimed (credit to balance)
 * 
 * Rebate rate configured per VIP level in VipLevel.cashbackRate.
 * 
 * Game type mapping (aligned with BoYue):
 *   live     → live casino (evolution, goldgate live)
 *   slot     → RNG / slot / fishing (CQ9, PG Soft, JILI, JDB)
 *   lottery  → lottery / lotto products (TCG LOTTO, PC28, KENO)
 *   sports   → sports / esports (BTI, SBO, UG2, CMD368)
 * 
 * Usage:
 *   const rebateSvc = new RebateService(gamePrisma, logger);
 *   await rebateSvc.trackBet(userId, gameType, validBet, totalBet, totalWin, aggregator, date);
 *   await rebateSvc.settleDailyRebates(date); // T+1 cron
 *   await rebateSvc.claimRebate(userId, rebateId);
 */

const { Decimal } = require('@prisma/client/runtime/library');

class RebateService {
  /**
   * @param {object} prisma  game_db PrismaClient
   * @param {object} logger  Logger instance
   */
  constructor(prisma, logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  // ── Track bet (called after each bet settles) ───────────────────────────────
  /**
   * Aggregate bet into BetStats (upsert).
   * 
   * @param {string}  userId
   * @param {string}  gameType     live | slot | lottery | sports
   * @param {Decimal} validBet     valid wager amount (excludes cancelled/voided)
   * @param {Decimal} totalBet     gross bet placed
   * @param {Decimal} totalWin     gross win received
   * @param {string}  aggregator   GSC | GOLDGATE | TCGAMING
   * @param {string}  date         "YYYY-MM-DD" (default today)
   */
  async trackBet(userId, gameType, validBet, totalBet, totalWin, aggregator = '', date = null) {
    const betDate = date || new Date().toISOString().split('T')[0];
    try {
      await this.prisma.betStats.upsert({
        where: {
          userId_date_gameType_aggregator: { userId, date: betDate, gameType, aggregator },
        },
        create: {
          userId,
          date: betDate,
          gameType,
          aggregator,
          validBet: new Decimal(validBet),
          totalBet: new Decimal(totalBet),
          totalWin: new Decimal(totalWin),
          roundCount: 1,
        },
        update: {
          validBet:   { increment: new Decimal(validBet) },
          totalBet:   { increment: new Decimal(totalBet) },
          totalWin:   { increment: new Decimal(totalWin) },
          roundCount: { increment: 1 },
        },
      });
      this.logger.debug(`[Rebate] tracked bet userId=${userId} gameType=${gameType} validBet=${validBet} date=${betDate}`);
    } catch (err) {
      this.logger.error(`[Rebate] trackBet failed userId=${userId}`, { err: err.message });
      throw err;
    }
  }

  // ── Daily rebate settlement (T+1 cron — settle yesterday's pending rebates) ──
  /**
   * Run daily at 01:00 UTC — settle all pending rebates from yesterday (T).
   * Pending → claimable (user can claim manually or auto-credit).
   * 
   * @param {string} betDate  "YYYY-MM-DD" — the betting date to settle (default yesterday)
   * @returns {Promise<{ settled: number, totalAmount: Decimal }>}
   */
  async settleDailyRebates(betDate = null) {
    const yesterday = betDate || this._getYesterday();
    const start = Date.now();
    this.logger.info(`[Rebate] Starting daily settlement for betDate=${yesterday}`);

    try {
      // 1. Get all pending rebates for betDate
      const pending = await this.prisma.rebate.findMany({
        where: { betDate: yesterday, status: 'pending' },
        select: { id: true, userId: true, amount: true },
      });

      if (pending.length === 0) {
        this.logger.info(`[Rebate] No pending rebates for ${yesterday}`);
        return { settled: 0, totalAmount: new Decimal(0) };
      }

      // 2. Update status → claimable
      const ids = pending.map(r => r.id);
      const { count } = await this.prisma.rebate.updateMany({
        where: { id: { in: ids } },
        data: { status: 'claimable', settledAt: new Date() },
      });

      const totalAmount = pending.reduce((sum, r) => sum.add(r.amount), new Decimal(0));
      this.logger.info(`[Rebate] Settled ${count} rebates for ${yesterday}, total=${totalAmount.toString()} (${Date.now() - start}ms)`);

      return { settled: count, totalAmount };
    } catch (err) {
      this.logger.error(`[Rebate] settleDailyRebates failed for ${yesterday}`, { err: err.message });
      throw err;
    }
  }

  // ── Calculate and create pending rebates (run end-of-day T+0 23:59) ─────────
  /**
   * Calculate rebate for all users based on today's BetStats.
   * Creates Rebate records with status=pending.
   * Should run daily at 23:59 UTC (or 00:05 next day is fine).
   * 
   * @param {string} betDate  "YYYY-MM-DD" (default today)
   * @returns {Promise<{ created: number, totalAmount: Decimal }>}
   */
  async calculateDailyRebates(betDate = null) {
    const today = betDate || new Date().toISOString().split('T')[0];
    const start = Date.now();
    this.logger.info(`[Rebate] Calculating daily rebates for betDate=${today}`);

    try {
      // 1. Get all BetStats for today (validBet > 0)
      const stats = await this.prisma.betStats.findMany({
        where: { date: today, validBet: { gt: 0 } },
        select: { userId: true, gameType: true, validBet: true },
      });

      if (stats.length === 0) {
        this.logger.info(`[Rebate] No bet stats for ${today}`);
        return { created: 0, totalAmount: new Decimal(0) };
      }

      // 2. Get VIP levels for all users (for cashback rate)
      const userIds = [...new Set(stats.map(s => s.userId))];
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, vipLevel: true },
      });
      const vipMap = Object.fromEntries(users.map(u => [u.id, u.vipLevel]));

      // 3. Get VIP cashback rates
      const vipLevels = await this.prisma.vipLevel.findMany({
        select: { level: true, cashbackRate: true },
      });
      const rateMap = Object.fromEntries(vipLevels.map(v => [v.level, v.cashbackRate]));

      // 4. Create pending rebates (group by userId + gameType)
      const grouped = {};
      for (const s of stats) {
        const key = `${s.userId}:${s.gameType}`;
        if (!grouped[key]) grouped[key] = { userId: s.userId, gameType: s.gameType, validBet: new Decimal(0) };
        grouped[key].validBet = grouped[key].validBet.add(s.validBet);
      }

      let created = 0;
      let totalAmount = new Decimal(0);

      for (const key in grouped) {
        const { userId, gameType, validBet } = grouped[key];
        const vipLevel = vipMap[userId] || 1;
        const rate = rateMap[vipLevel] || new Decimal(0);
        if (rate.lte(0)) continue; // skip if no rebate rate

        const amount = validBet.mul(rate);
        if (amount.lte(0)) continue;

        // Upsert rebate (in case multiple calls)
        await this.prisma.rebate.upsert({
          where: { userId_betDate_gameType: { userId, betDate: today, gameType } },
          create: {
            userId,
            betDate: today,
            gameType,
            validBet,
            rate,
            amount,
            vipLevel,
            status: 'pending',
          },
          update: {
            validBet,
            rate,
            amount,
            vipLevel,
          },
        });

        created++;
        totalAmount = totalAmount.add(amount);
      }

      this.logger.info(`[Rebate] Created ${created} pending rebates for ${today}, total=${totalAmount.toString()} (${Date.now() - start}ms)`);
      return { created, totalAmount };
    } catch (err) {
      this.logger.error(`[Rebate] calculateDailyRebates failed for ${today}`, { err: err.message });
      throw err;
    }
  }

  // ── Claim rebate (user manually claims, or auto-credit) ─────────────────────
  /**
   * Claim a claimable rebate → credit user balance, mark as claimed.
   * 
   * @param {string} userId
   * @param {string} rebateId
   * @returns {Promise<{ amount: Decimal }>}
   */
  async claimRebate(userId, rebateId) {
    try {
      const rebate = await this.prisma.rebate.findUnique({
        where: { id: rebateId },
        select: { id: true, userId: true, amount: true, status: true, gameType: true, betDate: true },
      });

      if (!rebate) throw new Error('Rebate not found');
      if (rebate.userId !== userId) throw new Error('Rebate does not belong to user');
      if (rebate.status !== 'claimable') throw new Error(`Rebate status is ${rebate.status}, not claimable`);

      const amount = new Decimal(rebate.amount);

      // Transaction: update rebate + credit user balance + create transaction
      await this.prisma.$transaction(async (tx) => {
        // 1. Update rebate → claimed
        await tx.rebate.update({
          where: { id: rebateId },
          data: { status: 'claimed', claimedAt: new Date() },
        });

        // 2. Credit user balance
        const user = await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: amount } },
          select: { balance: true },
        });

        // 3. Create transaction record
        await tx.transaction.create({
          data: {
            userId,
            type: 'rebate',
            amount,
            balanceBefore: new Decimal(user.balance).sub(amount),
            balanceAfter: user.balance,
            referenceId: rebateId,
            referenceType: 'rebate',
            note: `Rebate claim: ${rebate.gameType} on ${rebate.betDate}`,
          },
        });
      });

      this.logger.info(`[Rebate] Claimed rebateId=${rebateId} userId=${userId} amount=${amount.toString()}`);
      return { amount };
    } catch (err) {
      this.logger.error(`[Rebate] claimRebate failed rebateId=${rebateId} userId=${userId}`, { err: err.message });
      throw err;
    }
  }

  // ── Auto-claim all claimable rebates for a user (convenience method) ────────
  /**
   * Auto-claim all claimable rebates for a user (batch).
   * 
   * @param {string} userId
   * @returns {Promise<{ claimed: number, totalAmount: Decimal }>}
   */
  async autoClaimAllRebates(userId) {
    try {
      const claimable = await this.prisma.rebate.findMany({
        where: { userId, status: 'claimable' },
        select: { id: true, amount: true },
      });

      if (claimable.length === 0) {
        return { claimed: 0, totalAmount: new Decimal(0) };
      }

      let claimed = 0;
      let totalAmount = new Decimal(0);

      for (const rebate of claimable) {
        try {
          await this.claimRebate(userId, rebate.id);
          claimed++;
          totalAmount = totalAmount.add(rebate.amount);
        } catch (err) {
          this.logger.warn(`[Rebate] autoClaimAllRebates skip rebateId=${rebate.id}`, { err: err.message });
        }
      }

      this.logger.info(`[Rebate] Auto-claimed ${claimed} rebates for userId=${userId} total=${totalAmount.toString()}`);
      return { claimed, totalAmount };
    } catch (err) {
      this.logger.error(`[Rebate] autoClaimAllRebates failed userId=${userId}`, { err: err.message });
      throw err;
    }
  }

  // ── Helper: yesterday date string ──────────────────────────────────────────
  _getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
}

module.exports = RebateService;
