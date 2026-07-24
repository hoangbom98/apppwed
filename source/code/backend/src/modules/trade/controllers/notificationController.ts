'use strict';
/**
 * trade/controllers/notificationController.js
 * All IDs are CUIDs (strings) — never coerce with +id.
 * markRead includes userId guard to prevent IDOR.
 */
const { success, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.getNotifications = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.notification.findMany({
        where:   { userId: req.user.id },
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.notification.count({ where: { userId: req.user.id } }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.markRead = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    // IDOR guard: ensure the notification belongs to the requesting user
    const notif = await req.prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!notif) return notFound(res, 'Thông báo không tồn tại');
    await req.prisma.notification.update({ where: { id }, data: { isRead: true } });
    return success(res, null, 'Đã đọc');
  } catch (e) { return error(res, e.message, 500); }
};

exports.markAllRead = async (req, res) => {
  try {
    await req.prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true },
    });
    return success(res, null, 'Đã đọc tất cả');
  } catch (e) { return error(res, e.message, 500); }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await req.prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    return success(res, { count });
  } catch (e) { return error(res, e.message, 500); }
};
