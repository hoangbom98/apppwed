// @ts-nocheck
/**
 * game/controllers/walletController.js
 *
 * Deposit & Withdraw — tích hợp config động (ProjectConfig) qua req.configService:
 *   - Kiểm tra deposit/withdraw enabled
 *   - Validate method có trong danh sách được phép
 *   - Validate min/max amount
 *   - Kiểm tra KYC nếu requireKYC = true (tra cứu admin_db qua shared configService)
 */
const { success, created, error } = require('../../../shared/utils/response');
const { paginate }                = require('../../../shared/utils/helpers');
const notifSvc    = require('../../../shared/services/notificationService');
const WalletService = require('../../../shared/services/walletService');
const missionSvc  = require('../services/missionService');

// ── Balance ───────────────────────────────────────────────────────────────────
exports.getBalance = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { balance: true, frozen: true, vipLevel: true },
    });
    return success(res, user);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Transaction history ───────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.type) where.type = req.query.type;
    const [data, total] = await Promise.all([
      req.prisma.transaction.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.transaction.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/wallet/deposit-config — config nạp tiền cho frontend ────────────
exports.getDepositConfig = async (req, res) => {
  try {
    const cfg = await req.configService.getDepositConfig('game');
    return success(res, cfg);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/wallet/withdraw-config — config rút tiền cho frontend ───────────
exports.getWithdrawConfig = async (req, res) => {
  try {
    const cfg = await req.configService.getWithdrawConfig('game');
    return success(res, cfg);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/wallet/deposit ─────────────────────────────────────────────────
exports.createDeposit = async (req, res) => {
  try {
    const { method, amount } = req.body;
    if (!method || !amount) return error(res, 'Thiếu method hoặc amount', 400);

    // Kiểm tra eligibility qua config động (enabled, method hợp lệ, min/max, KYC)
    const walletSvc = new WalletService(req.prisma);
    // configService trên walletSvc trỏ đến game_db — override để dùng admin_db
    walletSvc.configService = req.configService;
    await walletSvc.checkDepositEligibility('game', Number(amount), req.user.id, method);

    const order = await req.prisma.depositOrder.create({
      data: { userId: req.user.id, method, amount: Number(amount), currency: 'VND' },
    });
    return created(res, order, 'Tạo lệnh nạp thành công');
  } catch (e) {
    // Lỗi từ eligibility check (400) vs lỗi server (500)
    const status = e.message.includes('tạm thời') || e.message.includes('tối thiểu') ||
                   e.message.includes('tối đa') || e.message.includes('KYC') ||
                   e.message.includes('không được hỗ trợ') ? 400 : 500;
    return error(res, e.message, status);
  }
};

// ── GET /game/wallet/deposits ─────────────────────────────────────────────────
exports.getDeposits = async (req, res) => {
  try {
    const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.depositOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.depositOrder.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/wallet/withdraw ────────────────────────────────────────────────
exports.createWithdraw = async (req, res) => {
  try {
    const { method, amount, address, bankInfo } = req.body;
    if (!amount || amount <= 0) return error(res, 'Số tiền không hợp lệ', 400);

    // Kiểm tra eligibility
    const walletSvc = new WalletService(req.prisma);
    walletSvc.configService = req.configService;
    await walletSvc.checkWithdrawEligibility('game', Number(amount), req.user.id, method);

    // Kiểm tra số dư
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    const available = parseFloat(user.balance) - parseFloat(user.frozen || 0);
    if (available < parseFloat(amount)) return error(res, 'Số dư khả dụng không đủ', 400);

    const numAmount = parseFloat(amount);
    const fee       = 0; // fee computed from config; default 0
    await req.prisma.$transaction([
      req.prisma.user.update({
        where: { id: req.user.id },
        data:  { frozen: { increment: numAmount } },
      }),
      req.prisma.withdrawOrder.create({
        data: {
          userId:    req.user.id,
          method,
          amount:    numAmount,
          fee,
          netAmount: numAmount - fee,
          address,
          bankInfo,
        },
      }),
    ]);
    return created(res, null, 'Tạo lệnh rút thành công');
  } catch (e) {
    const status = e.message.includes('tạm thời') || e.message.includes('tối thiểu') ||
                   e.message.includes('tối đa') || e.message.includes('KYC') ||
                   e.message.includes('không được hỗ trợ') || e.message.includes('không đủ') ? 400 : 500;
    return error(res, e.message, status);
  }
};

// ── GET /game/wallet/withdrawals ──────────────────────────────────────────────
exports.getWithdraws = async (req, res) => {
  try {
    const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.withdrawOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.withdrawOrder.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: approve deposit ────────────────────────────────────────────────────
exports.approveDeposit = async (req, res) => {
  try {
    const order = await req.prisma.depositOrder.findUnique({ where: { id: req.params.id } });
    if (!order || order.status !== 'pending') return error(res, 'Lệnh không hợp lệ', 400);
    const user = await req.prisma.user.findUnique({ where: { id: order.userId } });
    const newBalance = parseFloat(user.balance) + parseFloat(order.amount);
    await req.prisma.$transaction([
      req.prisma.depositOrder.update({ where: { id: order.id }, data: { status: 'success', processedAt: new Date() } }),
      req.prisma.user.update({ where: { id: order.userId }, data: { balance: newBalance, totalDeposit: { increment: parseFloat(order.amount) } } }),
      req.prisma.transaction.create({
        data: {
          userId:        order.userId,
          amount:        order.amount,
          balanceBefore: parseFloat(user.balance),
          balanceAfter:  newBalance,
          type:          'deposit',
          referenceId:   order.id,
          referenceType: 'deposit_order',
          note:          `Nạp ${order.method}`,
        },
      }),
    ]);
    notifSvc.sendToUser(order.userId, 'balance:update', { balance: newBalance });
    notifSvc.sendToUser(order.userId, 'notification', {
      title:   'Nạp tiền thành công',
      content: `${parseFloat(order.amount).toLocaleString('vi-VN')} VND đã được cộng vào tài khoản`,
    });
    // Fire-and-forget: advance DEPOSIT mission progress
    missionSvc.incrementProgress(order.userId, 'DEPOSIT', 1, req.prisma);
    return success(res, null, 'Đã duyệt nạp tiền');
  } catch (e) { return error(res, e.message, 500); }
};

exports.rejectDeposit = async (req, res) => {
  try {
    await req.prisma.depositOrder.update({
      where: { id: req.params.id },
      data:  { status: 'failed', adminNote: req.body.reason, processedAt: new Date() },
    });
    return success(res, null, 'Đã từ chối');
  } catch (e) { return error(res, e.message, 500); }
};

exports.approveWithdraw = async (req, res) => {
  try {
    const order = await req.prisma.withdrawOrder.findUnique({ where: { id: req.params.id } });
    if (!order || order.status !== 'pending') return error(res, 'Lệnh không hợp lệ', 400);
    const user = await req.prisma.user.findUnique({ where: { id: order.userId } });
    const newBalance = Math.max(0, parseFloat(user.balance) - parseFloat(order.amount));
    const newFrozen  = Math.max(0, parseFloat(user.frozen) - parseFloat(order.amount));
    await req.prisma.$transaction([
      req.prisma.withdrawOrder.update({ where: { id: order.id }, data: { status: 'success', processedAt: new Date() } }),
      req.prisma.user.update({ where: { id: order.userId }, data: { balance: newBalance, frozen: newFrozen } }),
      req.prisma.transaction.create({
        data: {
          userId:        order.userId,
          amount:        -parseFloat(order.amount),
          balanceBefore: parseFloat(user.balance),
          balanceAfter:  newBalance,
          type:          'withdraw',
          referenceId:   order.id,
          referenceType: 'withdraw_order',
          note:          `Rút ${order.method}`,
        },
      }),
    ]);
    notifSvc.sendToUser(order.userId, 'notification', {
      title:   'Rút tiền thành công',
      content: `Lệnh rút ${parseFloat(order.amount).toLocaleString('vi-VN')} VND đã được xử lý`,
    });
    return success(res, null, 'Đã duyệt rút tiền');
  } catch (e) { return error(res, e.message, 500); }
};

exports.rejectWithdraw = async (req, res) => {
  try {
    const order = await req.prisma.withdrawOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return error(res, 'Không tìm thấy', 404);
    await req.prisma.$transaction([
      req.prisma.withdrawOrder.update({
        where: { id: order.id },
        data:  { status: 'failed', adminNote: req.body.reason, processedAt: new Date() },
      }),
      req.prisma.user.update({
        where: { id: order.userId },
        data:  { frozen: { decrement: parseFloat(order.amount) } },
      }),
    ]);
    notifSvc.sendToUser(order.userId, 'notification', {
      title:   'Rút tiền bị từ chối',
      content: 'Lệnh rút tiền của bạn bị từ chối. Số tiền đã được hoàn lại.',
    });
    return success(res, null, 'Đã từ chối và hoàn tiền');
  } catch (e) { return error(res, e.message, 500); }
};
