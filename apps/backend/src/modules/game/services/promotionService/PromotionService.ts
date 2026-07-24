// @ts-nocheck
/**
 * PromotionService — bonus, cashback, free-spin, and wagering requirement engine.
 *
 * Promotion types:
 *   'deposit_bonus'   – e.g. 100% first deposit up to 500k VND
 *   'cashback'        – % of net loss returned (weekly/monthly)
 *   'free_spin'       – N free spins on a specific game or category
 *   'welcome'         – one-time welcome bundle
 *   'referral_bonus'  – bonus credited when a referral makes their first deposit
 *   'custom'          – admin-defined amount with no wagering
 *
 * Wagering requirement:
 *   To prevent immediate withdrawal of bonus funds, a wager multiplier is set
 *   (e.g. 10x means user must bet 10× the bonus before it becomes withdrawable).
 *   Wagering progress is tracked in the promoUsage record.
 *
 * Schema required (game_db):
 *   Promotion    { id, type, name, code?, value, maxBonus, minDeposit,
 *                  wagerMultiplier, maxClaimsPerUser, totalClaims, maxTotalClaims,
 *                  startAt, endAt, status, targetGameIds, metadata }
 *   PromoUsage   { id, userId, promotionId, status, bonusAmount, wageredAmount,
 *                  requiredWager, claimedAt, completedAt }
 */
const logger        = require('@shared/services/logger');
const ConfigService = require('@shared/services/configService');
const auditService  = require('@shared/services/auditService');

const PROMO_TYPES = ['deposit_bonus', 'cashback', 'free_spin', 'welcome', 'referral_bonus', 'custom'];
const STATUS = { ACTIVE: 'active', CLAIMED: 'claimed', COMPLETED: 'completed', EXPIRED: 'expired', CANCELLED: 'cancelled' };

class PromotionService {
  /**
   * @param {object} prisma        – game_db Prisma client
   * @param {string} projectCode   – 'game'
   * @param {object} adminPrisma   – admin_db client for ConfigService (optional)
   */
  constructor(prisma, projectCode = 'game', adminPrisma = null) {
    this.prisma        = prisma;
    this.projectCode   = projectCode;
    this.configService = new ConfigService(adminPrisma || prisma);
  }

  // ── Public listing ────────────────────────────────────────────────────────────

  /**
   * List active promotions available to a user.
   * Filters out fully-claimed, expired, and already-used promotions.
   *
   * @param {string|number|null} userId
   * @param {{ type?: string, skip?: number, take?: number }} opts
   */
  async listActive(userId = null, { type, skip = 0, take = 20 } = {}) {
    const now   = new Date();
    const where = {
      status:  STATUS.ACTIVE,
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
      ...(type && { type }),
    };

    const promos = await this.prisma.promotion.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
    });

    if (!userId) return promos;

    // Filter out fully exhausted or already-claimed promos for this user
    const usage = await this.prisma.promoUsage.findMany({
      where:  { userId, promotionId: { in: promos.map(p => p.id) } },
      select: { promotionId: true, status: true },
    });
    const usageMap = new Map(usage.map(u => [u.promotionId, u.status]));

    return promos
      .filter(p => {
        const used = usageMap.get(p.id);
        if (used && used !== STATUS.EXPIRED && used !== STATUS.CANCELLED) return false;
        if (p.maxTotalClaims && p.totalClaims >= p.maxTotalClaims) return false;
        return true;
      })
      .map(p => ({
        ...p,
        claimed: !!usageMap.get(p.id),
      }));
  }

  /**
   * Get a single promotion by ID or code.
   */
  async getPromotion({ id, code }) {
    if (id) return this.prisma.promotion.findUnique({ where: { id: parseInt(id) } });
    if (code) return this.prisma.promotion.findFirst({ where: { code } });
    throw new Error('id or code required');
  }

  // ── Claim ─────────────────────────────────────────────────────────────────────

  /**
   * Claim a promotion for a user.
   * Validates eligibility, calculates bonus, records usage.
   *
   * @param {string|number} userId
   * @param {string|number} promotionId
   * @param {{ depositAmount?: number }} context  – used for deposit_bonus calculation
   * @returns {Promise<{ usage: object, bonusAmount: number, freeSpin: number }>}
   */
  async claim(userId, promotionId, context = {}) {
    const promo = await this.prisma.promotion.findUnique({
      where: { id: parseInt(promotionId) },
    });
    if (!promo) throw new Error('Khuyến mãi không tồn tại');

    // Validate availability
    await this._validateEligibility(userId, promo, context);

    // Calculate bonus amount
    const { bonusAmount, freeSpin } = this._calculateBonus(promo, context);

    // Record claim in a transaction
    const usage = await this.prisma.$transaction(async (t) => {
      const requiredWager = bonusAmount > 0
        ? parseFloat((bonusAmount * (promo.wagerMultiplier || 1)).toFixed(2))
        : 0;

      const u = await t.promoUsage.create({
        data: {
          userId,
          promotionId:   promo.id,
          status:        STATUS.CLAIMED,
          bonusAmount,
          wageredAmount: 0,
          requiredWager,
          claimedAt:     new Date(),
        },
      });

      // Increment totalClaims on the promotion
      await t.promotion.update({
        where: { id: promo.id },
        data:  { totalClaims: { increment: 1 } },
      });

      // Credit bonus to user balance (if money bonus)
      if (bonusAmount > 0) {
        await t.user.update({
          where: { id: userId },
          data:  { balance: { increment: bonusAmount } },
        });
        await t.transaction.create({
          data: {
            userId,
            type:   'promo_bonus',
            amount: bonusAmount,
            note:   `Bonus: ${promo.name}`,
          },
        });
      }

      return u;
    });

    await auditService.log({
      action:  'promo.claim',
      userId,
      project: this.projectCode,
      meta:    { promotionId: promo.id, type: promo.type, bonusAmount, freeSpin },
    });

    logger.info(
      `[Promo] claim userId=${userId} promoId=${promo.id} type=${promo.type} bonus=${bonusAmount}`
    );

    return { usage, bonusAmount, freeSpin };
  }

  // ── Wagering progress ─────────────────────────────────────────────────────────

  /**
   * Record a bet against active wagering requirements for a user.
   * Marks the usage as COMPLETED when wagering is satisfied.
   *
   * @param {string|number} userId
   * @param {number}        betAmount   – gross bet amount
   * @param {string|number} [gameId]    – for game-specific wagering checks
   */
  async recordWager(userId, betAmount, gameId = null) {
    // Find all active (claimed, not yet completed) usages with wagering requirement
    const activeUsages = await this.prisma.promoUsage.findMany({
      where: {
        userId,
        status:        STATUS.CLAIMED,
        requiredWager: { gt: 0 },
      },
      include: { promotion: true },
    });

    for (const usage of activeUsages) {
      const promo = usage.promotion;

      // Check if the game qualifies for wagering on this promo
      if (gameId && promo.targetGameIds?.length > 0) {
        if (!promo.targetGameIds.includes(String(gameId))) continue;
      }

      const newWagered  = parseFloat((Number(usage.wageredAmount) + betAmount).toFixed(2));
      const isCompleted = newWagered >= Number(usage.requiredWager);

      await this.prisma.promoUsage.update({
        where: { id: usage.id },
        data:  {
          wageredAmount: newWagered,
          status:        isCompleted ? STATUS.COMPLETED : STATUS.CLAIMED,
          completedAt:   isCompleted ? new Date() : null,
        },
      });

      if (isCompleted) {
        logger.info(
          `[Promo] wagering complete userId=${userId} usageId=${usage.id} promoId=${promo.id}`
        );
        await auditService.log({
          action:  'promo.wagering_complete',
          userId,
          project: this.projectCode,
          meta:    { usageId: usage.id, promotionId: promo.id, wagered: newWagered },
        });
      }
    }
  }

  // ── Cashback ──────────────────────────────────────────────────────────────────

  /**
   * Calculate and award cashback to a user for a given period.
   * Cashback = netLoss × cashbackRate (from user's VIP tier or promo config).
   *
   * @param {string|number} userId
   * @param {'weekly'|'monthly'} period
   * @param {Date} from
   * @param {Date} to
   * @returns {Promise<{ credited: number }|null>}
   */
  async awardCashback(userId, period = 'weekly', from, to) {
    // Get cashback promotions
    const promos = await this.prisma.promotion.findMany({
      where: { type: 'cashback', status: STATUS.ACTIVE },
    });
    if (!promos.length) return null;

    // Sum user's net loss for the period
    const agg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        createdAt: { gte: from, lte: to },
        type:      { in: ['bet', 'win', 'loss'] },
      },
      _sum: { amount: true },
    });

    const netLoss = Math.max(0, -(Number(agg._sum?.amount ?? 0)));
    if (netLoss <= 0) return { credited: 0 };

    const promo    = promos[0];  // apply first matching cashback promo
    const rate     = Number(promo.value) / 100;
    const maxBonus = Number(promo.maxBonus || Infinity);
    const credited = Math.min(parseFloat((netLoss * rate).toFixed(2)), maxBonus);

    if (credited <= 0) return { credited: 0 };

    await this.prisma.$transaction(async (t) => {
      await t.user.update({
        where: { id: userId },
        data:  { balance: { increment: credited } },
      });
      await t.transaction.create({
        data: {
          userId,
          type:   'cashback',
          amount: credited,
          note:   `Cashback ${period} từ ${from.toISOString().slice(0, 10)} đến ${to.toISOString().slice(0, 10)}`,
        },
      });
    });

    logger.info(`[Promo] cashback userId=${userId} period=${period} netLoss=${netLoss} credited=${credited}`);
    return { credited };
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────────────

  async create(data) {
    this._validateType(data.type);
    return this.prisma.promotion.create({ data: { ...data, totalClaims: 0, status: STATUS.ACTIVE } });
  }

  async update(id, data) {
    if (data.type) this._validateType(data.type);
    return this.prisma.promotion.update({ where: { id: parseInt(id) }, data });
  }

  async deactivate(id) {
    return this.prisma.promotion.update({
      where: { id: parseInt(id) },
      data:  { status: 'inactive' },
    });
  }

  async getUsageStats(promotionId) {
    const [total, completed] = await Promise.all([
      this.prisma.promoUsage.count({ where: { promotionId: parseInt(promotionId) } }),
      this.prisma.promoUsage.count({ where: { promotionId: parseInt(promotionId), status: STATUS.COMPLETED } }),
    ]);
    const agg = await this.prisma.promoUsage.aggregate({
      where: { promotionId: parseInt(promotionId) },
      _sum:  { bonusAmount: true },
    });
    return { total, completed, totalBonusCredited: Number(agg._sum?.bonusAmount ?? 0) };
  }

  // ── User queries ──────────────────────────────────────────────────────────────

  async getUserClaims(userId, { skip = 0, take = 20 } = {}) {
    const [data, total] = await Promise.all([
      this.prisma.promoUsage.findMany({
        where:   { userId },
        skip,
        take,
        orderBy: { claimedAt: 'desc' },
        include: { promotion: { select: { name: true, type: true } } },
      }),
      this.prisma.promoUsage.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  async _validateEligibility(userId, promo, context) {
    const now = new Date();
    if (promo.status !== STATUS.ACTIVE) throw new Error('Khuyến mãi không còn hoạt động');
    if (promo.startAt && promo.startAt > now) throw new Error('Khuyến mãi chưa bắt đầu');
    if (promo.endAt && promo.endAt < now) throw new Error('Khuyến mãi đã hết hạn');
    if (promo.maxTotalClaims && promo.totalClaims >= promo.maxTotalClaims) {
      throw new Error('Khuyến mãi đã hết lượt nhận');
    }

    // Per-user claim limit
    const maxPerUser = promo.maxClaimsPerUser || 1;
    const userClaims = await this.prisma.promoUsage.count({
      where: { userId, promotionId: promo.id, status: { notIn: [STATUS.CANCELLED] } },
    });
    if (userClaims >= maxPerUser) throw new Error('Bạn đã nhận khuyến mãi này rồi');

    // Min deposit check
    if (promo.type === 'deposit_bonus' && promo.minDeposit) {
      const depositAmount = Number(context.depositAmount ?? 0);
      if (depositAmount < Number(promo.minDeposit)) {
        throw new Error(`Cần nạp tối thiểu ${Number(promo.minDeposit).toLocaleString('vi-VN')} để nhận bonus này`);
      }
    }
  }

  _calculateBonus(promo, context) {
    let bonusAmount = 0;
    let freeSpin    = 0;

    switch (promo.type) {
      case 'deposit_bonus': {
        const deposit  = Number(context.depositAmount ?? 0);
        const rate     = Number(promo.value) / 100;
        const maxBonus = Number(promo.maxBonus || Infinity);
        bonusAmount    = Math.min(parseFloat((deposit * rate).toFixed(2)), maxBonus);
        break;
      }
      case 'free_spin':
        freeSpin    = Number(promo.value || 0);
        bonusAmount = 0;
        break;
      case 'welcome':
      case 'custom':
      case 'referral_bonus':
        bonusAmount = parseFloat(Number(promo.value || 0).toFixed(2));
        break;
      default:
        bonusAmount = 0;
    }

    return { bonusAmount, freeSpin };
  }

  _validateType(type) {
    if (!PROMO_TYPES.includes(type)) {
      throw new Error(`Invalid promotion type: "${type}". Must be one of: ${PROMO_TYPES.join(', ')}`);
    }
  }
}

module.exports = PromotionService;
