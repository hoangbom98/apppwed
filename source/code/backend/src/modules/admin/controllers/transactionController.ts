// @ts-nocheck
// backend/src/modules/admin/controllers/transactionController.js
// Giao dịch tài chính — dùng đúng models từ game schema:
//   Transaction    → ledger entries (deposit/withdraw/bet/win/…)
//   DepositOrder   → pending/approved deposit orders
//   WithdrawOrder  → pending/approved withdrawal orders
'use strict';
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error }  = require('../../../shared/utils/response');
const emit                = require('../../../shared/socket/projectEmitter');

/**
 * GET /admin/finance/transactions
 * Danh sách Transaction ledger entries từ game DB
 */
exports.listTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, from, to } = req.query;
    const gameDb = getPrismaClient('game');

    const where = {};
    if (type) where.type = type;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [transactions, total] = await Promise.all([
      gameDb.transaction.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, email: true, fullName: true } } },
      }),
      gameDb.transaction.count({ where }),
    ]);

    return success(res, { data: transactions, total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/finance/deposits
 * Danh sách DepositOrder từ game DB
 */
exports.listDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, from, to } = req.query;
    const gameDb = getPrismaClient('game');

    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [deposits, total] = await Promise.all([
      gameDb.depositOrder.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      gameDb.depositOrder.count({ where }),
    ]);

    return success(res, { data: deposits, total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/finance/deposits/:id/approve
 * Duyệt DepositOrder → credit user balance + write Transaction ledger
 */
exports.approveDeposit = async (req, res) => {
  try {
    const project = req.project || 'game';
    const gameDb = getPrismaClient(project);
    const order = await gameDb.depositOrder.findUnique({ where: { id: req.params.id } });
    if (!order)                    return error(res, 'Deposit order not found', 404);
    if (order.status !== 'pending') return error(res, `Cannot approve: status is ${order.status}`, 400);

    const amount = Number(order.amount);
    let balanceAfter;
    await gameDb.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { balance: true } });
      const balanceBefore = Number(user?.balance || 0);
      balanceAfter = balanceBefore + amount;

      await tx.depositOrder.update({
        where: { id: order.id },
        data:  { status: 'success', processedAt: new Date() },
      });
      await tx.user.update({
        where: { id: order.userId },
        data:  { balance: { increment: amount }, totalDeposit: { increment: amount } },
      });
      await tx.transaction.create({
        data: {
          userId:        order.userId,
          type:          'deposit',
          amount,
          balanceBefore,
          balanceAfter,
          referenceId:   order.id,
          referenceType: 'deposit_order',
          note:          `Admin approved deposit - ${order.method}`,
        },
      });
    });

    // Real-time: notify admin room + the user whose deposit was approved
    emit.depositApproved(project, order.userId, {
      orderId:    order.id,
      amount,
      newBalance: balanceAfter,
      method:     order.method,
    });

    return success(res, { message: 'Deposit approved successfully' });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/finance/deposits/:id/reject
 * Từ chối DepositOrder (không trừ tiền, chỉ đổi trạng thái + ghi log)
 */
exports.rejectDeposit = async (req, res) => {
  try {
    const { reason } = req.body;
    const project = req.project || 'game';
    const gameDb = getPrismaClient(project);
    const order = await gameDb.depositOrder.findUnique({ where: { id: req.params.id } });
    if (!order)                    return error(res, 'Deposit order not found', 404);
    if (order.status !== 'pending') return error(res, `Cannot reject: status is ${order.status}`, 400);

    await gameDb.depositOrder.update({
      where: { id: order.id },
      data:  { status: 'failed', adminNote: reason || 'Admin rejected', processedAt: new Date() },
    });

    // Real-time: thông báo tới admin room + người dùng bị từ chối
    emit.depositRejected(project, order.userId, {
      orderId: order.id,
      amount:  Number(order.amount),
      reason:  reason || 'Admin rejected',
    });

    return success(res, { message: 'Deposit rejected' });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/finance/withdrawals
 * Danh sách WithdrawOrder từ game DB
 */
exports.listWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, from, to } = req.query;
    const gameDb = getPrismaClient('game');

    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [withdrawals, total] = await Promise.all([
      gameDb.withdrawOrder.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      gameDb.withdrawOrder.count({ where }),
    ]);

    return success(res, { data: withdrawals, total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/finance/withdrawals/:id/approve
 * Duyệt WithdrawOrder → debit frozen + write Transaction ledger
 */
exports.approveWithdrawal = async (req, res) => {
  try {
    const project = req.project || 'game';
    const gameDb = getPrismaClient(project);
    const order = await gameDb.withdrawOrder.findUnique({ where: { id: req.params.id } });
    if (!order)                    return error(res, 'Withdrawal not found', 404);
    if (!['pending', 'processing'].includes(order.status))
      return error(res, `Cannot approve: status is ${order.status}`, 400);

    const amount = Number(order.amount);
    let balanceAfter;
    await gameDb.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { balance: true, frozen: true } });
      const balanceBefore = Number(user?.balance || 0);
      balanceAfter        = Math.max(0, balanceBefore - amount);
      const frozenAfter   = Math.max(0, Number(user?.frozen || 0) - amount);

      await tx.withdrawOrder.update({
        where: { id: order.id },
        data:  { status: 'success', processedAt: new Date() },
      });
      await tx.user.update({
        where: { id: order.userId },
        data:  { balance: balanceAfter, frozen: frozenAfter },
      });
      await tx.transaction.create({
        data: {
          userId:        order.userId,
          type:          'withdraw',
          amount:        -amount,
          balanceBefore,
          balanceAfter,
          referenceId:   order.id,
          referenceType: 'withdraw_order',
          note:          `Admin approved withdrawal - ${order.method}`,
        },
      });
    });

    // Real-time: notify admin room + the user whose withdrawal was approved
    emit.withdrawalApproved(project, order.userId, {
      orderId:    order.id,
      amount,
      newBalance: balanceAfter,
      method:     order.method,
    });

    return success(res, { message: 'Withdrawal approved' });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/finance/withdrawals/:id/reject
 * Từ chối WithdrawOrder + hoàn tiền frozen về balance
 */
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { reason } = req.body;
    const project = req.project || 'game';
    const gameDb = getPrismaClient(project);
    const order = await gameDb.withdrawOrder.findUnique({ where: { id: req.params.id } });
    if (!order)                    return error(res, 'Withdrawal not found', 404);
    if (!['pending', 'processing'].includes(order.status))
      return error(res, `Cannot reject: status is ${order.status}`, 400);

    const amount = Number(order.amount);
    await gameDb.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { balance: true, frozen: true } });
      const balanceBefore = Number(user?.balance || 0);
      const frozenBefore  = Number(user?.frozen  || 0);

      await tx.withdrawOrder.update({
        where: { id: order.id },
        data:  { status: 'failed', adminNote: reason || 'Admin rejected', processedAt: new Date() },
      });
      // Unfreeze: decrement frozen WITHOUT deducting balance (funds stay on platform)
      await tx.user.update({
        where: { id: order.userId },
        data:  { frozen: Math.max(0, frozenBefore - amount) },
      });
      await tx.transaction.create({
        data: {
          userId:        order.userId,
          type:          'refund',
          amount,
          balanceBefore,
          balanceAfter:  balanceBefore,
          referenceId:   order.id,
          referenceType: 'withdraw_order',
          note:          `Withdrawal rejected: ${reason || 'Admin rejected'}`,
        },
      });
    });

    // Real-time: notify admin room + the user whose withdrawal was rejected
    emit.withdrawalRejected(project, order.userId, {
      orderId: order.id,
      amount,
      reason:  reason || 'Admin rejected',
    });

    return success(res, { message: 'Withdrawal rejected and frozen amount released' });
  } catch (e) { return error(res, e.message, 500); }
};
