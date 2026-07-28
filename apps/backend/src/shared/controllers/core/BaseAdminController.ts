// @ts-nocheck
class BaseAdminController {
  constructor(service) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const data = await this.service.paginate(req.query);
      res.json({ success: true, ...data });
    } catch (e) { next(e); }
  }

  async get(req, res, next) {
    try {
      const item = await this.service.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const item = await this.service.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const item = await this.service.update(req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (e) { next(e); }
  }

  async remove(req, res, next) {
    try {
      await this.service.delete(req.params.id);
      res.json({ success: true, message: 'Deleted' });
    } catch (e) { next(e); }
  }
}

module.exports = BaseAdminController;
