// @ts-nocheck
/**
 * Dating Admin Controller
 * Handles admin CRUD for: profiles, matches, gifts, moments (feed posts), reports, live sessions.
 * All routes require auth + adminGuard.
 */
const { ok, created, success, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const { logAdminAction } = require('../../../shared/services/auditLogger.service');

// ── Profiles ──────────────────────────────────────────────────────

exports.listProfiles = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status)  where.status  = req.query.status;
    if (req.query.search)  where.OR = [
      { username: { contains: req.query.search } },
      { email:    { contains: req.query.search } },
    ];
    const [data, total] = await Promise.all([
      req.prisma.user.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, email: true, gender: true, status: true, vipLevel: true, createdAt: true },
      }),
      req.prisma.user.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getProfile = async (req, res) => {
  try {
    const item = await req.prisma.user.findUnique({ where: { id: req.params.id } });
    if (!item) return notFound(res);
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const oldUser = await req.prisma.user.findUnique({ where: { id } });
    if (!oldUser) return notFound(res);
    
    const updatedUser = await req.prisma.user.update({ where: { id }, data: req.body });
    
    // Audit log
    await logAdminAction(req.user.id, 'updateProfile', id, oldUser, updatedUser, req.ip, req.prisma);
    
    return success(res, updatedUser, 'Profile updated');
  } catch (e) { return error(res, e.message, 500); }
};

exports.deleteProfile = async (req, res) => {
  try {
    await req.prisma.user.update({ where: { id: req.params.id }, data: { status: 'banned' } });
    return ok(res, { id: req.params.id }, 'Profile banned');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

// ── Matches ───────────────────────────────────────────────────────

exports.listMatches = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.match.findMany({
        skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          user1: { select: { username: true } },
          user2: { select: { username: true } },
        },
      }),
      req.prisma.match.count(),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getMatch = async (req, res) => {
  try {
    const item = await req.prisma.match.findUnique({
      where: { id: req.params.id },
      include: { user1: { select: { username: true } }, user2: { select: { username: true } } },
    });
    if (!item) return notFound(res);
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.deleteMatch = async (req, res) => {
  try {
    await req.prisma.match.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id }, 'Match deleted');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

// ── Gifts ─────────────────────────────────────────────────────────

exports.listGifts = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.gift.findMany({ skip, take, orderBy: { sortOrder: 'asc' } }),
      req.prisma.gift.count(),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getGift = async (req, res) => {
  try {
    const item = await req.prisma.gift.findUnique({ where: { id: req.params.id } });
    if (!item) return notFound(res);
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.createGift = async (req, res) => {
  try {
    const item = await req.prisma.gift.create({ data: req.body });
    return created(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateGift = async (req, res) => {
  try {
    const item = await req.prisma.gift.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Gift updated');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

exports.deleteGift = async (req, res) => {
  try {
    await req.prisma.gift.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id }, 'Gift deleted');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

// ── Moments (feed posts) ──────────────────────────────────────────

exports.listMoments = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.feedPost.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { username: true } } },
      }),
      req.prisma.feedPost.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getMoment = async (req, res) => {
  try {
    const item = await req.prisma.feedPost.findUnique({
      where: { id: req.params.id },
      include: { author: { select: { username: true } } },
    });
    if (!item) return notFound(res);
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateMoment = async (req, res) => {
  try {
    const item = await req.prisma.feedPost.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Moment updated');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

exports.deleteMoment = async (req, res) => {
  try {
    await req.prisma.feedPost.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id }, 'Moment deleted');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

// ── Reports / Violations ──────────────────────────────────────────

exports.listReports = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.userReport.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { username: true } },
          reported: { select: { username: true } },
        },
      }),
      req.prisma.userReport.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getReport = async (req, res) => {
  try {
    const item = await req.prisma.userReport.findUnique({ where: { id: req.params.id } });
    if (!item) return notFound(res);
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateReport = async (req, res) => {
  try {
    const item = await req.prisma.userReport.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Report updated');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

// ── Live Sessions ─────────────────────────────────────────────────

exports.listLive = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.liveStream.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { host: { select: { username: true } } },
      }),
      req.prisma.liveStream.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.deleteLive = async (req, res) => {
  try {
    await req.prisma.liveStream.update({ where: { id: req.params.id }, data: { status: 'ended' } });
    return ok(res, { id: req.params.id }, 'Live session ended');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};
