// @ts-nocheck
/* eslint-disable */

'use strict';
const { hashPassword, comparePassword, generateTokens } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/response');
const missionSvc = require('../services/missionService');

const USER_SELECT = {
  id: true, email: true, username: true, fullName: true,
  phone: true, avatar: true, balance: true, frozen: true,
  vipLevel: true, role: true, status: true, referralCode: true,
  lastLogin: true, createdAt: true,
};

exports.register = async (req, res) => {
  try {
    const { email, password, username, fullName, phone } = req.body;
    if (!email || !password || !username) return error(res, 'Email, username và password là bắt buộc');
    const prisma = req.prisma;
    if (await prisma.user.findUnique({ where: { email } })) return error(res, 'Email đã tồn tại');
    if (await prisma.user.findFirst({ where: { username } })) return error(res, 'Username đã tồn tại');
    const user = await prisma.user.create({
      data: { email, password: await hashPassword(password), username, fullName, phone },
    });
    const tokens = generateTokens({ id: user.id, username: user.username, email: user.email, role: user.role, project: 'game' });
    return created(res, {
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
      ...tokens,
    });
  } catch (e) { return error(res, e.message, 500); }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 'Username/email và password là bắt buộc');
    const user = await req.prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
    });
    if (!user || !(await comparePassword(password, user.password))) {
      return unauthorized(res, 'Sai thông tin đăng nhập');
    }
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản bị khóa');
    await req.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    // Fire-and-forget: advance LOGIN mission progress
    missionSvc.incrementProgress(user.id, 'LOGIN', 1, req.prisma);
    const tokens = generateTokens({ id: user.id, username: user.username, email: user.email, role: user.role, project: 'game' });
    return success(res, {
      user: { id: user.id, email: user.email, username: user.username, avatar: user.avatar, balance: user.balance, vipLevel: user.vipLevel, role: user.role },
      ...tokens,
    });
  } catch (e) { return error(res, e.message, 500); }
};

exports.me = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id }, select: USER_SELECT });
    if (!user) return unauthorized(res);
    return success(res, user);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body;
    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: { fullName, phone, avatar },
      select: USER_SELECT,
    });
    return success(res, user, 'Cập nhật thành công');
  } catch (e) { return error(res, e.message, 500); }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return error(res, 'Thiếu thông tin');
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await comparePassword(oldPassword, user.password))) return error(res, 'Mật khẩu cũ không đúng');
    await req.prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(newPassword) } });
    return success(res, null, 'Đổi mật khẩu thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Refresh token ─────────────────────────────────────────────────
exports.refresh = async (req, res) => {
  const { verifyRefreshToken } = require('../../../shared/services/authService');
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return unauthorized(res, 'Thiếu refresh token');
    const payload = verifyRefreshToken(refresh_token);
    // Re-validate user status in DB — prevents banned/suspended users from refreshing
    const user = await req.prisma.user.findUnique({
      where:  { id: payload.id },
      select: { id: true, username: true, email: true, role: true, status: true },
    });
    if (!user || user.status !== 'active') return unauthorized(res, 'Tài khoản không hợp lệ hoặc đã bị khóa');
    const tokens  = generateTokens({ id: user.id, username: user.username, email: user.email, role: user.role, project: 'game' });
    return success(res, tokens);
  } catch (e) { return unauthorized(res, 'Refresh token không hợp lệ hoặc đã hết hạn'); }
};

// ── Logout ────────────────────────────────────────────────────────
exports.logout = async (_req, res) => success(res, null, 'Đăng xuất thành công');
