// backend/src/shared/controllers/twoFactorController.js
/**
 * 2FA Controller — TOTP setup, verification, and backup codes.
 *
 * Routes (add to each module's router if ENABLE_2FA=true):
 *   POST /auth/2fa/setup      — generate secret + QR URL
 *   POST /auth/2fa/enable     – verify token and enable 2FA
 *   POST /auth/2fa/disable     – disable 2FA (requires password)
 *   POST /auth/2fa/verify     – verify during login
 *   GET  /auth/2fa/backup     – regenerate backup codes
 */
const twoFA  = require('../services/twoFactorService');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/response');

// ── Setup: generate secret ────────────────────────────────────────────────

exports.setup = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { email: true, twoFactorEnabled: true },
    });
    if (user?.twoFactorEnabled) return error(res, '2FA đã được bật');

    const appName = process.env.APP_NAME || 'MultiProject';
    const secret  = twoFA.generateSecret(appName, user.email);
    const encrypted = twoFA.encryptSecret(secret.base32);

    // Store temp secret (not yet enabled)
    await req.prisma.user.update({
      where: { id: req.user.id },
      data:  { twoFactorSecret: encrypted, twoFactorEnabled: false },
    });

    return success(res, {
      otpauth_url: secret.otpauth_url,
      secret:      secret.base32, // Show only during setup
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Enable: verify first token ────────────────────────────────────────────

exports.enable = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return error(res, 'Token là bắt buộc');

    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorSecret) return error(res, 'Chưa thiết lập 2FA. Gọi /auth/2fa/setup trước');
    if (user.twoFactorEnabled)  return error(res, '2FA đã được bật');

    const secret = twoFA.decryptSecret(user.twoFactorSecret);
    const valid  = twoFA.verifyToken(secret, token);
    if (!valid) return error(res, 'Token không hợp lệ hoặc đã hết hạn', 400);

    // Generate backup codes
    const { plain, hashed } = twoFA.generateBackupCodes(10);

    await req.prisma.user.update({
      where: { id: req.user.id },
      data:  { twoFactorEnabled: true, twoFactorBackupCodes: hashed },
    });

    return success(res, {
      enabled:     true,
      backupCodes: plain, // Show ONCE — user must save these
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Disable: require password ─────────────────────────────────────────────

exports.disable = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return error(res, 'Mật khẩu là bắt buộc');

    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { password: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorEnabled) return error(res, '2FA chưa được bật');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return error(res, 'Mật khẩu không đúng', 401);

    await req.prisma.user.update({
      where: { id: req.user.id },
      data:  { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null },
    });

    return success(res, null, '2FA đã được tắt');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Verify during login ───────────────────────────────────────────────────

exports.verify = async (req, res) => {
  try {
    const { token, backupCode } = req.body;
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorBackupCodes: true },
    });
    if (!user?.twoFactorEnabled) return success(res, { verified: true }); // 2FA not required

    if (backupCode) {
      const codes  = user.twoFactorBackupCodes || [];
      const idx    = twoFA.verifyBackupCode(backupCode, codes);
      if (idx === -1) return error(res, 'Mã dự phòng không hợp lệ', 401);
      // Mark backup code as used
      codes[idx] = 'USED';
      await req.prisma.user.update({ where: { id: req.user.id }, data: { twoFactorBackupCodes: codes } });
      return success(res, { verified: true });
    }

    if (!token) return error(res, 'Token là bắt buộc');
    const secret = twoFA.decryptSecret(user.twoFactorSecret);
    const valid  = twoFA.verifyToken(secret, token);
    if (!valid) return error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    return success(res, { verified: true });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Regenerate backup codes ───────────────────────────────────────────────

exports.regenerateBackupCodes = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { twoFactorEnabled: true },
    });
    if (!user?.twoFactorEnabled) return error(res, '2FA chưa được bật');

    const { plain, hashed } = twoFA.generateBackupCodes(10);
    await req.prisma.user.update({ where: { id: req.user.id }, data: { twoFactorBackupCodes: hashed } });
    return success(res, { backupCodes: plain });
  } catch (e) { return error(res, e.message, 500); }
};
