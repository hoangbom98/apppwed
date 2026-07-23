const { success, error } = require('../../../shared/utils/response');

exports.getByPosition = async (req, res) => {
  try {
    const { position } = req.query;
    if (!position) return error(res, 'Position is required');
    
    const now = new Date();
    const where = {
      position,
      status: 'active',
      OR: [
        { AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }] },
        { AND: [{ startDate: null }, { endDate: null }] },
      ],
    };
    
    const ads = await req.prisma.adBanner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      take: 10,
    });
    
    return success(res, { ads });
  } catch (e) {
    return error(res, e.message, 500);
  }
};
