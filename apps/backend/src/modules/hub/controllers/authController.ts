// @ts-nocheck
/* eslint-disable */

const { generateTokens, hashPassword, comparePassword, checkNewPassword } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/network/response');
const emailGuard    = require('../../../shared/services/emailGuardService');
const ipGuard       = require('../../../shared/services/ipGuardService');
const auditService  = require('../../../shared/services/auditService');
const sessionService = require('../../../shared/services/sessionService');

exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password) return error(res, 'Email và mật khẩu là bắt buộc');

    // ── NIST SP 800-63B: password strength + HIBP breach check ──────────────
    const pwError = await checkNewPassword(password);
    if (pwError) return error(res, pwError, 400);
    // ────────────────────────────────────────────────────────────────────────

    // ── Security checks ─────────────────────────────────────────────────────
    const [emailCheck, ipCheck] = await Promise.all([
      emailGuard.checkEmail(email),
      ipGuard.checkIp(req.ip || req.headers['x-forwarded-for']),
    ]);
    if (emailCheck.blocked) return error(res, emailCheck.reason, 400);
    if (ipCheck.blocked)    return error(res, 'Yêu cầu bị từ chối', 403);
    // ────────────────────────────────────────────────────────────────────────

    const prisma = req.prisma;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, 'Email đã tồn tại');
    const hashed        = await hashPassword(password);
    const dicebearSeed  = encodeURIComponent(fullName + email);
    const defaultAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${dicebearSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    const user = await prisma.user.create({ data: { email, password: hashed, fullName, phone, avatar: defaultAvatar } });
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'hub' });
    // Bind refresh token to session (prevents reuse after logout)
    await sessionService.create('hub', user.id, { ip: req.ip, ua: req.get('user-agent'), role: user.role });
    await sessionService.bindRefreshToken('hub', user.id, tokens.refresh_token);
    auditService.logSecurity({ project: 'hub', userId: user.id, event: 'register', ip: req.ip, ua: req.get('user-agent'), meta: { email } });
    return created(res, { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email và mật khẩu là bắt buộc');
    const prisma = req.prisma;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      auditService.logSecurity({ project: 'hub', userId: null, event: 'login_failed', ip: req.ip, ua: req.get('user-agent'), meta: { email } });
      return unauthorized(res, 'Sai thông tin đăng nhập');
    }
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản đã bị khóa');
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'hub' });
    // Bind session + refresh token
    await sessionService.create('hub', user.id, { ip: req.ip, ua: req.get('user-agent'), role: user.role });
    await sessionService.bindRefreshToken('hub', user.id, tokens.refresh_token);
    auditService.logSecurity({ project: 'hub', userId: user.id, event: 'login_success', ip: req.ip, ua: req.get('user-agent'), meta: {} });
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

    // Verify the refresh token is still bound (not revoked by logout/password change)
    const tokenValid = await sessionService.verifyRefreshToken('hub', payload.id, refresh_token);
    if (!tokenValid) return error(res, 'Refresh token đã bị thu hồi', 401);

    const user = await req.prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, email: true, role: true, status: true } });
    if (!user || user.status !== 'active') return error(res, 'Tài khoản không hợp lệ', 401);

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'hub' });
    // Rotate: revoke old, bind new (refresh token rotation)
    await sessionService.revokeRefreshToken('hub', user.id);
    await sessionService.bindRefreshToken('hub', user.id, tokens.refresh_token);
    return success(res, tokens);
  } catch (e) {
    return error(res, 'Refresh token không hợp lệ hoặc đã hết hạn', 401);
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user?.id) {
      await sessionService.revokeRefreshToken('hub', req.user.id);
      await sessionService.destroy('hub', req.user.id);
      auditService.logSecurity({ project: 'hub', userId: req.user.id, event: 'logout', ip: req.ip, ua: req.get('user-agent'), meta: {} });
    }
    return success(res, null, 'Đăng xuất thành công');
  } catch (e) { return error(res, e.message, 500); }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return error(res, 'Thiếu thông tin');

    // NIST SP 800-63B: validate new password before accepting change
    const pwError = await checkNewPassword(newPassword);
    if (pwError) return error(res, pwError, 400);

    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!await comparePassword(oldPassword, user.password)) return error(res, 'Mật khẩu cũ không đúng');
    await req.prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(newPassword) } });
    await sessionService.revokeRefreshToken('hub', user.id);
    auditService.logSecurity({ project: 'hub', userId: user.id, event: 'password_changed', ip: req.ip, ua: req.get('user-agent'), meta: {} });
    return success(res, null, 'Đổi mật khẩu thành công');
  } catch (e) { return error(res, e.message, 500); }
};
