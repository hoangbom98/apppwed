// @ts-nocheck
'use strict';
/**
 * trade/controllers/walletController.js
 *
 * Uses CORRECT schema models:
 *   Wallet      (@@map "wallets")      — userId UNIQUE, single wallet per user
 *   Withdrawal  (@@map "withdrawals")  — proper withdrawal record
 *   Transaction (@@map "transactions") — ledger: amount, type, referenceId, referenceType, note, balanceAfter
 *
 * Transaction does NOT have: currency, txHash, fee, status fields.
 * Withdrawal model handles the withdrawal lifecycle (pending→processing→completed/failed/cancelled).
 * All IDs are CUID strings.
 */
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');
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

// ── POST /trade/wallet/withdraw ───────────────────────────────────────────────
// Creates a Withdrawal record and freezes the balance.
exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, fee = 0, method, address, bankInfo } = req.body;
    if (!amount || parseFloat(amount) <= 0 || !method) return error(res, 'amount và method là bắt buộc', 400);

    // Block trading-frozen accounts
    const userCheck = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { tradingFrozen: true, status: true },
    });
    if (!userCheck || userCheck.status !== 'active') return error(res, 'Tài khoản bị khóa', 403);
    if (userCheck.tradingFrozen) return error(res, 'Tài khoản bị cấm giao dịch', 403);

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

// ── Admin: approve deposit ────────────────────────────────────────────────────
exports.approveDeposit = async (req, res) => {
  try {
    const txn = await req.prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!txn || txn.type !== 'deposit') return error(res, 'Giao dịch không hợp lệ', 400);

    const wallet = await req.prisma.wallet.findUnique({ where: { userId: txn.userId } });
    const newBal = (wallet ? parseFloat(wallet.balance) : 0) + parseFloat(txn.amount);

    await req.prisma.$transaction([
      req.prisma.transaction.update({
        where: { id: txn.id },
        data:  { balanceAfter: newBal, note: (txn.note || '') + ' [approved]' },
      }),
      req.prisma.wallet.upsert({
        where:  { userId: txn.userId },
        create: { userId: txn.userId, balance: parseFloat(txn.amount), frozen: 0 },
        update: { balance: { increment: parseFloat(txn.amount) } },
      }),
    ]);

    notifSvc.sendToUser(txn.userId, 'balance:update', { amount: txn.amount });
    notifSvc.sendToUser(txn.userId, 'notification', {
      title:   'Nạp tiền thành công',
      content: `${txn.amount} USD đã được cộng vào ví`,
    });
    return success(res, null, 'Đã duyệt nạp tiền');
  } catch (e) { return error(res, e.message, 500); }
};

exports.rejectDeposit = async (req, res) => {
  try {
    const txn = await req.prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!txn || txn.type !== 'deposit') return error(res, 'Giao dịch không hợp lệ', 400);
    await req.prisma.transaction.update({
      where: { id: req.params.id },
      data:  { note: (txn.note || '') + ` [rejected: ${req.body.reason || 'no reason'}]` },
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
      // Unfreeze balance
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
