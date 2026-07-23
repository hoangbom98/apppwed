// @ts-nocheck
'use strict';
/**
 * trade/controllers/walletController.js
 *
 * Uses CORRECT schema models:
 *   Wallet      (@@map "wallets")      — userId UNIQUE, single wallet per user
 *   Deposit     (@@map "deposits")     — pending deposit record awaiting admin approval
 *   Withdrawal  (@@map "withdrawals")  — proper withdrawal record
 *   Transaction (@@map "transactions") — ledger: amount, type, referenceId, referenceType, note, balanceAfter
 *
 * All IDs are CUID strings.
 */
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const notifSvc = require('../../../shared/services/notificationService');

// ── GET /trade/wallet ─────────────────────────────────────────────────────────
exports.getBalances = async (req, res) => {
  try {
    const wallet = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    return success(res, wallet || { userId: req.user.id, balance: 0, frozen: 0, currency: 'USD' });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/wallet/history ─────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.type) where.type = req.query.type;
    const [data, total] = await Promise.all([
      req.prisma.transaction.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.transaction.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /trade/wallet/deposit ────────────────────────────────────────────────
// Creates a pending Deposit record. Admin approves → credits wallet.
exports.createDeposit = async (req, res) => {
  try {
    const { amount, method = 'manual', txHash, note } = req.body;
    if (!amount || parseFloat(amount) <= 0) return error(res, 'Số tiền không hợp lệ', 400);
    if (!method) return error(res, 'Phương thức thanh toán là bắt buộc', 400);

    const deposit = await req.prisma.deposit.create({
      data: {
        userId:  req.user.id,
        amount:  parseFloat(amount),
        method,
        txHash:  txHash || null,
        note:    note || `Nạp tiền qua ${method}`,
        status:  'pending',
      },
    });
    return created(res, deposit, 'Yêu cầu nạp tiền đã gửi, chờ duyệt');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/wallet/deposits ────────────────────────────────────────────────
exports.getDeposits = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.deposit.findMany({
        where: { userId: req.user.id },
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.deposit.count({ where: { userId: req.user.id } }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /trade/wallet/withdraw ───────────────────────────────────────────────
// Creates a Withdrawal record and freezes the balance.
exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, fee = 0, method, address, bankInfo } = req.body;
    if (!amount || parseFloat(amount) <= 0 || !method) return error(res, 'amount và method là bắt buộc', 400);

    const amtNum  = parseFloat(amount);
    const feeNum  = parseFloat(fee);
    const netAmt  = amtNum - feeNum;
    const total   = amtNum + feeNum;

    if (netAmt <= 0) return error(res, 'Số tiền sau phí phải lớn hơn 0', 400);

    const wallet = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.frozen) : 0;
    if (available < total) return error(res, 'Số dư khả dụng không đủ', 400);

    const withdrawal = await req.prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.create({
        data: {
          userId:    req.user.id,
          amount:    amtNum,
          fee:       feeNum,
          netAmount: netAmt,
          method,
          address:   address  || null,
          bankInfo:  bankInfo || null,
          status:    'pending',
        },
      });
      await tx.wallet.update({
        where: { userId: req.user.id },
        data:  { frozen: { increment: total } },
      });
      return w;
    });

    return created(res, withdrawal, 'Yêu cầu rút tiền đã gửi, chờ duyệt');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/wallet/company-banks ──────────────────────────────────────────
exports.getCompanyBanks = async (req, res) => {
  try {
    const banks = await req.prisma.companyBank.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, banks);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: approve deposit ────────────────────────────────────────────────────
exports.approveDeposit = async (req, res) => {
  try {
    const dep = await req.prisma.deposit.findUnique({ where: { id: req.params.id } });
    if (!dep || dep.status !== 'pending') return error(res, 'Yêu cầu nạp không hợp lệ hoặc đã xử lý', 400);

    const wallet = await req.prisma.wallet.findUnique({ where: { userId: dep.userId } });
    const newBal = (wallet ? parseFloat(wallet.balance) : 0) + parseFloat(dep.amount);

    await req.prisma.$transaction([
      req.prisma.deposit.update({
        where: { id: dep.id },
        data:  { status: 'approved', processedBy: req.user.id, processedAt: new Date() },
      }),
      req.prisma.wallet.upsert({
        where:  { userId: dep.userId },
        create: { userId: dep.userId, balance: parseFloat(dep.amount), frozen: 0 },
        update: { balance: { increment: parseFloat(dep.amount) } },
      }),
      req.prisma.transaction.create({
        data: {
          userId:        dep.userId,
          type:          'deposit',
          amount:        parseFloat(dep.amount),
          balanceAfter:  newBal,
          referenceId:   dep.id,
          referenceType: 'deposit',
          note:          `Nạp tiền đã duyệt qua ${dep.method}`,
        },
      }),
    ]);

    notifSvc.sendToUser(dep.userId, 'balance:update', { amount: dep.amount });
    notifSvc.sendToUser(dep.userId, 'notification', {
      title:   'Nạp tiền thành công',
      content: `${dep.amount} USD đã được cộng vào ví`,
    });
    return success(res, null, 'Đã duyệt nạp tiền');
  } catch (e) { return error(res, e.message, 500); }
};

exports.rejectDeposit = async (req, res) => {
  try {
    const dep = await req.prisma.deposit.findUnique({ where: { id: req.params.id } });
    if (!dep || dep.status !== 'pending') return error(res, 'Yêu cầu nạp không hợp lệ hoặc đã xử lý', 400);
    await req.prisma.deposit.update({
      where: { id: req.params.id },
      data:  { status: 'rejected', adminNote: req.body.reason || null, processedBy: req.user.id, processedAt: new Date() },
    });
    notifSvc.sendToUser(dep.userId, 'notification', {
      title:   'Yêu cầu nạp tiền bị từ chối',
      content: req.body.reason || 'Yêu cầu của bạn không hợp lệ.',
    });
    return success(res, null, 'Đã từ chối');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: approve withdrawal ─────────────────────────────────────────────────
exports.approveWithdrawal = async (req, res) => {
  try {
    const w = await req.prisma.withdrawal.findUnique({ where: { id: req.params.id } });
    if (!w || w.status !== 'pending') return error(res, 'Lệnh rút không hợp lệ hoặc đã xử lý', 400);

    const total = parseFloat(w.amount) + parseFloat(w.fee);

    await req.prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: w.id },
        data:  { status: 'completed', processedBy: req.user.id, processedAt: new Date() },
      });
      const wallet = await tx.wallet.findUnique({ where: { userId: w.userId } });
      const newBal = Math.max(0, parseFloat(wallet.balance) - total);
      await tx.wallet.update({
        where: { userId: w.userId },
        data:  { balance: { decrement: total }, frozen: { decrement: total } },
      });
      await tx.transaction.create({
        data: {
          userId:        w.userId,
          type:          'withdraw',
          amount:        -total,
          balanceAfter:  newBal,
          referenceId:   w.id,
          referenceType: 'withdrawal',
          note:          `Rút tiền duyệt bởi admin`,
        },
      });
    });

    notifSvc.sendToUser(w.userId, 'notification', {
      title:   'Rút tiền thành công',
      content: `Đã xử lý lệnh rút ${w.amount} USD`,
    });
    return success(res, null, 'Đã duyệt rút tiền');
  } catch (e) { return error(res, e.message, 500); }
};

exports.rejectWithdrawal = async (req, res) => {
  try {
    const w = await req.prisma.withdrawal.findUnique({ where: { id: req.params.id } });
    if (!w) return notFound(res);
    if (w.status !== 'pending') return error(res, 'Lệnh rút đã được xử lý', 400);

    const total = parseFloat(w.amount) + parseFloat(w.fee);
    await req.prisma.$transaction([
      req.prisma.withdrawal.update({
        where: { id: w.id },
        data:  {
          status:      'cancelled',
          adminNote:   req.body.reason || null,
          processedBy: req.user.id,
          processedAt: new Date(),
        },
      }),
      req.prisma.wallet.update({
        where: { userId: w.userId },
        data:  { frozen: { decrement: total } },
      }),
    ]);
    notifSvc.sendToUser(w.userId, 'notification', {
      title:   'Rút tiền bị từ chối',
      content: `Lệnh rút ${w.amount} USD bị từ chối. Số tiền đã được mở khóa.`,
    });
    return success(res, null, 'Đã từ chối và hoàn ví');
  } catch (e) { return error(res, e.message, 500); }
};
