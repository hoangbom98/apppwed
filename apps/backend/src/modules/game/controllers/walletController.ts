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
const Decimal                     = require('decimal.js');
const bcrypt                      = require('bcryptjs');
const notifSvc    = require('../../../shared/services/notificationService');
const WalletService = require('../../../shared/services/walletService');
const missionSvc  = require('../services/missionService');

const toMoney = (value) => new Decimal(value).toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);
const moneyValue = (value) => toMoney(value).toString();

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
    const numAmount = toMoney(amount);
    const fee       = toMoney(0);
    await req.prisma.$transaction(async (tx) => {
      const result = await tx.$executeRaw`
        UPDATE users SET frozen = frozen + ${numAmount.toString()}, updatedAt = NOW()
        WHERE id = ${req.user.id} AND balance - frozen >= ${numAmount.toString()}
      `;
      if (result === 0) throw Object.assign(new Error('Số dư khả dụng không đủ'), { status: 400 });

      await tx.withdrawOrder.create({
        data: {
          userId:    req.user.id,
          method,
          amount:    numAmount.toString(),
          fee:       fee.toString(),
          netAmount: numAmount.minus(fee).toString(),
          address,
          bankInfo,
        },
      });
    });
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
    const amount = toMoney(order.amount);
    let newBalance;
    await req.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { balance: true } });
      if (!user) throw new Error('User not found');
      const balanceBefore = toMoney(user.balance);
      newBalance = balanceBefore.plus(amount).toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);

      await tx.depositOrder.update({ where: { id: order.id }, data: { status: 'success', processedAt: new Date() } });
      await tx.user.update({ where: { id: order.userId }, data: { balance: { increment: amount.toString() }, totalDeposit: { increment: amount.toString() } } });
      await tx.transaction.create({
        data: {
          userId:        order.userId,
          amount:        amount.toString(),
          balanceBefore: balanceBefore.toString(),
          balanceAfter:  newBalance.toString(),
          type:          'deposit',
          referenceId:   order.id,
          referenceType: 'deposit_order',
          note:          `Nạp ${order.method}`,
        },
      });
    });
    notifSvc.sendToUser(order.userId, 'balance:update', { balance: newBalance.toString() });
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
    await req.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { balance: true, frozen: true } });
      if (!user) throw new Error('User not found');
      const amount = toMoney(order.amount);
      const balanceBefore = toMoney(user.balance);
      const frozenBefore = toMoney(user.frozen || 0);
      if (balanceBefore.lt(amount) || frozenBefore.lt(amount)) throw Object.assign(new Error('Số dư frozen không đủ để duyệt rút'), { status: 400 });
      const newBalance = balanceBefore.minus(amount).toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);
      const newFrozen = frozenBefore.minus(amount).toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);

      await tx.withdrawOrder.update({ where: { id: order.id }, data: { status: 'success', processedAt: new Date() } });
      await tx.user.update({ where: { id: order.userId }, data: { balance: newBalance.toString(), frozen: newFrozen.toString() } });
      await tx.transaction.create({
        data: {
          userId:        order.userId,
          amount:        amount.negated().toString(),
          balanceBefore: balanceBefore.toString(),
          balanceAfter:  newBalance.toString(),
          type:          'withdraw',
          referenceId:   order.id,
          referenceType: 'withdraw_order',
          note:          `Rút ${order.method}`,
        },
      });
    });
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
    await req.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { frozen: true } });
      if (!user) throw new Error('User not found');
      const amount = toMoney(order.amount);
      const frozenBefore = toMoney(user.frozen || 0);
      if (frozenBefore.lt(amount)) throw Object.assign(new Error('Số dư frozen không đủ để hoàn rút'), { status: 400 });

      await tx.withdrawOrder.update({
        where: { id: order.id },
        data:  { status: 'failed', adminNote: req.body.reason, processedAt: new Date() },
      });
      await tx.user.update({
        where: { id: order.userId },
        data:  { frozen: frozenBefore.minus(amount).toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN).toString() },
      });
    });
    notifSvc.sendToUser(order.userId, 'notification', {
      title:   'Rút tiền bị từ chối',
      content: 'Lệnh rút tiền của bạn bị từ chối. Số tiền đã được hoàn lại.',
    });
    return success(res, null, 'Đã từ chối và hoàn tiền');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/wallet/transfer — chuyển tiền ví chính ↔ ví game ───────────────
// Vì hệ thống dùng seamless wallet (user.balance = ví duy nhất),
// transfer 'in'/'out' chỉ ghi log; không thay đổi balance thực.
exports.transfer = async (req, res) => {
  try {
    const { direction, amount } = req.body;
    if (!direction || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return error(res, 'direction (in|out) và amount là bắt buộc', 400);
    }
    if (!['in', 'out'].includes(direction)) {
      return error(res, 'direction phải là in hoặc out', 400);
    }

    const numAmount = parseFloat(amount);
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { balance: true, frozen: true },
    });
    if (!user) return error(res, 'Không tìm thấy tài khoản', 404);

    const available = parseFloat(user.balance) - parseFloat(user.frozen || 0);
    if (available < numAmount) return error(res, 'Số dư khả dụng không đủ', 400);

    const note = direction === 'in'
      ? `Chuyển vào ví game: ${numAmount.toLocaleString('vi-VN')} VND`
      : `Chuyển ra ví chính: ${numAmount.toLocaleString('vi-VN')} VND`;

    await req.prisma.transaction.create({
      data: {
        userId:        req.user.id,
        type:          direction === 'in' ? 'transfer_in' : 'transfer_out',
        amount:        direction === 'in' ? -numAmount : numAmount,
        balanceBefore: parseFloat(user.balance),
        balanceAfter:  parseFloat(user.balance),
        referenceType: 'transfer',
        note,
      },
    });

    return success(res, { transferred: true, direction, amount: numAmount }, note);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/wallet/transfer-user — chuyển tiền P2P giữa 2 user ────────────
exports.transferUser = async (req, res) => {
  try {
    const { toUsername, amount, tradingPassword } = req.body;
    if (!toUsername || !amount || Number(amount) <= 0) {
      return error(res, 'toUsername và amount là bắt buộc', 400);
    }
    if (!tradingPassword || String(tradingPassword).length < 4) {
      return error(res, 'Mật khẩu giao dịch không hợp lệ', 400);
    }

    const numAmount = parseFloat(amount);
    const sender    = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { balance: true, frozen: true, tradingPassword: true, username: true },
    });
    if (!sender) return error(res, 'Không tìm thấy tài khoản', 404);

    if (!sender.tradingPassword) return error(res, 'Vui lòng thiết lập mật khẩu giao dịch trước', 400);
    const pwd = String(tradingPassword);
    const storedPwd = String(sender.tradingPassword);
    const validTradingPassword = storedPwd.startsWith('$2')
      ? await bcrypt.compare(pwd, storedPwd)
      : storedPwd === pwd;
    if (!validTradingPassword) return error(res, 'Mật khẩu giao dịch không đúng', 400);
    if (!storedPwd.startsWith('$2')) {
      await req.prisma.user.update({ where: { id: req.user.id }, data: { tradingPassword: await bcrypt.hash(pwd, 10) } });
    }

    const available = parseFloat(sender.balance) - parseFloat(sender.frozen || 0);
    if (available < numAmount) return error(res, 'Số dư khả dụng không đủ', 400);

    const receiver = await req.prisma.user.findFirst({
      where:  { OR: [{ username: toUsername }, { email: toUsername }] },
      select: { id: true, username: true, balance: true },
    });
    if (!receiver) return error(res, 'Không tìm thấy người nhận', 404);
    if (receiver.id === req.user.id) return error(res, 'Không thể tự chuyển cho mình', 400);

    const amountDec = toMoney(numAmount);
    const senderBefore = toMoney(sender.balance);
    const receiverBefore = toMoney(receiver.balance);
    const senderNewBal = senderBefore.minus(amountDec).toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);
    const receiverNewBal = receiverBefore.plus(amountDec).toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);
    const ref = `p2p_${Date.now()}`;

    await req.prisma.$transaction(async (tx) => {
      const result = await tx.$executeRaw`
        UPDATE users SET balance = balance - ${amountDec.toString()}, updatedAt = NOW()
        WHERE id = ${req.user.id} AND balance - frozen >= ${amountDec.toString()}
      `;
      if (result === 0) throw Object.assign(new Error('Số dư khả dụng không đủ'), { status: 400 });
      await tx.user.update({ where: { id: receiver.id }, data: { balance: { increment: amountDec.toString() } } });
      await tx.transaction.create({ data: {
        userId:        req.user.id,
        type:          'transfer_out',
        amount:        amountDec.negated().toString(),
        balanceBefore: senderBefore.toString(),
        balanceAfter:  senderNewBal.toString(),
        referenceId:   ref,
        referenceType: 'p2p_transfer',
        note:          `Chuyển tiền → ${receiver.username}: ${amountDec.toNumber().toLocaleString('vi-VN')} VND`,
      }});
      await tx.transaction.create({ data: {
        userId:        receiver.id,
        type:          'transfer_in',
        amount:        amountDec.toString(),
        balanceBefore: receiverBefore.toString(),
        balanceAfter:  receiverNewBal.toString(),
        referenceId:   ref,
        referenceType: 'p2p_transfer',
        note:          `Nhận tiền ← ${sender.username}: ${amountDec.toNumber().toLocaleString('vi-VN')} VND`,
      }});
    });

    notifSvc.sendToUser(receiver.id, 'notification', {
      title:   'Nhận tiền chuyển khoản',
      content: `${sender.username} đã chuyển ${numAmount.toLocaleString('vi-VN')} VND cho bạn`,
    });

    return success(res, { newBalance: senderNewBal.toString(), toUser: receiver.username, amount: amountDec.toString() }, 'Chuyển tiền thành công');
  } catch (e) { return error(res, e.message, 500); }
};
