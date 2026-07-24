// @ts-nocheck
/* eslint-disable */

'use strict';
const { comparePassword, hashPassword, generateTokens, generateOtp, generateCode } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/response');
const cache  = require('../../../shared/services/cacheService');
const logger = require('../../../shared/services/logger');

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
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[OTP] ${phone}: ${otp}`);
    }
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
      },
    });

    const tokens = generateTokens({ id: user.id, role: user.role, project: 'dating' });
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
    if (!(await comparePassword(password, user.password))) return unauthorized(res, 'Sai mật khẩu');
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản bị khóa');

    // Update last seen
    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } }).catch(() => {});

    const tokens = generateTokens({ id: user.id, role: user.role, project: 'dating' });
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
    // Re-validate user status in DB — prevents banned/suspended users from refreshing
    const user = await req.prisma.user.findUnique({
      where:  { id: payload.id },
      select: { id: true, role: true, status: true },
    });
    if (!user || !['active', 'verified'].includes(user.status)) return unauthorized(res, 'Tài khoản không hợp lệ hoặc đã bị khóa');
    const tokens  = generateTokens({ id: user.id, role: user.role, project: 'dating' });
    return success(res, tokens);
  } catch (e) { return unauthorized(res, 'Refresh token không hợp lệ hoặc đã hết hạn'); }
};

// ── Logout ─────────────────────────────────────────────────────────
exports.logout = async (_req, res) => success(res, null, 'Đăng xuất thành công');
