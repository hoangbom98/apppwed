// @ts-nocheck
class BaseService {
  constructor(prisma, modelName) {
    this.prisma = prisma;
    this.modelName = modelName;
    this.model = prisma[modelName];
  }

  async paginate(query, options = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const [data, total] = await Promise.all([
      this.model.findMany({ skip, take, ...options }),
      this.model.count({ where: options.where }),
    ]);
    return { data, meta: { total, page: parseInt(page), limit: take, pages: Math.ceil(total / take) } };
  }

  async findById(id) { return this.model.findUnique({ where: { id: typeof id === 'string' ? id : parseInt(id) } }); }
  async create(data) { return this.model.create({ data }); }
  async update(id, data) { return this.model.update({ where: { id: typeof id === 'string' ? id : parseInt(id) }, data }); }
  async delete(id) { return this.model.delete({ where: { id: typeof id === 'string' ? id : parseInt(id) } }); }
}
module.exports = BaseService;
