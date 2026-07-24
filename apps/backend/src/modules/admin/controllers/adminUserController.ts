// @ts-nocheck
'use strict';
/**
 * AdminUserController — CRUD for admin accounts.
 * Uses req.prisma (admin DB, injected by projectResolver).
 */
const { paginate }     = require('../../../shared/utils/helpers');
const { hashPassword } = require('../../../shared/services/authService');
const { ok, created, notFound, badRequest, serverError } = require('../../../shared/utils/response');

// ── Helpers ────────────────────────────────────────────────────────────────────
function wrap(fn) {
  return async (req, res, next) => {
    try { await fn(req, res, next); } catch (err) { next(err); }
  };
}

// ── Handlers ──────────────────────────────────────────────────────────────────
exports.list = wrap(async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
  const where = {};
  if (req.query.role)   where.role   = req.query.role;
  if (req.query.status) where.status = req.query.status;

  const [data, total] = await Promise.all([
    req.prisma.adminUser.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, fullName: true, role: true, status: true, lastLogin: true, createdAt: true },
    }),
    req.prisma.adminUser.count({ where }),
  ]);
  ok(res, { data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
});

exports.get = wrap(async (req, res) => {
  const admin = await req.prisma.adminUser.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, fullName: true, role: true, status: true, lastLogin: true, createdAt: true },
  });
  if (!admin) return notFound(res);
  ok(res, admin);
});

exports.create = wrap(async (req, res) => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password || !fullName) return badRequest(res, 'Thiếu thông tin bắt buộc');

  const exists = await req.prisma.adminUser.findUnique({ where: { email } });
  if (exists) return badRequest(res, 'Email đã tồn tại');

  const admin = await req.prisma.adminUser.create({
    data: { email, password: await hashPassword(password), fullName, role: role || 'admin' },
  });
  created(res, { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role });
});

exports.update = wrap(async (req, res) => {
  const { email, fullName, role, status } = req.body;
  try {
    const admin = await req.prisma.adminUser.update({
      where: { id: req.params.id },
      data:  { email, fullName, role, status },
      select: { id: true, email: true, fullName: true, role: true, status: true },
    });
    ok(res, admin);
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    throw e;
  }
});

exports.resetPassword = wrap(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return badRequest(res, 'Mật khẩu tối thiểu 8 ký tự');
  if (req.user.role !== 'super_admin' && req.params.id !== req.user.id) {
    const { forbidden } = require('../../../shared/utils/response');
    return forbidden(res, 'Không có quyền đặt lại mật khẩu người khác');
  }
  try {
    await req.prisma.adminUser.update({
      where: { id: req.params.id },
      data:  { password: await hashPassword(newPassword) },
    });
    ok(res, null, 'Đã đặt lại mật khẩu');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    throw e;
  }
});

exports.remove = wrap(async (req, res) => {
  if (req.params.id === req.user.id) return badRequest(res, 'Không thể xóa chính mình');
  try {
    await req.prisma.adminUser.delete({ where: { id: req.params.id } });
    ok(res, null, 'Đã xóa');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    throw e;
  }
});
