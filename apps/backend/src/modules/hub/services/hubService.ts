// @ts-nocheck
const BaseService = require('../../../shared/services/BaseService');

class HubService extends BaseService {
  constructor(prisma) {
    super(prisma, 'cms');
  }

  async getCategories(type, status = 'active') {
    const where = { status };
    if (type) where.type = type;
    return this.prisma.category.findMany({ 
      where, 
      orderBy: { sortOrder: 'asc' }, 
      include: { children: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' } } } 
    });
  }

  async getGames(query) {
    const { page, limit, skip, take } = require('../../../shared/utils/helpers').paginate(query.page, query.limit);
    const { category, search, status = 'active' } = query;
    const where = { status };
    if (category) where.categoryId = category; // CUID string — no coercion
    if (search) where.name = { contains: search };
    
    const [data, total] = await Promise.all([
      this.prisma.game.findMany({ where, skip, take, orderBy: { sortOrder: 'asc' }, include: { category: true } }),
      this.prisma.game.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / take) } };
  }
}
module.exports = HubService;
