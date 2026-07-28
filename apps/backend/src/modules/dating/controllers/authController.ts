// @ts-nocheck
/* eslint-disable */

'use strict';
const { comparePassword, hashPassword, generateTokens, generateOtp, generateCode, checkNewPassword } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/network/response');
const cache        = require('../../../shared/services/cacheService');
const logger       = require('../../../shared/services/logger');
const emailGuard   = require('../../../shared/services/emailGuardService');
const ipGuard      = require('../../../shared/services/ipGuardService');
const modSvc       = require('../../../shared/services/contentModerationService');
const auditService  = require('../../../shared/services/auditService');
const sessionService = require('../../../shared/services/sessionService');

// Fields safe to expose on /me and login responses
const USER_SELECT = {
  id: true, email: true, username: true, fullName: true,
  phone: true, avatar: true, bio: true,
  gender: true, birthDate: true, location: true,
  coins: true, isVerified: true, isVip: true,
  role: true, status: true, lastSeen: true, createdAt: true,
};

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'SĐT là bắt buộc');
    const otp = generateOtp();
    await cache.set(`otp:${phone}`, otp, 300);
    logger.info('Dating OTP issued', { phone });
    return success(res, null, 'OTP đã gửi');
  } catch (e) { return error(res, e.message, 500); }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const stored = await cache.get(`otp:${phone}`);
    if (!stored || stored !== otp) return error(res, 'OTP không đúng hoặc đã hết hạn');
    await cache.del(`otp:${phone}`);
    return success(res, { verified: true });
  } catch (e) { return error(res, e.message, 500); }
};

exports.register = async (req, res) => {
  try {
    const { email, phone, password, fullName, gender, birthDate, referralCode } = req.body;
    if ((!email && !phone) || !fullName) return error(res, 'Thiếu thông tin bắt buộc (email/phone + fullName)');

    // ── NIST SP 800-63B: password policy (skip for OTP-only registration) ───
    if (password) {
      const pwError = await checkNewPassword(password);
      if (pwError) return error(res, pwError, 400);
    }

    // ── Security: email guard + IP guard ────────────────────────────────────
    const clientIp = req.ip || req.headers['x-forwarded-for'];
    const checks = await Promise.all([
      email ? emailGuard.checkEmail(email) : Promise.resolve({ blocked: false }),
      ipGuard.checkIp(clientIp),
    ]);
    if (checks[0].blocked) return error(res, checks[0].reason, 400);
    if (checks[1].blocked) return error(res, 'Yêu cầu bị từ chối', 403);
    // ────────────────────────────────────────────────────────────────────────

    const prisma = req.prisma;

    if (email && await prisma.user.findFirst({ where: { email } })) return error(res, 'Email đã đăng ký');
    if (phone && await prisma.user.findFirst({ where: { phone } })) return error(res, 'SĐT đã đăng ký');

    let referrerId = null;
    if (referralCode) {
      const ref = await prisma.user.findFirst({ where: { referralCode } });
      if (ref) referrerId = ref.id;
    }

    const myCode = generateCode(8);
    const hashed = password ? await hashPassword(password) : await hashPassword(generateCode(16));

    // Dicebear avatar mặc định — https://api.dicebear.com (no key, free unlimited)
    const dicebearSeed  = encodeURIComponent(fullName + myCode);
    const defaultAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${dicebearSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    const user = await prisma.user.create({
      data: {
        email:       email  || null,
        phone:       phone  || null,
        password:    hashed,
        fullName,
        gender:      gender    || null,
        birthDate:   birthDate ? new Date(birthDate) : null,
        referralCode: myCode,
        referrerId,
        avatar:      defaultAvatar,
      },
    });

    const tokens = generateTokens({ id: user.id, role: user.role, project: 'dating' });
    await sessionService.create('dating', user.id, { ip: req.ip, ua: req.get('user-agent'), role: user.role });
    await sessionService.bindRefreshToken('dating', user.id, tokens.refresh_token);
    auditService.logSecurity({ project: 'dating', userId: user.id, event: 'register', ip: req.ip, ua: req.get('user-agent'), meta: { email, phone } });
    return created(res, {
      user: { id: user.id, fullName: user.fullName, avatar: user.avatar, phone: user.phone, email: user.email, role: user.role },
      ...tokens,
    });
  } catch (e) { return error(res, e.message, 500); }
};

exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    if (!password || (!phone && !email)) return error(res, 'Thiếu thông tin đăng nhập');

    const prisma = req.prisma;
    const user   = phone
      ? await prisma.user.findFirst({ where: { phone } })
      : await prisma.user.findFirst({ where: { email } });

    if (!user) return unauthorized(res, 'Tài khoản không tồn tại');
    if (!(await comparePassword(password, user.password))) {
      auditService.logSecurity({ project: 'dating', userId: null, event: 'login_failed', ip: req.ip, ua: req.get('user-agent'), meta: { phone, email } });
      return unauthorized(res, 'Sai mật khẩu');
    }
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản bị khóa');

    // Update last seen
    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } }).catch(() => {});

    const tokens = generateTokens({ id: user.id, role: user.role, project: 'dating' });
    await sessionService.create('dating', user.id, { ip: req.ip, ua: req.get('user-agent'), role: user.role });
    await sessionService.bindRefreshToken('dating', user.id, tokens.refresh_token);
    auditService.logSecurity({ project: 'dating', userId: user.id, event: 'login_success', ip: req.ip, ua: req.get('user-agent'), meta: {} });
    return success(res, {
      user: { id: user.id, fullName: user.fullName, avatar: user.avatar, phone: user.phone, email: user.email, role: user.role, isVip: user.isVip, coins: user.coins },
      ...tokens,
    });
  } catch (e) { return error(res, e.message, 500); }
};

exports.me = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: USER_SELECT,
    });
    if (!user) return unauthorized(res);
    return success(res, user);
  } catch (e) { return error(res, e.message, 500); }
};

exports.completeOnboarding = async (req, res) => {
  try {
    const { gender, birthDate, bio, location } = req.body;
    const data = {};
    if (gender)    data.gender    = gender;
    if (birthDate) data.birthDate = new Date(birthDate);
    if (bio)       data.bio       = bio;
    if (location)  data.location  = location;
    await req.prisma.user.update({ where: { id: req.user.id }, data });
    return success(res, null, 'Onboarding hoàn tất');
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['fullName', 'bio', 'avatar', 'gender', 'birthDate', 'location', 'lat', 'lng'];
    const data = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        data[k] = k === 'birthDate' ? new Date(req.body[k]) : req.body[k];
      }
    }
    const user = await req.prisma.user.update({
      where:  { id: req.user.id },
      data,
      select: USER_SELECT,
    });
    return success(res, user, 'Cập nhật thành công');
  } catch (e) { return error(res, e.message, 500); }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Không có file');
    const { saveAvatar } = require('../../../shared/services/uploadService');
    const url = await saveAvatar(req.file.buffer, 'dating/avatars');
    await req.prisma.user.update({ where: { id: req.user.id }, data: { avatar: url } });
    return success(res, { avatar_url: url });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Refresh token ──────────────────────────────────────────────────
exports.refresh = async (req, res) => {
  const { verifyRefreshToken } = require('../../../shared/services/authService');
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return unauthorized(res, 'Thiếu refresh token');
    const payload = verifyRefreshToken(refresh_token);
    const tokenValid = await sessionService.verifyRefreshToken('dating', payload.id, refresh_token);
    if (!tokenValid) return unauthorized(res, 'Refresh token đã bị thu hồi');
    const user = await req.prisma.user.findUnique({
      where:  { id: payload.id },
      select: { id: true, role: true, status: true },
    });
    if (!user || !['active', 'verified'].includes(user.status)) return unauthorized(res, 'Tài khoản không hợp lệ hoặc đã bị khóa');
    const tokens  = generateTokens({ id: user.id, role: user.role, project: 'dating' });
    await sessionService.revokeRefreshToken('dating', user.id);
    await sessionService.bindRefreshToken('dating', user.id, tokens.refresh_token);
    return success(res, tokens);
  } catch (e) { return unauthorized(res, 'Refresh token không hợp lệ hoặc đã hết hạn'); }
};

// ── Logout ─────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    if (req.user?.id) {
      await sessionService.revokeRefreshToken('dating', req.user.id);
      await sessionService.destroy('dating', req.user.id);
      auditService.logSecurity({ project: 'dating', userId: req.user.id, event: 'logout', ip: req.ip, ua: req.get('user-agent'), meta: {} });
    }
    return success(res, null, 'Đăng xuất thành công');
  } catch (e) { return error(res, e.message, 500); }
};
