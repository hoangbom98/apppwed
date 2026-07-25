// @ts-nocheck
/* eslint-disable */

const { hashPassword, comparePassword, generateTokens, checkNewPassword } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/response');
const emailGuard     = require('../../../shared/services/emailGuardService');
const ipGuard        = require('../../../shared/services/ipGuardService');
const auditService   = require('../../../shared/services/auditService');
const sessionService = require('../../../shared/services/sessionService');

exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phone, referralCode } = req.body;
    if (!email || !password) return error(res, 'Email và password là bắt buộc');

    // ── NIST SP 800-63B: password policy ──────────────────────────────────
    const pwError = await checkNewPassword(password);
    if (pwError) return error(res, pwError, 400);

    const [emailCheck, ipCheck] = await Promise.all([
      emailGuard.checkEmail(email),
      ipGuard.checkIp(req.ip || req.headers['x-forwarded-for']),
    ]);
    if (emailCheck.blocked) return error(res, emailCheck.reason, 400);
    if (ipCheck.blocked)    return error(res, 'Yêu cầu bị từ chối', 403);

    if (await req.prisma.user.findUnique({ where: { email } })) return error(res, 'Email đã tồn tại');

    // Resolve referrer by referralCode — stored directly on user record (OWASP A04: removed MD5)
    let referrerId = null;
    if (referralCode) {
      const ref = await req.prisma.user.findFirst({ where: { referralCode: referralCode.toUpperCase() } });
      if (ref) referrerId = ref.id;
    }

    // Resolve register bonus from SystemConfig
    const bonusCfg = await req.prisma.systemConfig.findUnique({ where: { key: 'register_bonus' } });
    const registerBonus = parseFloat(bonusCfg?.value || '0');

    const user = await req.prisma.user.create({
      data: { email, password: await hashPassword(password), fullName, phone },
    });

    // Initialize wallet for new user + apply registration bonus
    await req.prisma.wallet.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, balance: registerBonus, frozen: 0 },
      update: {},
    });
    if (registerBonus > 0) {
      await req.prisma.transaction.create({
        data: {
          userId:        user.id,
          type:          'bonus',
          amount:        registerBonus,
          balanceAfter:  registerBonus,
          note:          'Thưởng đăng ký tài khoản',
        },
      });
    }

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
      // Credit referrer bonus
      const refBonusCfg = await req.prisma.systemConfig.findUnique({ where: { key: 'referral_register_bonus' } });
      const refBonus = parseFloat(refBonusCfg?.value || '0');
      if (refBonus > 0) {
        const refWallet = await req.prisma.wallet.findUnique({ where: { userId: referrerId } });
        const newBal = (refWallet ? parseFloat(refWallet.balance) : 0) + refBonus;
        await req.prisma.wallet.upsert({
          where:  { userId: referrerId },
          create: { userId: referrerId, balance: refBonus, frozen: 0 },
          update: { balance: { increment: refBonus } },
        });
        await req.prisma.transaction.create({
          data: {
            userId:        referrerId,
            type:          'referral',
            amount:        refBonus,
            balanceAfter:  newBal,
            note:          'Thưởng mời đăng ký thành viên mới',
          },
        });
      }
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'trade' });
    await sessionService.create('trade', user.id, { ip: req.ip, ua: req.get('user-agent'), role: user.role });
    await sessionService.bindRefreshToken('trade', user.id, tokens.refresh_token);
    auditService.logSecurity({ project: 'trade', userId: user.id, event: 'register', ip: req.ip, ua: req.get('user-agent'), meta: { email } });
    return created(res, { user: { id: user.id, email: user.email, fullName: user.fullName }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await req.prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      auditService.logSecurity({ project: 'trade', userId: null, event: 'login_failed', ip: req.ip, ua: req.get('user-agent'), meta: { email } });
      return unauthorized(res, 'Sai thông tin đăng nhập');
    }
    if (user.status !== 'active') return unauthorized(res, 'Tài khoản bị khóa');
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'trade' });
    await sessionService.create('trade', user.id, { ip: req.ip, ua: req.get('user-agent'), role: user.role });
    await sessionService.bindRefreshToken('trade', user.id, tokens.refresh_token);
    auditService.logSecurity({ project: 'trade', userId: user.id, event: 'login_success', ip: req.ip, ua: req.get('user-agent'), meta: {} });
    return success(res, { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, ...tokens });
  } catch (e) { return error(res, e.message, 500); }
};

exports.me = async (req, res) => {
  try {
    const [user, wallet] = await Promise.all([
      req.prisma.user.findUnique({
        where:  { id: req.user.id },
        select: {
          id: true, email: true, fullName: true, phone: true,
          kycStatus: true, role: true, status: true,
          memberLevel: true, integral: true, tradingFrozen: true,
          referralCode: true, createdAt: true,
        },
      }),
      req.prisma.wallet.findUnique({ where: { userId: req.user.id } }),
    ]);
    if (!user) return unauthorized(res);
    return success(res, {
      ...user,
      wallet: wallet
        ? { balance: parseFloat(wallet.balance), frozen: parseFloat(wallet.frozen), currency: wallet.currency }
        : { balance: 0, frozen: 0, currency: 'USD' },
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Refresh token ─────────────────────────────────────────────────
exports.refresh = async (req, res) => {
  const { verifyRefreshToken } = require('../../../shared/services/authService');
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return unauthorized(res, 'Thiếu refresh token');
    const payload = verifyRefreshToken(refresh_token);
    const tokenValid = await sessionService.verifyRefreshToken('trade', payload.id, refresh_token);
    if (!tokenValid) return unauthorized(res, 'Refresh token đã bị thu hồi');
    const user = await req.prisma.user.findUnique({
      where:  { id: payload.id },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!user || user.status !== 'active') return unauthorized(res, 'Tài khoản không hợp lệ hoặc đã bị khóa');
    const tokens  = generateTokens({ id: user.id, email: user.email, role: user.role, project: 'trade' });
    await sessionService.revokeRefreshToken('trade', user.id);
    await sessionService.bindRefreshToken('trade', user.id, tokens.refresh_token);
    return success(res, tokens);
  } catch (e) { return unauthorized(res, 'Refresh token không hợp lệ hoặc đã hết hạn'); }
};

// ── Logout ────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  if (req.user?.id) {
    await sessionService.revokeRefreshToken('trade', req.user.id).catch(() => {});
    await sessionService.destroy('trade', req.user.id).catch(() => {});
    auditService.logSecurity({ project: 'trade', userId: req.user.id, event: 'logout', ip: req.ip, ua: req.get('user-agent'), meta: {} });
  }
  return success(res, null, 'Đăng xuất thành công');
};
