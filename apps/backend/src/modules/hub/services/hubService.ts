const BaseService = require('../../../shared/services/BaseService');
const { paginate } = require('../../../shared/utils/core/helpers');

interface GameQuery {
  page?:     string | number;
  limit?:    string | number;
  category?: string;
  search?:   string;
  status?:   string;
}

class HubService extends BaseService {
  constructor(prisma: unknown) {
    super(prisma, 'cms');
  }

  async getCategories(type?: string, status = 'active'): Promise<unknown[]> {
    const where: Record<string, unknown> = { status };
    if (type) where.type = type;
    return this.prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { children: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getGames(query: GameQuery): Promise<{ data: unknown[]; meta: Record<string, unknown> }> {
    const { page, limit, skip, take } = paginate(query.page, query.limit);
    const { category, search, status = 'active' } = query;
    const where: Record<string, unknown> = { status };
    if (category) where.categoryId = category;
    if (search)   where.name = { contains: search };

    const [data, total] = await Promise.all([
      this.prisma.game.findMany({ where, skip, take, orderBy: { sortOrder: 'asc' }, include: { category: true } }),
      this.prisma.game.count({ where }),
    ]);
    return { data, meta: { total, page, limit, pages: Math.ceil(total / take) } };
  }
}

module.exports = HubService;
