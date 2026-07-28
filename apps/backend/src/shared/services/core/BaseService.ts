'use strict';
/**
 * BaseService — generic CRUD + pagination base for all project services.
 *
 * @template TModel  Prisma delegate type (e.g. PrismaClient['user'])
 *
 * Usage:
 *   class UserService extends BaseService {
 *     constructor(prisma) { super(prisma, 'user'); }
 *   }
 */

/** Maximum page size allowed. Prevents unbounded SELECT * queries. */
const MAX_LIMIT = 100;

class BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected prisma: any;
  protected modelName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected model: any;

  /**
   * @param {object} prisma      Prisma client instance (project-specific)
   * @param {string} modelName   Prisma model name, e.g. 'user', 'transaction'
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(prisma: any, modelName: string) {
    this.prisma     = prisma;
    this.modelName  = modelName;
    this.model      = prisma[modelName];
  }

  /**
   * Paginate a model with consistent meta output.
   *
   * @param {{ page?: number|string, limit?: number|string }} query
   * @param {object} options  Prisma findMany options (where, orderBy, include, select, …)
   * @returns {{ data: unknown[], meta: { total: number, page: number, limit: number, pages: number } }}
   */
  async paginate(query: { page?: number | string; limit?: number | string }, options: Record<string, unknown> = {}) {
    const page  = Math.max(1, parseInt(String(query.page))  || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(query.limit)) || 10));
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({ skip, take: limit, ...options }),
      this.model.count({ where: options.where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Resolve a record ID to the correct type (string UUIDs stay as-is, numeric IDs are parsed).
   * @param {string|number} id
   */
  _resolveId(id: string | number): string | number {
    return typeof id === 'string' && isNaN(Number(id)) ? id : parseInt(id as string, 10);
  }

  async findById(id: string | number) {
    return this.model.findUnique({ where: { id: this._resolveId(id) } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(data: any) {
    return this.model.create({ data });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(id: string | number, data: any) {
    return this.model.update({ where: { id: this._resolveId(id) }, data });
  }

  async delete(id: string | number) {
    return this.model.delete({ where: { id: this._resolveId(id) } });
  }
}

module.exports = BaseService;
