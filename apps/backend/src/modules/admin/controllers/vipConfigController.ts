// @ts-nocheck
'use strict';
/**
 * vipConfigController.ts — Quản lý VIP Tiers & VIP History
 *
 * GET    /api/admin/vip/configs              — danh sách VipConfig
 * POST   /api/admin/vip/configs              — tạo / upsert level
 * PATCH  /api/admin/vip/configs/:id          — cập nhật level
 * DELETE /api/admin/vip/configs/:id          — xoá level
 * GET    /api/admin/vip/history              — lịch sử level-up (toàn hệ thống)
 * GET    /api/admin/vip/stats                — thống kê user theo VIP
 */
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, paginate: paginateRes } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

// ── List all VIP configs ──────────────────────────────────────────────────────
exports.listConfigs = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const configs = await adminDb.vipConfig.findMany({
      orderBy: { level: 'asc' },
    });
    return success(res, configs);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Create / upsert a VIP config level ────────────────────────────────────────
exports.upsertConfig = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const { level, name, betRequired, rewardAmount, color, iconUrl, benefits, status } = req.body;

    if (level == null || !name) {
      return error(res, 'level and name are required', 400);
    }

    const config = await adminDb.vipConfig.upsert({
      where:  { level: Number(level) },
      update: { name, betRequired, rewardAmount, color, iconUrl, benefits, status, updatedAt: new Date() },
      create: { level: Number(level), name, betRequired, rewardAmount, color, iconUrl, benefits, status: status || 'active' },
    });
    return success(res, config, 'VipConfig saved');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Update a VIP config ───────────────────────────────────────────────────────
exports.updateConfig = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const { id } = req.params;
    const config = await adminDb.vipConfig.update({
      where: { id: Number(id) },
      data:  req.body,
    });
    return success(res, config, 'VipConfig updated');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Delete a VIP config ───────────────────────────────────────────────────────
exports.deleteConfig = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    await adminDb.vipConfig.delete({ where: { id: Number(req.params.id) } });
    return success(res, { id: req.params.id });
  } catch (e) { return error(res, e.message, 500); }
};

// ── VIP History (cross-project level-up audit) ────────────────────────────────
exports.listHistory = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const { page = 1, limit = 30, project, userId } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = {};
    if (project) where.project = project;
    if (userId)  where.userId  = userId;

    const [data, total] = await Promise.all([
      adminDb.vipHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      adminDb.vipHistory.count({ where }),
    ]);
    return paginateRes(res, data, { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / take) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── VIP stats — user distribution per level ───────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const gameDb  = getPrismaClient('game');
    const adminDb = getPrismaClient('admin');

    // Game users by VIP level
    const gameStats = await gameDb.user.groupBy({
      by: ['vipLevel'],
      _count: { _all: true },
      orderBy: { vipLevel: 'asc' },
    });

    // Config levels for label mapping
    const configs = await adminDb.vipConfig.findMany({ orderBy: { level: 'asc' } });
    const configMap = configs.reduce((acc, c) => { acc[c.level] = c.name; return acc; }, {});

    const distribution = gameStats.map(row => ({
      level: row.vipLevel,
      name:  configMap[row.vipLevel] || `V${row.vipLevel}`,
      count: row._count._all,
    }));

    return success(res, { distribution, totalConfigs: configs.length });
  } catch (e) { return error(res, e.message, 500); }
};
