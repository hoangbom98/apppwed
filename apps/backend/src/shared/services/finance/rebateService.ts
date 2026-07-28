// @ts-nocheck
'use strict';
/**
 * RebateService — Daily rebate (hoàn trả) calculation and settlement.
 *
 * Flow:
 *   T+0 23:55 UTC → calculateDailyRebates(date) — create/upsert pending Rebate rows
 *   T+1 01:00 UTC → settleDailyRebates(date)    — pending → claimable
 *   User calls   → claimRebate(userId, rebateId) — claimable → claimed + balance credit
 *   Convenience  → autoClaimAllRebates(userId)   — batch claim all claimable
 *
 * Rate resolution (priority, highest first):
 *   1. Active RebateRule in admin_db matching (project, gameType, period='daily', status='active')
 *   2. DEFAULT_VIP_REBATE_RATES from @lkvip/types (per VIP level + game type)
 *
 * Game type keys (align with GameTypeKey in @lkvip/constants):
 *   'live'    → live casino (Evolution, Goldgate Live)
 *   'slot'    → slot / RNG / fishing (CQ9, PG Soft, JILI, JDB)
 *   'lottery' → lottery products (PC28, KENO, TCG LOTTO)
 *   'sports'  → sports / esports (BTI, SBO, UG2, CMD368)
 *
 * Usage:
 *   const rebateSvc = new RebateService(gamePrisma, logger, adminPrisma?);
 *   await rebateSvc.trackBet(userId, gameType, validBet, totalBet, totalWin, aggregator, date);
 *   await rebateSvc.calculateDailyRebates(date);
 *   await rebateSvc.settleDailyRebates(date);
 *   await rebateSvc.claimRebate(userId, rebateId);
 */

const { Decimal } = require('@prisma/client/runtime/library');

// Default VIP rebate rates — mirrors DEFAULT_VIP_REBATE_RATES from @lkvip/types/src/rebate.ts
// Kept here as plain object to avoid circular import in CommonJS context.
const DEFAULT_VIP_REBATE_RATES = {
  1: { live: 0.004, slot: 0.004, lottery: 0.002, sports: 0.003 },
  2: { live: 0.005, slot: 0.005, lottery: 0.003, sports: 0.004 },
  3: { live: 0.006, slot: 0.006, lottery: 0.004, sports: 0.005 },
  4: { live: 0.007, slot: 0.007, lottery: 0.005, sports: 0.006 },
  5: { live: 0.009, slot: 0.008, lottery: 0.007, sports: 0.008 },
  6: { live: 0.010, slot: 0.009, lottery: 0.008, sports: 0.009 },
  7: { live: 0.011, slot: 0.010, lottery: 0.009, sports: 0.010 },
  8: { live: 0.012, slot: 0.011, lottery: 0.010, sports: 0.011 },
};

class RebateService {
  /**
   * @param {object} prisma       game_db PrismaClient
   * @param {object} logger       Logger instance
   * @param {object} [adminPrisma] admin_db PrismaClient — optional, used to check RebateRule overrides
   */
  constructor(prisma, logger, adminPrisma = null) {
    this.prisma      = prisma;
    this.logger      = logger;
    this.adminPrisma = adminPrisma;
    /** Cache: Map<gameType, number> — populated per calculateDailyRebates call */
    this._ruleCache  = null;
  }

  // ── Rate resolution ─────────────────────────────────────────────────────────

  /**
   * Resolve rebate rate for (vipLevel, gameType).
   * Checks admin_db RebateRule overrides first; falls back to DEFAULT_VIP_REBATE_RATES.
   *
   * @param {number} vipLevel
   * @param {string} gameType  live | slot | lottery | sports
   * @param {Map<string,number>} ruleOverrides  Map<gameType, rate> from _loadRuleOverrides()
   * @returns {number} rebate rate, e.g. 0.0050
   */
  _resolveRate(vipLevel, gameType, ruleOverrides) {
    // 1. Admin override for this game type (takes precedence regardless of VIP level)
    if (ruleOverrides && ruleOverrides.has(gameType)) {
      return ruleOverrides.get(gameType);
    }
    // 2. Default table keyed by VIP level
    const tier = DEFAULT_VIP_REBATE_RATES[vipLevel] ?? DEFAULT_VIP_REBATE_RATES[1];
    return tier[gameType] ?? tier.slot ?? 0.004;
  }

  /**
   * Load active RebateRule overrides from admin_db.
   * Returns Map<gameType, rate> — null gameType rule covers all types.
   *
   * @returns {Promise<Map<string,number>>}
   */
  async _loadRuleOverrides() {
    if (!this.adminPrisma) return new Map();
    try {
      const rules = await this.adminPrisma.rebateRule.findMany({
        where:  { project: 'game', status: 'active', period: 'daily' },
        select: { gameType: true, rebateRate: true },
        orderBy: { sortOrder: 'asc' },
      });
      const map = new Map();
      for (const r of rules) {
        const key = r.gameType || '_all';
        map.set(key, Number(r.rebateRate) / 100); // rebateRate stored as % e.g. 0.50 → 0.005
      }
      return map;
    } catch (err) {
      this.logger.warn('[Rebate] _loadRuleOverrides failed — using defaults', { err: err.message });
      return new Map();
    }
  }

  // ── Track bet ───────────────────────────────────────────────────────────────

  /**
   * Aggregate a settled bet into BetStats (upsert, idempotent by increment).
   * Call this after each bet settles in the game provider callback.
   *
   * @param {string}  userId
   * @param {string}  gameType     live | slot | lottery | sports
   * @param {number}  validBet     valid wager (cancelled/voided rounds excluded)
   * @param {number}  totalBet     gross amount wagered
   * @param {number}  totalWin     gross win amount
   * @param {string}  aggregator   GSC | GOLDGATE | TCGAMING
   * @param {string}  [date]       YYYY-MM-DD (defaults to today UTC)
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
          date:       betDate,
          gameType,
          aggregator,
          validBet:   new Decimal(validBet),
          totalBet:   new Decimal(totalBet),
          totalWin:   new Decimal(totalWin),
          roundCount: 1,
        },
        update: {
          validBet:   { increment: new Decimal(validBet) },
          totalBet:   { increment: new Decimal(totalBet) },
          totalWin:   { increment: new Decimal(totalWin) },
          roundCount: { increment: 1 },
        },
      });
      this.logger.debug(`[Rebate] trackBet userId=${userId} gameType=${gameType} validBet=${validBet} date=${betDate}`);
    } catch (err) {
      this.logger.error(`[Rebate] trackBet failed userId=${userId}`, { err: err.message });
      throw err;
    }
  }

  // ── Calculate pending rebates (T+0 23:55 UTC) ──────────────────────────────

  /**
   * Calculate rebates for all users based on the day's BetStats.
   * Creates Rebate records with status='pending'.
   * Idempotent — uses upsert, safe to re-run.
   *
   * @param {string} [betDate]  YYYY-MM-DD (default today)
   * @returns {Promise<{ created: number, totalAmount: Decimal }>}
   */
  async calculateDailyRebates(betDate = null) {
    const today = betDate || new Date().toISOString().split('T')[0];
    const start = Date.now();
    this.logger.info(`[Rebate] Calculating daily rebates for betDate=${today}`);

    try {
      // 1. Load admin rule overrides
      const ruleOverrides = await this._loadRuleOverrides();

      // 2. Get all BetStats for today where validBet > 0
      const stats = await this.prisma.betStats.findMany({
        where:  { date: today, validBet: { gt: 0 } },
        select: { userId: true, gameType: true, validBet: true },
      });

      if (stats.length === 0) {
        this.logger.info(`[Rebate] No bet stats for ${today}`);
        return { created: 0, totalAmount: new Decimal(0) };
      }

      // 3. Resolve VIP levels for all users in one query
      const userIds = [...new Set(stats.map(s => s.userId))];
      const users = await this.prisma.user.findMany({
        where:  { id: { in: userIds } },
        select: { id: true, vipLevel: true },
      });
      const vipMap = Object.fromEntries(users.map(u => [u.id, u.vipLevel ?? 1]));

      // 4. Aggregate stats by userId+gameType (same user may have multiple rows from different aggregators)
      const grouped = {};
      for (const s of stats) {
        const key = `${s.userId}:${s.gameType}`;
        if (!grouped[key]) {
          grouped[key] = { userId: s.userId, gameType: s.gameType, validBet: new Decimal(0) };
        }
        grouped[key].validBet = grouped[key].validBet.add(new Decimal(s.validBet));
      }

      let created = 0;
      let totalAmount = new Decimal(0);

      // 5. Create / update pending rebate records
      for (const key of Object.keys(grouped)) {
        const { userId, gameType, validBet } = grouped[key];
        const vipLevel = vipMap[userId] ?? 1;
        const rate     = this._resolveRate(vipLevel, gameType, ruleOverrides);
        if (!rate || rate <= 0) continue;

        const rateDecimal  = new Decimal(rate);
        const amount       = validBet.mul(rateDecimal);
        if (amount.lte(0)) continue;

        await this.prisma.rebate.upsert({
          where:  { userId_betDate_gameType: { userId, betDate: today, gameType } },
          create: { userId, betDate: today, gameType, validBet, rate: rateDecimal, amount, vipLevel, status: 'pending' },
          update: { validBet, rate: rateDecimal, amount, vipLevel },
        });

        created++;
        totalAmount = totalAmount.add(amount);
      }

      this.logger.info(
        `[Rebate] Calculated ${created} pending rebates for ${today}, total=${totalAmount.toString()} (${Date.now() - start}ms)`
      );
      return { created, totalAmount };
    } catch (err) {
      this.logger.error(`[Rebate] calculateDailyRebates failed for ${today}`, { err: err.message });
      throw err;
    }
  }

  // ── Settle rebates (T+1 01:00 UTC) ─────────────────────────────────────────

  /**
   * Settle all pending rebates from betDate → status='claimable'.
   * Called by daily cron at 01:00 UTC.
   *
   * @param {string} [betDate]  YYYY-MM-DD (default yesterday)
   * @returns {Promise<{ settled: number, totalAmount: Decimal }>}
   */
  async settleDailyRebates(betDate = null) {
    const yesterday = betDate || this._getYesterday();
    const start = Date.now();
    this.logger.info(`[Rebate] Starting daily settlement for betDate=${yesterday}`);

    try {
      const pending = await this.prisma.rebate.findMany({
        where:  { betDate: yesterday, status: 'pending' },
        select: { id: true, amount: true },
      });

      if (pending.length === 0) {
        this.logger.info(`[Rebate] No pending rebates for ${yesterday}`);
        return { settled: 0, totalAmount: new Decimal(0) };
      }

      const ids = pending.map(r => r.id);
      const { count } = await this.prisma.rebate.updateMany({
        where: { id: { in: ids } },
        data:  { status: 'claimable', settledAt: new Date() },
      });

      const totalAmount = pending.reduce((sum, r) => sum.add(new Decimal(r.amount)), new Decimal(0));
      this.logger.info(
        `[Rebate] Settled ${count} rebates for ${yesterday}, total=${totalAmount.toString()} (${Date.now() - start}ms)`
      );
      return { settled: count, totalAmount };
    } catch (err) {
      this.logger.error(`[Rebate] settleDailyRebates failed for ${yesterday}`, { err: err.message });
      throw err;
    }
  }

  // ── Claim (user-initiated) ──────────────────────────────────────────────────

  /**
   * Claim a single claimable rebate — credit balance, mark claimed.
   *
   * @param {string} userId
   * @param {string} rebateId
   * @returns {Promise<{ amount: Decimal }>}
   */
  async claimRebate(userId, rebateId) {
    try {
      const rebate = await this.prisma.rebate.findUnique({
        where:  { id: rebateId },
        select: { id: true, userId: true, amount: true, status: true, gameType: true, betDate: true },
      });

      if (!rebate) throw Object.assign(new Error('Rebate not found'), { code: 'REBATE_NOT_FOUND' });
      if (rebate.userId !== userId) throw Object.assign(new Error('Rebate does not belong to user'), { code: 'FORBIDDEN' });
      if (rebate.status !== 'claimable') {
        throw Object.assign(
          new Error(`Rebate is ${rebate.status}, not claimable`),
          { code: 'REBATE_NOT_CLAIMABLE' }
        );
      }

      const amount = new Decimal(rebate.amount);

      await this.prisma.$transaction(async (tx) => {
        await tx.rebate.update({
          where: { id: rebateId },
          data:  { status: 'claimed', claimedAt: new Date() },
        });
        const updated = await tx.user.update({
          where:  { id: userId },
          data:   { balance: { increment: amount } },
          select: { balance: true },
        });
        await tx.transaction.create({
          data: {
            userId,
            type:          'rebate',
            amount,
            balanceBefore: new Decimal(updated.balance).sub(amount),
            balanceAfter:  new Decimal(updated.balance),
            referenceId:   rebateId,
            referenceType: 'rebate',
            note:          `Rebate ${rebate.gameType} — ${rebate.betDate}`,
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

  // ── Batch auto-claim ────────────────────────────────────────────────────────

  /**
   * Batch-claim all claimable rebates for a user (convenience).
   *
   * @param {string} userId
   * @returns {Promise<{ claimed: number, totalAmount: Decimal }>}
   */
  async autoClaimAllRebates(userId) {
    try {
      const claimable = await this.prisma.rebate.findMany({
        where:  { userId, status: 'claimable' },
        select: { id: true, amount: true },
      });

      if (claimable.length === 0) return { claimed: 0, totalAmount: new Decimal(0) };

      let claimed = 0;
      let totalAmount = new Decimal(0);

      for (const rebate of claimable) {
        try {
          await this.claimRebate(userId, rebate.id);
          claimed++;
          totalAmount = totalAmount.add(new Decimal(rebate.amount));
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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  _getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
}

module.exports = RebateService;
