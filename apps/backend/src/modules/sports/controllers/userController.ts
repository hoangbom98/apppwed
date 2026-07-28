// @ts-nocheck
'use strict';
/**
 * sports/controllers/userController.js
 * User management endpoints for the sports module admin.
 * Uses req.prisma (injected by projectResolver) — no class instantiation needed.
 */
const { ok, error } = require('../../../shared/utils/network/response');
const { paginate }  = require('../../../shared/utils/core/helpers');

exports.list = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      where.OR = [
        { username: { contains: req.query.search } },
        { email:    { contains: req.query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      req.prisma.user.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, email: true, role: true, status: true, createdAt: true },
      }),
      req.prisma.user.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// Field whitelist for admin user update — prevents mass-assignment of sensitive fields
const ALLOWED_UPDATE_FIELDS = ['fullName', 'username', 'role', 'status'];

exports.update = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — never coerce with +id or Number(id)

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
      select: { id: true, username: true, email: true, role: true, status: true },
    });
    return ok(res, user, 'User updated');
  } catch (e) {
    return error(res, e.message, 500);
  }
};
