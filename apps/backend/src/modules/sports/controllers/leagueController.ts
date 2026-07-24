// @ts-nocheck
const { success, error } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.list = async (req, res) => {
  try {
    const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.type)   where.type   = req.query.type;
    if (req.query.country) where.country = req.query.country;
    if (req.query.q)      where.name    = { contains: req.query.q };

    const [data, total] = await Promise.all([
      req.prisma.league.findMany({ where, skip, take, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
      req.prisma.league.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.get = async (req, res) => {
  try {
    const league = await req.prisma.league.findUnique({
      where: { slug: req.params.slug },
      include: { _count: { select: { teams: true, matches: true } } },
    });
    if (!league) return error(res, 'Không tìm thấy giải đấu', 404);
    return success(res, league);
  } catch (e) { return error(res, e.message, 500); }
};
