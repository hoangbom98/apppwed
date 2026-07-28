'use strict';
const { success, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

exports.getNotifications = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.notification.findMany({
        where: { userId: req.user.id },
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.notification.count({ where: { userId: req.user.id } }),
    ]);
    return success(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
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

exports.markRead = async (req, res) => {
  try {
    // Include userId in where to prevent IDOR — users can only mark their own notifications
    await req.prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data:  { isRead: true },
    });
    return success(res, null, 'Đã đánh dấu đã đọc');
  } catch (e) { return error(res, e.message, 500); }
};

exports.markAllRead = async (req, res) => {
  try {
    await req.prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return success(res, null, 'Đã đánh dấu tất cả đã đọc');
  } catch (e) { return error(res, e.message, 500); }
};
