// @ts-nocheck
const { success, created, error, notFound } = require('../utils/response');
const { paginate: pg } = require('../utils/helpers');

class BaseController {
  constructor(model) {
    this.model = model;
  }

  async list(req, res) {
    try {
      const { page, limit, skip, take } = pg(req.query.page, req.query.limit);
      const where = {};
      if (req.query.status) where.status = req.query.status;

      const [data, total] = await Promise.all([
        this.model.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
        this.model.count({ where }),
      ]);

      return res.json({
        success: true, data,
        meta: { total, page, limit, pages: Math.ceil(total / take) },
      });
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  async get(req, res) {
    try {
      const item = await this.model.findUnique({ where: { id: +req.params.id } });
      if (!item) return notFound(res);
      return success(res, item);
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  async create(req, res) {
    try {
      const item = await this.model.create({ data: req.body });
      return created(res, item);
    } catch (e) {
      return error(res, e.message, 500);
    }
  }

  async update(req, res) {
    try {
      const item = await this.model.update({ where: { id: +req.params.id }, data: req.body });
      return success(res, item, 'Updated');
    } catch (e) {
      if (e.code === 'P2025') return notFound(res);
      return error(res, e.message, 500);
    }
  }

  async remove(req, res) {
    try {
      await this.model.delete({ where: { id: +req.params.id } });
      return success(res, null, 'Deleted');
    } catch (e) {
      if (e.code === 'P2025') return notFound(res);
      return error(res, e.message, 500);
    }
  }
}

module.exports = BaseController;
