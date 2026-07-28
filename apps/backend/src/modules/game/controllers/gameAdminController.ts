// @ts-nocheck
/**
 * Game Admin Controller
 * Handles admin endpoints for: game rounds (sessions), game providers.
 * All routes require auth + adminGuard.
 */
const { ok, created, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

// ── Game Rounds / Sessions ────────────────────────────────────────

exports.listRounds = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status)   where.status   = req.query.status;
    if (req.query.userId)   where.userId   = req.query.userId;
    if (req.query.gameId)   where.gameId   = req.query.gameId;
    if (req.query.provider) where.provider = req.query.provider;
    if (req.query.gameType) where.gameType = req.query.gameType;
    if (req.query.search) {
      // search by username (join via user relation) or gameCode
      where.OR = [
        { user:     { username: { contains: req.query.search } } },
        { gameCode: { contains: req.query.search } },
        { gameName: { contains: req.query.search } },
      ];
    }
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(req.query.from);
      if (req.query.to)   where.createdAt.lte = new Date(req.query.to + 'T23:59:59Z');
    }
    const [data, total] = await Promise.all([
      req.prisma.gameSession.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true, email: true } } },
      }),
      req.prisma.gameSession.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getRound = async (req, res) => {
  try {
    const item = await req.prisma.gameSession.findUnique({
      where:   { id: req.params.id },
      include: { user: { select: { username: true } } },
    });
    if (!item) return notFound(res);
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateRound = async (req, res) => {
  try {
    const item = await req.prisma.gameSession.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Round updated');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

// ── Game Providers ────────────────────────────────────────────────

exports.listProviders = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.gameProvider.findMany({ skip, take, orderBy: { name: 'asc' } }),
      req.prisma.gameProvider.count(),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getProvider = async (req, res) => {
  try {
    const item = await req.prisma.gameProvider.findUnique({ where: { id: req.params.id } });
    if (!item) return notFound(res);
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.createProvider = async (req, res) => {
  try {
    const item = await req.prisma.gameProvider.create({ data: req.body });
    return created(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateProvider = async (req, res) => {
  try {
    const item = await req.prisma.gameProvider.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Provider updated');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

exports.deleteProvider = async (req, res) => {
  try {
    await req.prisma.gameProvider.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id }, 'Provider deleted');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};
