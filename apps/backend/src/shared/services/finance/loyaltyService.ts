// @ts-nocheck
/**
 * LoyaltyService — point earn/debit, VIP tier management, and redemption.
 *
 * Used by: Game (VIP levels, cashback), Dating (gamification, level-ups).
 *
 * Tier progression and earn rates are read from ProjectConfig so admins
 * can adjust them without a deployment:
 *   projectCode='game' module='loyalty' group='tiers'  key='tier1_min_points'  value=0
 *   projectCode='game' module='loyalty' group='tiers'  key='tier2_min_points'  value=1000
 *   projectCode='game' module='loyalty' group='earn'   key='deposit'           value=1      (1 point per VND unit)
 *   projectCode='game' module='loyalty' group='redeem' key='rate'              value=1000   (1000 points = 1 VND)
 *
 * Schema required on the project's `user` model:
 *   loyaltyPoints  Int    @default(0)
 *   vipLevel       Int    @default(1)   (or String for named tiers)
 *   lifetimePoints Int    @default(0)   (for tier calculation — never decrements)
 *
 * Schema required on the project's `loyaltyTransaction` model:
 *   id, userId, type, points, balanceAfter, description, createdAt
 */
const logger        = require('../logger');
const ConfigService = require('../configService');
const auditService  = require('./auditService');

// Default tiers: [{ level, name, minPoints, earnMultiplier, cashbackRate }]
const DEFAULT_TIERS = [
  { level: 1, name: 'Bronze',   minPoints: 0,      earnMultiplier: 1.0, cashbackRate: 0.00 },
  { level: 2, name: 'Silver',   minPoints: 1000,   earnMultiplier: 1.2, cashbackRate: 0.01 },
  { level: 3, name: 'Gold',     minPoints: 5000,   earnMultiplier: 1.5, cashbackRate: 0.02 },
  { level: 4, name: 'Platinum', minPoints: 20000,  earnMultiplier: 2.0, cashbackRate: 0.03 },
  { level: 5, name: 'Diamond',  minPoints: 100000, earnMultiplier: 3.0, cashbackRate: 0.05 },
];

// Default earn rates: { action → points per 1 VND/unit of base amount }
const DEFAULT_EARN_RATES = {
  deposit:   1,    // 1 point per 1000 VND deposited  (applied after dividing)
  bet:       0.5,
  trade:     0.2,
  purchase:  1,
};
const DEFAULT_POINTS_PER_UNIT = 1000;  // 1 point per 1000 VND

class LoyaltyService {
  /**
   * @param {object} prisma        – project Prisma client
   * @param {string} projectCode   – 'game' | 'dating' | etc.
   * @param {object} adminPrisma   – admin_db client for ConfigService (optional)
   */
  constructor(prisma, projectCode, adminPrisma = null) {
    this.prisma        = prisma;
    this.projectCode   = projectCode;
    this.configService = new ConfigService(adminPrisma || prisma);
  }

  // ── Point earn / debit ───────────────────────────────────────────────────────

  /**
   * Award loyalty points for a qualifying action.
   * Automatically checks tier and upgrades if threshold crossed.
   *
   * @param {string|number} userId
   * @param {string}        action       – 'deposit' | 'bet' | 'trade' | 'purchase' | 'custom'
   * @param {number}        baseAmount   – the VND/unit amount the earn rate applies to
   * @param {string}        [description]
   * @returns {Promise<{ points: number, newBalance: number, tierUpgraded: boolean, newTier: number }>}
   */
  async earnPoints(userId, action, baseAmount, description = '') {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { loyaltyPoints: true, vipLevel: true, lifetimePoints: true },
    });
    if (!user) throw new Error('User not found');

    // Calculate points to award
    const earnRate     = await this._getEarnRate(action);
    const perUnit      = await this._getConfigNumber('pointsPerUnit', DEFAULT_POINTS_PER_UNIT);
    const tierMulti    = await this._getTierMultiplier(user.vipLevel || 1);
    const rawPoints    = (baseAmount / perUnit) * earnRate * tierMulti;
    const points       = Math.max(1, Math.floor(rawPoints));

    // Atomic update
    const updated = await this.prisma.$transaction(async (t) => {
      const u = await t.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints:  { increment: points },
          lifetimePoints: { increment: points },
        },
        select: { loyaltyPoints: true, lifetimePoints: true, vipLevel: true },
      });
      await t.loyaltyTransaction.create({
        data: {
          userId,
          type:         'earn',
          points,
          balanceAfter: Number(u.loyaltyPoints),
          description:  description || `${action} +${points}pts`,
        },
      });
      return u;
    });

    // Check tier upgrade
    const { tierUpgraded, newTier } = await this._checkTierUpgrade(
      userId,
      Number(updated.lifetimePoints),
      Number(updated.vipLevel),
    );

    logger.info(`[Loyalty] earn userId=${userId} action=${action} points=${points} balance=${updated.loyaltyPoints}`);
    return {
      points,
      newBalance:   Number(updated.loyaltyPoints),
      tierUpgraded,
      newTier:      tierUpgraded ? newTier : (updated.vipLevel),
    };
  }

  /**
   * Deduct loyalty points (redeem or penalty).
   * Throws if insufficient points.
   *
   * @param {string|number} userId
   * @param {number}        points
   * @param {string}        type   – 'redeem' | 'expire' | 'penalty'
   * @param {string}        [description]
   * @returns {Promise<{ newBalance: number }>}
   */
  async debitPoints(userId, points, type = 'redeem', description = '') {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { loyaltyPoints: true },
    });
    if (!user) throw new Error('User not found');
    if (Number(user.loyaltyPoints) < points) throw new Error('Không đủ điểm tích lũy');

    const updated = await this.prisma.$transaction(async (t) => {
      const u = await t.user.update({
        where: { id: userId },
        data:  { loyaltyPoints: { decrement: points } },
        select: { loyaltyPoints: true },
      });
      await t.loyaltyTransaction.create({
        data: {
          userId,
          type,
          points:       -points,
          balanceAfter: Number(u.loyaltyPoints),
          description:  description || `${type} -${points}pts`,
        },
      });
      return u;
    });

    logger.info(`[Loyalty] debit userId=${userId} type=${type} points=${points} balance=${updated.loyaltyPoints}`);
    return { newBalance: Number(updated.loyaltyPoints) };
  }

  // ── Redemption ───────────────────────────────────────────────────────────────

  /**
   * Redeem points for balance (points → VND credit).
   * Uses configService redemption rate.
   *
   * @param {string|number} userId
   * @param {number}        points   – number of points to redeem
   * @returns {Promise<{ points: number, credited: number, newPointBalance: number }>}
   */
  async redeemForBalance(userId, points) {
    const redeemRate = await this._getConfigNumber('redeemRate', 1000);  // 1000 pts = 1 VND
    const credited   = parseFloat((points / redeemRate).toFixed(2));
    if (credited <= 0) throw new Error('Số điểm quá thấp để đổi');

    const WalletService = require('./walletService');
    const walletSvc     = new WalletService(this.prisma);

    await this.debitPoints(userId, points, 'redeem', `Đổi ${points} điểm → ${credited} VND`);
    await walletSvc.credit(this.prisma, userId, credited, 'loyalty_redeem', `Đổi điểm tích lũy`);

    await auditService.log({
      action:  'loyalty.redeem',
      userId,
      project: this.projectCode,
      meta:    { points, credited, redeemRate },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { loyaltyPoints: true },
    });
    return { points, credited, newPointBalance: Number(user?.loyaltyPoints ?? 0) };
  }

  // ── Tiers ────────────────────────────────────────────────────────────────────

  /**
   * Get all configured tier definitions for this project.
   * @returns {Promise<Array<{level, name, minPoints, earnMultiplier, cashbackRate}>>}
   */
  async getTiers() {
    const rawTiers = await this.configService.get(
      this.projectCode, 'loyalty', 'tiers', 'config', null
    );
    if (rawTiers && Array.isArray(rawTiers)) return rawTiers;
    return DEFAULT_TIERS;
  }

  /**
   * Get balance and tier info for a user.
   */
  async getUserLoyalty(userId) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { loyaltyPoints: true, vipLevel: true, lifetimePoints: true },
    });
    if (!user) return null;

    const tiers   = await this.getTiers();
    const current = tiers.find(t => t.level === (user.vipLevel || 1)) || tiers[0];
    const next    = tiers.find(t => t.level === (user.vipLevel || 1) + 1);

    return {
      points:         Number(user.loyaltyPoints),
      lifetimePoints: Number(user.lifetimePoints || 0),
      tier:           current,
      nextTier:       next || null,
      pointsToNext:   next ? Math.max(0, next.minPoints - Number(user.lifetimePoints || 0)) : 0,
    };
  }

  /**
   * Get transaction history for a user.
   */
  async getHistory(userId, { skip = 0, take = 20 } = {}) {
    const [data, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where:   { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loyaltyTransaction.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  async _checkTierUpgrade(userId, lifetimePoints, currentLevel) {
    const tiers = await this.getTiers();
    // Find highest tier the user qualifies for
    let newLevel = currentLevel;
    for (const tier of [...tiers].reverse()) {
      if (lifetimePoints >= tier.minPoints && tier.level > newLevel) {
        newLevel = tier.level;
        break;
      }
    }

    if (newLevel <= currentLevel) return { tierUpgraded: false, newTier: currentLevel };

    await this.prisma.user.update({
      where: { id: userId },
      data:  { vipLevel: newLevel },
    });

    await auditService.log({
      action:  'loyalty.tier_upgrade',
      userId,
      project: this.projectCode,
      meta:    { oldTier: currentLevel, newTier: newLevel },
    });

    logger.info(`[Loyalty] tier upgrade userId=${userId} ${currentLevel}→${newLevel}`);
    return { tierUpgraded: true, newTier: newLevel };
  }

  async _getEarnRate(action) {
    const r = await this.configService.get(
      this.projectCode, 'loyalty', 'earn', action, DEFAULT_EARN_RATES[action] ?? 1
    );
    return Number(r);
  }

  async _getTierMultiplier(vipLevel) {
    const tiers = await this.getTiers();
    const tier  = tiers.find(t => t.level === vipLevel);
    return Number(tier?.earnMultiplier ?? 1.0);
  }

  async _getConfigNumber(key, fallback) {
    const val = await this.configService.get(this.projectCode, 'loyalty', 'config', key, fallback);
    return Number(val ?? fallback);
  }
}

module.exports = LoyaltyService;
