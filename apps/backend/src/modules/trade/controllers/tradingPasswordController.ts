// @ts-nocheck
'use strict';
/**
 * tradingPasswordController — separate 6-digit trading password
 * Used to confirm: withdrawals, order placement, investment purchases
 */
const bcrypt  = require('bcryptjs');
const { success, error } = require('../../../shared/utils/network/response');

// ── POST /trade/trading-password/set ─────────────────────────────────────────
exports.set = async (req, res) => {
  try {
    const { password, loginPassword } = req.body;
    if (!password || !loginPassword) return error(res, 'password và loginPassword là bắt buộc', 400);
    if (!/^\d{6}$/.test(password))    return error(res, 'Mật khẩu giao dịch phải là 6 chữ số', 400);

    // Verify login password first
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(loginPassword, user.password);
    if (!valid) return error(res, 'Mật khẩu đăng nhập không đúng', 401);

    const hashed = await bcrypt.hash(password, 10);
    await req.prisma.user.update({
      where: { id: req.user.id },
      data:  { tradingPassword: hashed },
    });
    return success(res, null, 'Đã thiết lập mật khẩu giao dịch');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── POST /trade/trading-password/change ───────────────────────────────────────
exports.change = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)  return error(res, 'oldPassword và newPassword là bắt buộc', 400);
    if (!/^\d{6}$/.test(newPassword))  return error(res, 'Mật khẩu giao dịch phải là 6 chữ số', 400);

    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.tradingPassword) return error(res, 'Chưa thiết lập mật khẩu giao dịch', 400);
    const valid = await bcrypt.compare(oldPassword, user.tradingPassword);
    if (!valid) return error(res, 'Mật khẩu cũ không đúng', 401);

    const hashed = await bcrypt.hash(newPassword, 10);
    await req.prisma.user.update({
      where: { id: req.user.id },
      data:  { tradingPassword: hashed },
    });
    return success(res, null, 'Đã đổi mật khẩu giao dịch');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── POST /trade/trading-password/verify ───────────────────────────────────────
// Used internally by other controllers to verify trading password
exports.verify = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return error(res, 'password là bắt buộc', 400);
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.tradingPassword) return error(res, 'Chưa thiết lập mật khẩu giao dịch', 400);
    const valid = await bcrypt.compare(password, user.tradingPassword);
    if (!valid) return error(res, 'Mật khẩu giao dịch không đúng', 401);
    return success(res, null, 'Xác thực thành công');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── Middleware: requireTradingPassword ─────────────────────────────────────────
// Add to routes that need trading password: router.post('/withdraw', auth, requireTradingPassword, ...)
exports.requireTradingPassword = async (req: any, res: any, next: any) => {
  try {
    const pwd = req.body.tradingPassword || req.headers['x-trading-password'];
    if (!pwd) return error(res, 'Mật khẩu giao dịch là bắt buộc', 400);
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.tradingPassword) return error(res, 'Vui lòng thiết lập mật khẩu giao dịch trước', 400);
    const valid = await bcrypt.compare(String(pwd), user.tradingPassword);
    if (!valid) return error(res, 'Mật khẩu giao dịch không đúng', 401);
    next();
  } catch (e: any) { return error(res, e.message, 500); }
};
