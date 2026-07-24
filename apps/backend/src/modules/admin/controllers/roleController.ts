// @ts-nocheck
// backend/src/modules/admin/controllers/roleController.js
// RBAC Role & Permission management — học từ Boyue role.html + permission.js
'use strict';

const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, paginate } = require('../../../shared/utils/response');

const adminDb = () => getPrismaClient('admin');

// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/roles?page=1&limit=20&search=
 * Danh sách tất cả roles
 */
exports.listRoles = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const prisma = adminDb();
    const where = search ? { name: { contains: search } } : {};

    const [roles, total] = await Promise.all([
      prisma.adminRole.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { adminUsers: true } },
        },
      }),
      prisma.adminRole.count({ where }),
    ]);

    return paginate(res, roles, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/roles/:id
 * Chi tiết 1 role kèm permissions
 */
exports.getRole = async (req, res) => {
  try {
    const role = await adminDb().adminRole.findUnique({
      where:   { id: Number(req.params.id) },
      include: { permissions: true },
    });
    if (!role) return error(res, 'Role không tồn tại', 404);
    return success(res, role);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/roles
 * Tạo role mới
 * Body: { name, displayName, description, permissions: string[], sortOrder? }
 */
exports.createRole = async (req, res) => {
  try {
    const { name, displayName, description, permissions = [], sortOrder = 0 } = req.body;
    if (!name || !displayName) return error(res, 'name và displayName bắt buộc', 400);

    const exists = await adminDb().adminRole.findUnique({ where: { name } });
    if (exists) return error(res, `Role "${name}" đã tồn tại`, 409);

    const role = await adminDb().adminRole.create({
      data: {
        name,
        displayName,
        description: description || '',
        sortOrder:   Number(sortOrder),
        permissions: { set: permissions },
      },
    });
    return success(res, role, 'Đã tạo role', 201);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/roles/:id
 * Cập nhật role
 */
exports.updateRole = async (req, res) => {
  try {
    const { displayName, description, permissions, sortOrder, status } = req.body;
    const data = {};
    if (displayName !== undefined) data.displayName = displayName;
    if (description  !== undefined) data.description  = description;
    if (permissions  !== undefined) data.permissions  = { set: permissions };
    if (sortOrder    !== undefined) data.sortOrder    = Number(sortOrder);
    if (status       !== undefined) data.status       = status;

    const role = await adminDb().adminRole.update({
      where: { id: Number(req.params.id) },
      data,
    });
    return success(res, role, 'Đã cập nhật role');
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * DELETE /admin/roles/:id
 * Xoá role — kiểm tra không có user đang dùng
 */
exports.deleteRole = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const prisma = adminDb();

    // Kiểm tra role có đang được gán cho admin user không
    const count = await prisma.adminUser.count({ where: { roleId: id } });
    if (count > 0) {
      return error(res, `Không thể xoá: có ${count} admin đang dùng role này`, 409);
    }

    await prisma.adminRole.delete({ where: { id } });
    return success(res, null, 'Đã xoá role');
  } catch (e) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/roles/permissions/all
 * Trả về toàn bộ danh sách permission có sẵn (static + từ DB)
 */
exports.listPermissions = async (req, res) => {
  try {
    // Static permission tree (học từ Boyue permission.js)
    const PERMISSION_TREE = [
      { group: 'users',     label: 'Người dùng',    perms: ['users.view','users.edit','users.ban','users.balance'] },
      { group: 'finance',   label: 'Tài chính',     perms: ['finance.view','finance.approve','finance.reject','finance.export'] },
      { group: 'game',      label: 'Game',           perms: ['game.view','game.config','game.providers','game.lottery'] },
      { group: 'agents',    label: 'Đại lý',         perms: ['agents.view','agents.commission','agents.pay'] },
      { group: 'promotions',label: 'Khuyến mãi',    perms: ['promotions.view','promotions.create','promotions.edit','promotions.delete'] },
      { group: 'risk',      label: 'Rủi ro',         perms: ['risk.view','risk.resolve','risk.aml','risk.ip'] },
      { group: 'settings',  label: 'Cài đặt',        perms: ['settings.view','settings.edit','settings.security','settings.admins'] },
      { group: 'ops',       label: 'Auto-Ops',       perms: ['ops.view','ops.campaigns','ops.reports'] },
      { group: 'system',    label: 'Hệ thống',       perms: ['system.logs','system.cron','system.maintenance','system.backup'] },
      { group: 'rebates',   label: 'Hoàn trả',       perms: ['rebates.view','rebates.approve','rebates.reject'] },
      { group: 'im',        label: 'IM / Chat',      perms: ['im.view','im.broadcast','im.mute'] },
    ];
    return success(res, PERMISSION_TREE);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/roles/:id/permissions
 * Gán lại toàn bộ permissions cho role
 * Body: { permissions: string[] }
 */
exports.setPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return error(res, 'permissions phải là mảng', 400);

    const role = await adminDb().adminRole.update({
      where: { id: Number(req.params.id) },
      data:  { permissions: { set: permissions } },
    });
    return success(res, role, 'Đã cập nhật permissions');
  } catch (e) { return error(res, e.message, 500); }
};
