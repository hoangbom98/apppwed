// @ts-nocheck
/**
 * Shared Wallet Controller — generic wallet REST handlers.
 * Mount this in any module route file by passing `req.prisma` (injected by projectResolver).
 *
 * Routes (example):
 *   GET  /wallet/balance
 *   GET  /wallet/transactions
 *   POST /wallet/deposit
 *   POST /wallet/withdraw
 *   POST /admin/wallet/deposit/:orderId/confirm   (admin only)
 *   POST /admin/wallet/withdraw/:orderId/approve  (admin only)
 *   POST /admin/wallet/withdraw/:orderId/reject   (admin only)
 */
const walletSvc  = require('../services/walletService');
const paymentSvc = require('../services/paymentService');
const { success, error, notFound } = require('../utils/response');

/* ── User-facing ────────────────────────────────────────────── */

exports.getBalance = async (req, res) => {
  try {
    const wallet = await walletSvc.getWallet(req.prisma, req.user.id);
    return success(res, {
      balance:   parseFloat(wallet.balance),
      frozen:    parseFloat(wallet.frozen  || 0),
      available: parseFloat(wallet.balance) - parseFloat(wallet.frozen || 0),
      currency:  wallet.currency,
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const result = await walletSvc.getTransactions(
      req.prisma, req.user.id, { page: +page, limit: +limit, type }
    );
    return success(res, result);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.createDeposit = async (req, res) => {
  try {
    const { method, amount, ...extra } = req.body;
    if (!method || !amount) return error(res, 'method and amount are required', 422);
    if (Number(amount) <= 0)  return error(res, 'amount must be positive', 422);

    const order = await paymentSvc.createDepositOrder(req.prisma, req.user.id, method, amount, extra);
    return success(res, {
      orderId:   order.id,
      amount:    parseFloat(order.amount),
      fee:       parseFloat(order.fee || 0),
      method:    order.method,
      status:    order.status,
      createdAt: order.createdAt,
    }, 'Deposit order created', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.createWithdraw = async (req, res) => {
  try {
    const { method, amount, ...extra } = req.body;
    if (!method || !amount) return error(res, 'method and amount are required', 422);
    if (Number(amount) <= 0) return error(res, 'amount must be positive', 422);

    const fee   = paymentSvc.calcWithdrawalFee(method, amount);
    const order = await paymentSvc.createWithdrawOrder(req.prisma, req.user.id, method, amount, extra);
    return success(res, {
      orderId:   order.id,
      amount:    parseFloat(order.amount),
      fee,
      netAmount: parseFloat(order.amount) - fee,
      method:    order.method,
      status:    order.status,
      createdAt: order.createdAt,
    }, 'Withdrawal order created', 201);
  } catch (e) {
    if (e.message.includes('Insufficient')) return error(res, e.message, 400);
    return error(res, e.message, 500);
  }
};

/* ── Admin-facing ───────────────────────────────────────────── */

exports.confirmDeposit = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { txId }    = req.body;
    const order = await paymentSvc.confirmDeposit(req.prisma, orderId, txId);
    return success(res, order);
  } catch (e) {
    if (e.message.includes('not found')) return notFound(res, e.message);
    return error(res, e.message, 400);
  }
};

exports.approveWithdraw = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { txId }    = req.body;
    const order = await paymentSvc.approveWithdraw(req.prisma, orderId, txId);
    return success(res, order);
  } catch (e) {
    if (e.message.includes('not found')) return notFound(res, e.message);
    return error(res, e.message, 400);
  }
};

exports.rejectWithdraw = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note }    = req.body;
    const order = await paymentSvc.rejectWithdraw(req.prisma, orderId, note);
    return success(res, order);
  } catch (e) {
    if (e.message.includes('not found')) return notFound(res, e.message);
    return error(res, e.message, 400);
  }
};

exports.getDepositOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const skip  = (Math.max(1, +page) - 1) * Math.min(100, +limit);
    const take  = Math.min(100, +limit);
    const where = {};
    if (status) where.status = status;
    // Admin sees all; regular user sees only own
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = parseInt(userId);
    }

    const [data, total] = await Promise.all([
      req.prisma.depositOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.depositOrder.count({ where }),
    ]);
    return success(res, { data, total, page: +page, limit: +limit });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.getWithdrawOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const skip  = (Math.max(1, +page) - 1) * Math.min(100, +limit);
    const take  = Math.min(100, +limit);
    const where = {};
    if (status) where.status = status;
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = parseInt(userId);
    }

    const [data, total] = await Promise.all([
      req.prisma.withdrawOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.withdrawOrder.count({ where }),
    ]);
    return success(res, { data, total, page: +page, limit: +limit });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.processWebhook = async (req, res) => {
  try {
    const provider = req.params.provider || req.query.provider || 'generic';
    const result = await paymentSvc.handleWebhook(req.body, provider, req.prisma);
    return success(res, result);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
