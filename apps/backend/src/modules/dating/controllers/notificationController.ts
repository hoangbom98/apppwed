// @ts-nocheck
const { success, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

exports.getNotifications = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.type) where.type = req.query.type;
    const [data, total] = await Promise.all([
      req.prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.notification.count({ where }),
    ]);
    return res.json({ success: true, notifications: data, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.markRead = async (req, res) => {
  try {
    await req.prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    return success(res, null);
  } catch (e) { return error(res, e.message, 500); }
};

exports.markAllRead = async (req, res) => {
  try {
    await req.prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    return success(res, null, 'Đã đọc tất cả');
  } catch (e) { return error(res, e.message, 500); }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await req.prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
    return success(res, { count });
  } catch (e) { return error(res, e.message, 500); }
};
