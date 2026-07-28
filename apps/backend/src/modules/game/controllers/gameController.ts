// @ts-nocheck
'use strict';
/**
 * game/controllers/gameController.js
 * Games, categories, and promotions.
 */
const { success, created, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');
const GameService = require('../services/gameService/GameService');

exports.getCategories = async (req, res) => {
  try {
    const cats = await req.prisma.gameCategory.findMany({ where: { status: 'active' }, orderBy: { sortOrder: 'asc' } });
    return success(res, cats);
  } catch (e) { return error(res, e.message, 500); }
};

exports.getGames = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, take } = paginate(page, limit);
    const gameService = new GameService(req.prisma);

    const where = { status: 'active' };
    if (req.query.category) where.categoryId = req.query.category; // CUID string

    const [data, total] = await Promise.all([
      gameService.getGames(where, skip, take),
      gameService.count(where),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getGameBySlug = async (req, res) => {
  try {
    const gameService = new GameService(req.prisma);
    const game = await gameService.findUnique({ slug: req.params.slug });
    if (!game) return notFound(res);
    return success(res, game);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Promotions ────────────────────────────────────────────────────────────────

exports.getPromotions = async (req, res) => {
  try {
    const now = new Date();
    const promos = await req.prisma.promotion.findMany({
      where: {
        status:   'active',
        startAt:  { lte: now },
        endAt:    { gte: now },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, promos);
  } catch (e) { return error(res, e.message, 500); }
};

exports.getPromotionById = async (req, res) => {
  try {
    const promo = await req.prisma.promotion.findUnique({ where: { id: req.params.id } });
    if (!promo) return notFound(res);
    return success(res, promo);
  } catch (e) { return error(res, e.message, 500); }
};

exports.claimPromotion = async (req, res) => {
  try {
    const promoId = req.params.id;
    const userId  = req.user.id;

    const promo = await req.prisma.promotion.findUnique({ where: { id: promoId } });
    if (!promo || promo.status !== 'active') return notFound(res, 'Khuyến mãi không khả dụng');

    const now = new Date();
    if (promo.startAt > now || promo.endAt < now) return error(res, 'Khuyến mãi đã hết hạn', 400);

    const existing = await req.prisma.promotionClaim.findFirst({ where: { userId, promotionId: promoId } });
    if (existing) return error(res, 'Bạn đã nhận khuyến mãi này rồi', 409);

    const claim = await req.prisma.promotionClaim.create({
      data: { userId, promotionId: promoId, status: 'pending' },
    });
    return created(res, claim, 'Yêu cầu nhận khuyến mãi đã được ghi nhận');
  } catch (e) { return error(res, e.message, 500); }
};

exports.getMyClaims = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.promotionClaim.findMany({
        where:   { userId: req.user.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { promotion: { select: { id: true, title: true, type: true } } },
      }),
      req.prisma.promotionClaim.count({ where: { userId: req.user.id } }),
    ]);
    return success(res, { data, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};
