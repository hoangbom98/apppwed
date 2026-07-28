// @ts-nocheck
/**
 * Sports Admin Controller — CRUD for leagues, teams, matches, articles, bets, users.
 * Extracted from inline route handlers in routes/index.ts for maintainability.
 */
const { ok, created, error, paginate: paginateRes } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');
const { logAdminAction } = require('../../../shared/services/auditLogger.service');

// ── Leagues ───────────────────────────────────────────────────────

exports.listLeagues = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.league.findMany({ skip, take, orderBy: { sortOrder: 'asc' } }),
      req.prisma.league.count(),
    ]);
    return paginateRes(res, data, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.createLeague = async (req, res) => {
  try {
    const d = await req.prisma.league.create({ data: req.body });
    return created(res, d);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateLeague = async (req, res) => {
  try {
    const { id } = req.params;
    const oldData = await req.prisma.league.findUnique({ where: { id } });
    if (!oldData) return error(res, 'League not found', 404);
    
    const d = await req.prisma.league.update({ where: { id }, data: req.body });
    
    // Audit log
    await logAdminAction(req.user.id, 'updateLeague', id, oldData, d, req.ip, req.prisma);
    
    return ok(res, d, 'League updated');
  } catch (e) { return error(res, e.message, 500); }
};

exports.deleteLeague = async (req, res) => {
  try {
    await req.prisma.league.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Teams ─────────────────────────────────────────────────────────

exports.listTeams = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.team.findMany({ skip, take, include: { league: { select: { name: true } } } }),
      req.prisma.team.count(),
    ]);
    return paginateRes(res, data, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.createTeam = async (req, res) => {
  try {
    const d = await req.prisma.team.create({ data: req.body });
    return created(res, d);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateTeam = async (req, res) => {
  try {
    const d = await req.prisma.team.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, d);
  } catch (e) { return error(res, e.message, 500); }
};

exports.deleteTeam = async (req, res) => {
  try {
    await req.prisma.team.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Matches ───────────────────────────────────────────────────────

exports.listMatches = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.match.findMany({
        where, skip, take,
        orderBy: { startTime: 'desc' },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          league:   { select: { name: true } },
        },
      }),
      req.prisma.match.count({ where }),
    ]);
    return paginateRes(res, data, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.createMatch = async (req, res) => {
  try {
    const d = await req.prisma.match.create({ data: req.body });
    return created(res, d);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateMatch = async (req, res) => {
  try {
    const d = await req.prisma.match.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, d);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Articles ──────────────────────────────────────────────────────

exports.listArticles = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.news.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.news.count(),
    ]);
    return paginateRes(res, data, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.createArticle = async (req, res) => {
  try {
    const d = await req.prisma.news.create({ data: req.body });
    return created(res, d);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateArticle = async (req, res) => {
  try {
    const d = await req.prisma.news.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, d);
  } catch (e) { return error(res, e.message, 500); }
};

exports.deleteArticle = async (req, res) => {
  try {
    await req.prisma.news.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Bets ──────────────────────────────────────────────────────────

exports.listBets = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.betSlip.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true } } } }),
      req.prisma.betSlip.count({ where }),
    ]);
    return paginateRes(res, data, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateBet = async (req, res) => {
  try {
    const d = await req.prisma.betSlip.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, d);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Users ─────────────────────────────────────────────────────────

exports.listUsers = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) where.OR = [
      { username: { contains: req.query.search } },
      { email:    { contains: req.query.search } },
    ];
    const [data, total] = await Promise.all([
      req.prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: { id: true, username: true, email: true, role: true, status: true, createdAt: true } }),
      req.prisma.user.count({ where }),
    ]);
    return paginateRes(res, data, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};
