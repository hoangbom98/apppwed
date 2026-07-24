// @ts-nocheck
/* eslint-disable */

const { hashPassword, comparePassword, generateTokens } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/response');
const { saveAvatar } = require('../../../shared/services/uploadService');

const USER_SELECT = {
  id: true, email: true, username: true, fullName: true,
  avatar: true, cover: true, bio: true, role: true,
  status: true, isVerified: true, isStreamer: true, preferredLang: true,
  createdAt: true,
};

exports.register = async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;
    if (!email || !password || !username) return error(res, 'Thiếu thông tin bắt buộc');
    const prisma = req.prisma;
    if (await prisma.user.findUnique({ where: { email } })) return error(res, 'Email đã tồn tại');
    if (await prisma.user.findFirst({ where: { username } })) return error(res, 'Username đã tồn tại');
    const user = await prisma.user.create({ data: { email, password: await hashPassword(password), username, fullName } });
    const tokens = generateTokens({ id: user.id, username: user.username, role: user.role, project: 'sports' });
    return created(res, { user: { id: user.id, email: user.email, username: user.username, role: user.role }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await req.prisma.user.findFirst({ where: { OR: [{ username }, { email: username }] } });
    if (!user || !(await comparePassword(password, user.password))) return unauthorized(res, 'Sai thông tin đăng nhập');
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản bị khóa');
    const tokens = generateTokens({ id: user.id, username: user.username, role: user.role, project: 'sports' });
    return success(res, { user: { id: user.id, email: user.email, username: user.username, role: user.role }, ...tokens });
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
    const allowed = ['fullName', 'bio', 'cover', 'preferredLang'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    const user = await req.prisma.user.update({ where: { id: req.user.id }, data, select: USER_SELECT });
    return success(res, user);
  } catch (e) { return error(res, e.message, 500); }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return error(res, 'No file uploaded');
    const avatarUrl = await saveAvatar(req.file.buffer, 'sports/avatars');
    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
      select: USER_SELECT,
    });
    return success(res, user);
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
      select: { id: true, username: true, role: true, status: true },
    });
    if (!user || user.status !== 'active') return unauthorized(res, 'Tài khoản không hợp lệ hoặc đã bị khóa');
    const tokens  = generateTokens({ id: user.id, username: user.username, role: user.role, project: 'sports' });
    return success(res, tokens);
  } catch (e) { return unauthorized(res, 'Refresh token không hợp lệ hoặc đã hết hạn'); }
};

// ── Logout ────────────────────────────────────────────────────────
exports.logout = async (_req, res) => success(res, null, 'Đăng xuất thành công');
