// @ts-nocheck
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.list = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.announcement.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.announcement.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.get = async (req, res) => {
  try {
    const item = await req.prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!item) return notFound(res);
    return success(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.create = async (req, res) => {
  try {
    const { title, content, type, projects, startAt, endAt } = req.body;
    if (!title || !content || !startAt || !endAt) return error(res, 'Thiếu thông tin bắt buộc');
    const item = await req.prisma.announcement.create({
      data: { title, content, type: type || 'info', projects: projects || null, startAt: new Date(startAt), endAt: new Date(endAt) },
    });
    return created(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt) data.endAt = new Date(data.endAt);
    const item = await req.prisma.announcement.update({ where: { id: req.params.id }, data });
    return success(res, item, 'Đã cập nhật');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

exports.remove = async (req, res) => {
  try {
    await req.prisma.announcement.delete({ where: { id: req.params.id } });
    return success(res, null, 'Đã xóa');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};
