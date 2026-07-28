// @ts-nocheck
'use strict';
const { success, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

exports.list = async (req, res) => {
  try {
    const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.leagueId) where.leagueId = req.query.leagueId; // CUID string — no coercion
    if (req.query.status)   where.status   = req.query.status;
    if (req.query.q)        where.name     = { contains: req.query.q };

    const [data, total] = await Promise.all([
      req.prisma.team.findMany({
        where, skip, take,
        orderBy: { name: 'asc' },
        include: { league: { select: { id: true, name: true, slug: true, logo: true } } },
      }),
      req.prisma.team.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.get = async (req, res) => {
  try {
    const team = await req.prisma.team.findUnique({
      where: { slug: req.params.slug },
      include: {
        league: true,
        homeMatches: {
          where:   { status: 'finished' },
          orderBy: { startTime: 'desc' },
          take:    5,
          include: { homeTeam: true, awayTeam: true },
        },
        awayMatches: {
          where:   { status: 'finished' },
          orderBy: { startTime: 'desc' },
          take:    5,
          include: { homeTeam: true, awayTeam: true },
        },
      },
    });
    if (!team) return error(res, 'Không tìm thấy đội bóng', 404);
    return success(res, team);
  } catch (e) { return error(res, e.message, 500); }
};
