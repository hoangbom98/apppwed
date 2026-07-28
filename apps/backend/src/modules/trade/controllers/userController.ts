// @ts-nocheck
'use strict';
/**
 * trade/controllers/userController.js
 * User management endpoints for the trade module.
 * Uses req.prisma (injected by projectResolver) — no class instantiation needed.
 * All IDs are CUIDs (strings) — never coerce with +id or Number(id).
 */
const { ok, error, success } = require('../../../shared/utils/network/response');
const { paginate }  = require('../../../shared/utils/core/helpers');

// Field whitelist for admin user update — prevents mass-assignment of sensitive fields
const ALLOWED_UPDATE_FIELDS = ['fullName', 'phone', 'role', 'status'];

exports.list = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.kycStatus) where.kycStatus = req.query.kycStatus;
    if (req.query.search) {
      where.OR = [
        { email:    { contains: req.query.search } },
        { fullName: { contains: req.query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      req.prisma.user.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, fullName: true, phone: true, kycStatus: true, role: true, status: true, createdAt: true },
      }),
      req.prisma.user.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── PATCH /trade/profile — update own profile ─────────────────────────────────
const ALLOWED_PROFILE_FIELDS = ['fullName', 'phone'];

exports.updateProfile = async (req, res) => {
  try {
    const data = {};
    for (const field of ALLOWED_PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        data[field] = req.body[field];
      }
    }
    if (!Object.keys(data).length) return error(res, 'Không có trường hợp lệ để cập nhật', 400);
    const user = await req.prisma.user.update({
      where:  { id: req.user.id },
      data,
      select: { id: true, email: true, fullName: true, phone: true },
    });
    return ok(res, user, 'Cập nhật hồ sơ thành công');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion

    // Whitelist only safe fields for admin update
    const data = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        data[field] = req.body[field];
      }
    }
    if (!Object.keys(data).length) {
      return error(res, 'Không có trường hợp lệ để cập nhật', 400);
    }

    const user = await req.prisma.user.update({
      where:  { id },
      data,
      select: { id: true, email: true, fullName: true, role: true, status: true },
    });
    return ok(res, user, 'User updated');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── PATCH /profile/avatar — upload avatar image ───────────────────────────────
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Không có file được tải lên', 400);
    const { saveAvatar } = require('../../../shared/services/content/uploadService');
    const avatarUrl = await saveAvatar(req.file.buffer, req.user.id);
    const user = await req.prisma.user.update({
      where:  { id: req.user.id },
      data:   { avatar: avatarUrl },
      select: { id: true, email: true, fullName: true, phone: true, avatar: true },
    });
    return ok(res, user, 'Ảnh đại diện đã được cập nhật');
  } catch (e) { return error(res, e.message, 500); }
};
