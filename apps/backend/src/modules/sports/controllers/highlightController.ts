// @ts-nocheck
'use strict';
const { success, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

exports.list = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, 20);
    const where = { status: 'active' };

    if (req.query.matchId) where.matchId = req.query.matchId; // CUID string — no coercion
    if (req.query.tag) {
      where.tags = { some: { slug: req.query.tag } };
    }

    const [highlights, total] = await Promise.all([
      req.prisma.highlight.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          match: {
            select: {
              id: true,
              homeTeam: { select: { name: true, logo: true } },
              awayTeam: { select: { name: true, logo: true } },
            },
          },
          tags: true,
        },
      }),
      req.prisma.highlight.count({ where }),
    ]);

    return res.json({ success: true, highlights, meta: { total, page, limit } });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.get = async (req, res) => {
  try {
    const highlight = await req.prisma.highlight.findUnique({
      where:   { slug: req.params.slug },
      include: { match: true, tags: true },
    });

    if (!highlight) return error(res, 'Highlight not found', 404);

    // Increment views
    await req.prisma.highlight.update({
      where: { id: highlight.id },
      data:  { views: { increment: 1 } },
    });

    return success(res, { ...highlight, views: highlight.views + 1 });
  } catch (e) {
    return error(res, e.message, 500);
  }
};
