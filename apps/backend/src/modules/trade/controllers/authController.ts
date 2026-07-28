// @ts-nocheck
/* eslint-disable */

const { hashPassword, comparePassword, generateTokens, checkNewPassword } = require('../../../shared/services/authService');
const { success, created, error, unauthorized } = require('../../../shared/utils/network/response');
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

// ── Forgot password — step 1: generate reset token + send email ──────────────
exports.forgotPassword = async (req, res) => {
  const { error: sendErr, success } = require('../../../shared/utils/network/response');
  const sendMail = require('../../../shared/services/communication/emailService');
  const crypto = require('crypto');
  try {
    const { email } = req.body;
    if (!email) return sendErr(res, 'Email là bắt buộc', 400);

    const user = await req.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration (OWASP A07)
    if (!user) return success(res, null, 'Nếu email tồn tại, hướng dẫn sẽ được gửi');

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const resetHash   = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt   = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await req.prisma.user.update({
      where: { email },
      data:  { passwordResetToken: resetHash, passwordResetExpires: expiresAt },
    });

    const resetUrl = `${process.env.TRADE_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const emailBody = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f1117;color:#e2e8f0;border-radius:12px">
        <h2 style="color:#3b82f6;margin-bottom:8px">Đặt lại mật khẩu</h2>
        <p style="color:#94a3b8;margin-bottom:16px">Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.</p>
        <p style="color:#94a3b8;margin-bottom:24px">Nhấn vào nút bên dưới để đặt lại mật khẩu. Liên kết có hiệu lực trong <strong>15 phút</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Đặt lại mật khẩu</a>
        <p style="color:#64748b;font-size:12px;margin-top:24px">Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.</p>
        <hr style="border-color:#1e293b;margin-top:24px"/>
        <p style="color:#475569;font-size:11px">LKVIP Trade · Giao dịch an toàn</p>
      </div>
    `;

    await sendMail.send(email, 'Đặt lại mật khẩu LKVIP Trade', emailBody).catch(() => {});
    auditService.logSecurity({ project: 'trade', userId: user.id, event: 'forgot_password', ip: req.ip, ua: req.get('user-agent'), meta: { email } });
    return success(res, null, 'Nếu email tồn tại, hướng dẫn sẽ được gửi');
  } catch (e) { return sendErr(res, e.message, 500); }
};

// ── Reset password — step 2: verify token + set new password ─────────────────
exports.resetPassword = async (req, res) => {
  const { error: sendErr, success } = require('../../../shared/utils/network/response');
  const crypto = require('crypto');
  try {
    const { token, password } = req.body;
    if (!token || !password) return sendErr(res, 'Token và mật khẩu là bắt buộc', 400);

    const pwError = await checkNewPassword(password);
    if (pwError) return sendErr(res, pwError, 400);

    const resetHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await req.prisma.user.findFirst({
      where: {
        passwordResetToken:   resetHash,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!user) return sendErr(res, 'Token không hợp lệ hoặc đã hết hạn', 400);

    await req.prisma.user.update({
      where: { id: user.id },
      data: {
        password:             await hashPassword(password),
        passwordResetToken:   null,
        passwordResetExpires: null,
      },
    });

    // Revoke all sessions after password reset
    await sessionService.revokeRefreshToken('trade', user.id).catch(() => {});
    await sessionService.destroy('trade', user.id).catch(() => {});
    auditService.logSecurity({ project: 'trade', userId: user.id, event: 'reset_password', ip: req.ip, ua: req.get('user-agent'), meta: {} });
    return success(res, null, 'Mật khẩu đã được đặt lại thành công');
  } catch (e) { return sendErr(res, e.message, 500); }
};

// ── Change password (authenticated) ──────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { error: sendErr, success } = require('../../../shared/utils/network/response');
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return sendErr(res, 'Thiếu mật khẩu hiện tại hoặc mới', 400);

    const pwError = await checkNewPassword(newPassword);
    if (pwError) return sendErr(res, pwError, 400);

    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, password: true },
    });
    if (!user) return sendErr(res, 'Người dùng không tồn tại', 404);

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) return sendErr(res, 'Mật khẩu hiện tại không đúng', 400);

    if (currentPassword === newPassword) return sendErr(res, 'Mật khẩu mới phải khác mật khẩu cũ', 400);

    await req.prisma.user.update({
      where: { id: user.id },
      data:  { password: await hashPassword(newPassword) },
    });

    // Revoke refresh token — force re-login on other devices
    await sessionService.revokeRefreshToken('trade', user.id).catch(() => {});
    auditService.logSecurity({ project: 'trade', userId: user.id, event: 'change_password', ip: req.ip, ua: req.get('user-agent'), meta: {} });
    return success(res, null, 'Mật khẩu đã được thay đổi thành công');
  } catch (e) { return sendErr(res, e.message, 500); }
};
