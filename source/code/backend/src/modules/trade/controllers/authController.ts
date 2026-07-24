// @ts-nocheck
/* eslint-disable */

const { hashPassword, comparePassword, generateTokens } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/response');

exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phone, referralCode } = req.body;
    if (!email || !password) return error(res, 'Email và password là bắt buộc');
    if (await req.prisma.user.findUnique({ where: { email } })) return error(res, 'Email đã tồn tại');

    // Resolve referrer by referralCode (derived as md5(userId).slice(0,8).toUpperCase())
    let referrerId = null;
    if (referralCode) {
      const crypto = require('crypto');
      const allUsers = await req.prisma.user.findMany({ select: { id: true } });
      for (const u of allUsers) {
        const code = crypto.createHash('md5').update(u.id).digest('hex').slice(0, 8).toUpperCase();
        if (code === referralCode.toUpperCase()) { referrerId = u.id; break; }
      }
    }

    const user = await req.prisma.user.create({
      data: { email, password: await hashPassword(password), fullName, phone },
    });

    // Create referral relationships — F1 direct, F2 from referrer's parent
    if (referrerId) {
      await req.prisma.referral.create({
        data: { referrerId, referredId: user.id, level: 1 },
      });
      // Check if the referrer was also referred (F2)
      const referrerRef = await req.prisma.referral.findFirst({
        where: { referredId: referrerId, level: 1 },
      });
      if (referrerRef) {
        await req.prisma.referral.create({
          data: { referrerId: referrerRef.referrerId, referredId: user.id, level: 2 },
        });
      }
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'trade' });
    return created(res, { user: { id: user.id, email: user.email, fullName: user.fullName }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await req.prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) return unauthorized(res, 'Sai thông tin đăng nhập');
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản bị khóa');
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'trade' });
    return success(res, { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.me = async (req, res) => {
  try {
    // kycStatus lives on Kyc relation — expose kycStatus directly from user model
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, email: true, fullName: true, phone: true, kycStatus: true, role: true, status: true, createdAt: true },
    });
    if (!user) return unauthorized(res);
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
      select: { id: true, email: true, role: true, status: true },
    });
    if (!user || user.status !== 'active') return unauthorized(res, 'Tài khoản không hợp lệ hoặc đã bị khóa');
    const tokens  = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'trade' });
    return success(res, tokens);
  } catch (e) { return unauthorized(res, 'Refresh token không hợp lệ hoặc đã hết hạn'); }
};

// ── Logout ────────────────────────────────────────────────────────
exports.logout = async (_req, res) => success(res, null, 'Đăng xuất thành công');
