// @ts-nocheck
'use strict';
/**
 * Sports Promotion Controller — Lì xì / Bonus / FreeBet
 *
 * Models used: Promotion, PromotionClaim (sports_db)
 *
 * Routes wired in routes/index.ts:
 *   GET  /api/sports/promotions              — list active promotions
 *   GET  /api/sports/promotions/my           — user's claim history (auth)
 *   GET  /api/sports/promotions/:id          — promotion detail
 *   POST /api/sports/promotions/:id/claim    — claim promotion (auth)
 */
const { success, created, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

// ── GET /api/sports/promotions ────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const now  = new Date();
    const where = {
      isActive:  true,
      startDate: { lte: now },
      endDate:   { gte: now },
    };
    if (req.query.type) where.type = req.query.type;

    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.promotion.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, description: true, type: true,
          value: true, minBet: true, maxClaim: true,
          startDate: true, endDate: true, createdAt: true,
        },
      }),
      req.prisma.promotion.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/sports/promotions/my ─────────────────────────────────────────────
exports.my = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await Promise.all([
      req.prisma.promotionClaim.findMany({
        where,
        skip,
        take,
        orderBy: { claimedAt: 'desc' },
        include: {
          promotion: {
            select: { id: true, name: true, type: true, description: true },
          },
        },
      }),
      req.prisma.promotionClaim.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/sports/promotions/:id ────────────────────────────────────────────
exports.get = async (req, res) => {
  try {
    const promo = await req.prisma.promotion.findUnique({
      where: { id: req.params.id },
    });
    if (!promo) return notFound(res, 'Khuyến mãi không tồn tại');
    return success(res, promo);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /api/sports/promotions/:id/claim ────────────────────────────────────
exports.claim = async (req, res) => {
  try {
    const promotionId = req.params.id;
    const userId      = req.user.id;
    const now         = new Date();

    const promo = await req.prisma.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promo)           return notFound(res, 'Khuyến mãi không tồn tại');
    if (!promo.isActive)  return error(res, 'Khuyến mãi không còn hiệu lực', 400);
    if (now < promo.startDate || now > promo.endDate) {
      return error(res, 'Khuyến mãi chưa bắt đầu hoặc đã hết hạn', 400);
    }

    // Check claim limit
    const claims = await req.prisma.promotionClaim.count({
      where: { promotionId, userId },
    });
    if (claims >= promo.maxClaim) {
      return error(res, `Bạn đã nhận khuyến mãi này ${promo.maxClaim} lần — tối đa`, 400);
    }

    // Compute amount — lucky_money gets random bonus multiplier
    let amount = parseFloat(promo.value);
    if (promo.type === 'lucky_money') {
      const roll = Math.random();
      if      (roll < 0.05) amount = amount * 3;    // 5% jackpot
      else if (roll < 0.20) amount = amount * 2;    // 15% double
      else if (roll < 0.50) amount = amount * 1.5;  // 30% 1.5x
      // else 50%: base value
      amount = parseFloat(amount.toFixed(2));
    }

    // Credit user balance + create claim record atomically
    await req.prisma.$transaction([
      req.prisma.user.update({
        where: { id: userId },
        data:  { balance: { increment: amount } },
      }),
      req.prisma.transaction.create({
        data: {
          userId,
          type:          'bonus',
          amount,
          referenceId:   promotionId,
          referenceType: 'promotion',
          note:          `Nhận khuyến mãi: ${promo.name}`,
          balanceBefore: 0, // will be recalculated by wallet service if needed
          balanceAfter:  0,
        },
      }),
    ]);

    const claim = await req.prisma.promotionClaim.create({
      data: {
        promotionId,
        userId,
        amount,
        status:      'approved',
        processedAt: new Date(),
        metadata:    { type: promo.type, baseValue: parseFloat(promo.value) },
      },
    });

    return created(res, { claim, amount, message: `Chúc mừng! Bạn nhận được ${amount.toLocaleString('vi-VN')} VND` });
  } catch (e) { return error(res, e.message, 500); }
};
