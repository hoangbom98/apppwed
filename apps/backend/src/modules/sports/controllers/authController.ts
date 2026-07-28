// @ts-nocheck
/* eslint-disable */

const { hashPassword, comparePassword, generateTokens, checkNewPassword } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/network/response');
const { saveAvatar }  = require('../../../shared/services/uploadService');
const emailGuard      = require('../../../shared/services/emailGuardService');
const ipGuard         = require('../../../shared/services/ipGuardService');
const auditService    = require('../../../shared/services/auditService');
const sessionService  = require('../../../shared/services/sessionService');

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

    // ── NIST SP 800-63B: password policy ──────────────────────────────────
    const pwError = await checkNewPassword(password);
    if (pwError) return error(res, pwError, 400);

    const [emailCheck, ipCheck] = await Promise.all([
      emailGuard.checkEmail(email),
      ipGuard.checkIp(req.ip || req.headers['x-forwarded-for']),
    ]);
    if (emailCheck.blocked) return error(res, emailCheck.reason, 400);
    if (ipCheck.blocked)    return error(res, 'Yêu cầu bị từ chối', 403);

    const prisma = req.prisma;
    if (await prisma.user.findUnique({ where: { email } })) return error(res, 'Email đã tồn tại');
    if (await prisma.user.findFirst({ where: { username } })) return error(res, 'Username đã tồn tại');
    const user = await prisma.user.create({ data: { email, password: await hashPassword(password), username, fullName } });
    const tokens = generateTokens({ id: user.id, username: user.username, role: user.role, project: 'sports' });
    await sessionService.create('sports', user.id, { ip: req.ip, ua: req.get('user-agent'), role: user.role });
    await sessionService.bindRefreshToken('sports', user.id, tokens.refresh_token);
    auditService.logSecurity({ project: 'sports', userId: user.id, event: 'register', ip: req.ip, ua: req.get('user-agent'), meta: { email } });
    return created(res, { user: { id: user.id, email: user.email, username: user.username, role: user.role }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await req.prisma.user.findFirst({ where: { OR: [{ username }, { email: username }] } });
    if (!user || !(await comparePassword(password, user.password))) {
      auditService.logSecurity({ project: 'sports', userId: null, event: 'login_failed', ip: req.ip, ua: req.get('user-agent'), meta: { username } });
      return unauthorized(res, 'Sai thông tin đăng nhập');
    }
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản bị khóa');
    const tokens = generateTokens({ id: user.id, username: user.username, role: user.role, project: 'sports' });
    await sessionService.create('sports', user.id, { ip: req.ip, ua: req.get('user-agent'), role: user.role });
    await sessionService.bindRefreshToken('sports', user.id, tokens.refresh_token);
    auditService.logSecurity({ project: 'sports', userId: user.id, event: 'login_success', ip: req.ip, ua: req.get('user-agent'), meta: {} });
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
    const tokenValid = await sessionService.verifyRefreshToken('sports', payload.id, refresh_token);
    if (!tokenValid) return unauthorized(res, 'Refresh token đã bị thu hồi');
    const user = await req.prisma.user.findUnique({
      where:  { id: payload.id },
      select: { id: true, username: true, role: true, status: true },
    });
    if (!user || user.status !== 'active') return unauthorized(res, 'Tài khoản không hợp lệ hoặc đã bị khóa');
    const tokens  = generateTokens({ id: user.id, username: user.username, role: user.role, project: 'sports' });
    await sessionService.revokeRefreshToken('sports', user.id);
    await sessionService.bindRefreshToken('sports', user.id, tokens.refresh_token);
    return success(res, tokens);
  } catch (e) { return unauthorized(res, 'Refresh token không hợp lệ hoặc đã hết hạn'); }
};

// ── Logout ────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  if (req.user?.id) {
    await sessionService.revokeRefreshToken('sports', req.user.id).catch(() => {});
    await sessionService.destroy('sports', req.user.id).catch(() => {});
    auditService.logSecurity({ project: 'sports', userId: req.user.id, event: 'logout', ip: req.ip, ua: req.get('user-agent'), meta: {} });
  }
  return success(res, null, 'Đăng xuất thành công');
};
