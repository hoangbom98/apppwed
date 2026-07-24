// @ts-nocheck
const { success, error } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.list = async (req, res) => {
  try {
    const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status)   where.status   = req.query.status;
    if (req.query.leagueId) where.leagueId = req.query.leagueId;
    if (req.query.teamId)   where.OR = [{ homeTeamId: req.query.teamId }, { awayTeamId: req.query.teamId }];
    if (req.query.date) {
      const d = new Date(req.query.date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.startTime = { gte: d, lt: next };
    }

    const [data, total] = await Promise.all([
      req.prisma.match.findMany({
        where, skip, take,
        orderBy: { startTime: 'asc' },
        include: {
          league:   { select: { id: true, name: true, slug: true, logo: true } },
          homeTeam: { select: { id: true, name: true, slug: true, logo: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logo: true } },
        },
      }),
      req.prisma.match.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getLive = async (req, res) => {
  try {
    const data = await req.prisma.match.findMany({
      where: { status: 'live' },
      orderBy: { startTime: 'asc' },
      include: {
        league:      { select: { id: true, name: true, slug: true, logo: true } },
        homeTeam:    { select: { id: true, name: true, slug: true, logo: true } },
        awayTeam:    { select: { id: true, name: true, slug: true, logo: true } },
        liveUpdates: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

exports.getToday = async (req, res) => {
  try {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end   = new Date(start); end.setDate(end.getDate() + 1);
    const data  = await req.prisma.match.findMany({
      where: { startTime: { gte: start, lt: end } },
      orderBy: { startTime: 'asc' },
      include: {
        league:   { select: { id: true, name: true, slug: true, logo: true } },
        homeTeam: { select: { id: true, name: true, slug: true, logo: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true } },
      },
    });
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

exports.get = async (req, res) => {
  try {
    const match = await req.prisma.match.findUnique({
      where: { id: req.params.id },                 // CUID string
      include: {
        league:      true,
        homeTeam:    true,
        awayTeam:    true,
        liveUpdates: { orderBy: { createdAt: 'asc' } },
        highlights:  { where: { status: 'active' }, orderBy: { sortOrder: 'asc' }, take: 10 },
        comments:    { where: { status: 'active', parentId: null }, orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { id: true, username: true, avatar: true } } } },
      },
    });
    if (!match) return error(res, 'Không tìm thấy trận đấu', 404);
    return success(res, match);
  } catch (e) { return error(res, e.message, 500); }
};

exports.addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content) return error(res, 'Nội dung bình luận là bắt buộc');
    const comment = await req.prisma.comment.create({
      data: { userId: req.user.id, matchId: req.params.id, content, parentId: parentId || null },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    return success(res, comment, 'Đã bình luận');
  } catch (e) { return error(res, e.message, 500); }
};
