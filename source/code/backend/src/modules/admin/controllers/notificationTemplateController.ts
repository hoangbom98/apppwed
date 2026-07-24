// @ts-nocheck
'use strict';
/**
 * notificationTemplateController.js
 * Routes: /admin/notification/templates/*
 *
 *   GET    /admin/notification/templates          — list all templates
 *   GET    /admin/notification/templates/:type    — single template
 *   PUT    /admin/notification/templates/:type    — update (content / subject / channel / isActive)
 *   POST   /admin/notification/templates/seed     — seed defaults (super_admin only)
 *   GET    /admin/notification/logs               — delivery log (paginated)
 */
const { success, error } = require('../../../shared/utils/response');
const tplSvc             = require('../services/notificationTemplateService');

// GET /admin/notification/templates
exports.listTemplates = async (req, res) => {
  try {
    const data = await tplSvc.getAll(req.prisma);
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

// GET /admin/notification/templates/:type
exports.getTemplate = async (req, res) => {
  try {
    const data = await tplSvc.getByType(req.prisma, req.params.type);
    if (!data) return error(res, 'Không tìm thấy template', 404);
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

// PUT /admin/notification/templates/:type
exports.updateTemplate = async (req, res) => {
  try {
    const data = await tplSvc.update(req.prisma, req.params.type, req.body);
    return success(res, data, 'Đã lưu template');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy template', 404);
    return error(res, e.message, 500);
  }
};

// POST /admin/notification/templates/seed
exports.seedTemplates = async (req, res) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return error(res, 'Chỉ super_admin mới được seed templates', 403);
    }
    await tplSvc.seed(req.prisma);
    return success(res, null, 'Đã seed templates thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// GET /admin/notification/logs?page=1&limit=20&status=&channel=
exports.listLogs = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const where = {};
    if (req.query.status)  where.status  = req.query.status;
    if (req.query.channel) where.channel = req.query.channel;

    const [total, items] = await Promise.all([
      req.prisma.notificationLog.count({ where }),
      req.prisma.notificationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { template: { select: { type: true, name: true } } },
      }),
    ]);

    return success(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return error(res, e.message, 500); }
};
