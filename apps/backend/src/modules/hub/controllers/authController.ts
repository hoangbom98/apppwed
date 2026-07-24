// @ts-nocheck
/* eslint-disable */

const { generateTokens, hashPassword, comparePassword } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/response');

exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password) return error(res, 'Email và mật khẩu là bắt buộc');
    const prisma = req.prisma;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, 'Email đã tồn tại');
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, password: hashed, fullName, phone } });
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'hub' });
    return created(res, { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email và mật khẩu là bắt buộc');
    const prisma = req.prisma;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) return unauthorized(res, 'Sai thông tin đăng nhập');
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản đã bị khóa');
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'hub' });
    return success(res, { user: { id: user.id, email: user.email, fullName: user.fullName, avatar: user.avatar, role: user.role }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.me = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, fullName: true, avatar: true, phone: true, role: true, status: true, createdAt: true } });
    if (!user) return unauthorized(res);
    return success(res, user);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body;
    const user = await req.prisma.user.update({ where: { id: req.user.id }, data: { fullName, phone, avatar } });
    return success(res, { id: user.id, email: user.email, fullName: user.fullName, avatar: user.avatar }, 'Cập nhật thành công');
  } catch (e) { return error(res, e.message, 500); }
};

exports.refreshToken = async (req, res) => {
  const { verifyRefreshToken } = require('../../../shared/services/authService');
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return error(res, 'Refresh token là bắt buộc');
    const payload = verifyRefreshToken(refresh_token);
    const user = await req.prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, email: true, role: true, status: true } });
    if (!user || user.status !== 'active') return error(res, 'Tài khoản không hợp lệ', 401);
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'hub' });
    return success(res, tokens);
  } catch (e) {
    return error(res, 'Refresh token không hợp lệ hoặc đã hết hạn', 401);
  }
};

exports.logout = async (req, res) => {
  // Stateless JWT — client drops tokens; optionally blocklist here
  return success(res, null, 'Đăng xuất thành công');
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return error(res, 'Thiếu thông tin');
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!await comparePassword(oldPassword, user.password)) return error(res, 'Mật khẩu cũ không đúng');
    await req.prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(newPassword) } });
    return success(res, null, 'Đổi mật khẩu thành công');
  } catch (e) { return error(res, e.message, 500); }
};
