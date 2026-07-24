// @ts-nocheck
// backend/src/modules/admin/controllers/gameProviderController.ts
// Game provider / aggregator management — reads from game DB
//   Uses GameAggregator (primary) and GameProvider (legacy alias) models.
//
//   GET    /api/admin/game/providers              — list aggregators + products
//   GET    /api/admin/game/providers/:id          — aggregator detail + games count
//   POST   /api/admin/game/providers              — create aggregator
//   PATCH  /api/admin/game/providers/:id          — update aggregator (name, status, config)
//   PATCH  /api/admin/game/providers/:id/status   — toggle status only
//   GET    /api/admin/game/providers/:id/products — list products under aggregator
'use strict';
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, notFound, created, paginate } = require('../../../shared/utils/response');
const emit = require('../../../shared/socket/projectEmitter');

// ── List aggregators ─────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const db      = getPrismaClient('game');
    const { page = 1, limit = 20, status, search } = req.query;
    const skip    = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];

    const [aggregators, total] = await Promise.all([
      db.gameAggregator.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: true } },
          products: {
            where:   { status: 'active' },
            select:  { id: true, name: true, status: true },
            take: 10,
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      db.gameAggregator.count({ where }),
    ]);

    // Mask secret keys in response
    const masked = aggregators.map(a => ({
      ...a,
      secretKey: a.secretKey ? '••••••••' : null,
    }));

    return paginate(res, masked, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Aggregator detail ────────────────────────────────────────────────────────
exports.getDetail = async (req, res) => {
  try {
    const db     = getPrismaClient('game');
    const { id } = req.params;

    const aggregator = await db.gameAggregator.findUnique({
      where:   { id },
      include: {
        products: {
          include: { _count: { select: { games: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
    });
    if (!aggregator) return notFound(res, 'Aggregator not found');

    // Game count under this aggregator
    const gameCount = await db.game.count({
      where: { product: { aggregatorId: id } },
    }).catch(() => 0);

    // Active session count for this aggregator's games
    const activeSessions = await db.gameSession.count({
      where: { status: 'playing', game: { product: { aggregatorId: id } } },
    }).catch(() => 0);

    return success(res, {
      ...aggregator,
      secretKey: aggregator.secretKey ? '••••••••' : null,
      gameCount,
      activeSessions,
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Create aggregator ────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const db = getPrismaClient('game');
    const { code, name, description, baseUrl, apiKey, secretKey, status, config, sortOrder } = req.body;

    if (!code || !name || !baseUrl || !apiKey || !secretKey)
      return error(res, 'code, name, baseUrl, apiKey, secretKey are required', 400);

    const existing = await db.gameAggregator.findUnique({ where: { code } });
    if (existing) return error(res, `Code "${code}" already in use`, 409);

    const aggregator = await db.gameAggregator.create({
      data: {
        code, name, description, baseUrl, apiKey, secretKey,
        status:    status    || 'active',
        config:    config    || null,
        sortOrder: Number(sortOrder || 0),
      },
    });

    return created(res, { ...aggregator, secretKey: '••••••••' }, 'Aggregator created');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Update aggregator ────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const db     = getPrismaClient('game');
    const { id } = req.params;
    const { name, description, baseUrl, apiKey, secretKey, config, sortOrder } = req.body;

    const exists = await db.gameAggregator.findUnique({ where: { id } });
    if (!exists) return notFound(res, 'Aggregator not found');

    const aggregator = await db.gameAggregator.update({
      where: { id },
      data:  {
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(baseUrl     !== undefined && { baseUrl }),
        ...(apiKey      !== undefined && { apiKey }),
        ...(secretKey   !== undefined && { secretKey }),
        ...(config      !== undefined && { config }),
        ...(sortOrder   !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return success(res, { ...aggregator, secretKey: '••••••••' }, 'Aggregator updated');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Toggle status ─────────────────────────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
  try {
    const db             = getPrismaClient('game');
    const { id }         = req.params;
    const { status }     = req.body;

    const valid = ['active', 'inactive', 'maintenance'];
    if (!valid.includes(status))
      return error(res, `Status must be one of: ${valid.join(', ')}`, 400);

    const exists = await db.gameAggregator.findUnique({ where: { id } });
    if (!exists) return notFound(res, 'Aggregator not found');

    await db.gameAggregator.update({ where: { id }, data: { status } });

    // Emit maintenance alert if admin put it into maintenance
    if (status === 'maintenance') {
      emit.statsUpdated('game');
    }

    return success(res, { id, status }, `Status updated to ${status}`);
  } catch (e) { return error(res, e.message, 500); }
};

// ── List products under an aggregator ────────────────────────────────────────
exports.listProducts = async (req, res) => {
  try {
    const db      = getPrismaClient('game');
    const { id }  = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const skip    = (Number(page) - 1) * Number(limit);

    const where = { aggregatorId: id };
    if (status) where.status = status;

    const [products, total] = await Promise.all([
      db.gameProduct.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { games: true } } },
      }),
      db.gameProduct.count({ where }),
    ]);

    return paginate(res, products, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};
