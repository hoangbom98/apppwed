'use strict';
/**
 * paymentMonitorController.js — Admin Payment Channel Monitoring
 *
 * Routes (admin-only, auth + adminGuard applied in router):
 *   GET /admin/payment/monitor/summary        — revenue + volume today
 *   GET /admin/payment/monitor/channels       — per-gateway health + stats
 *   GET /admin/payment/monitor/pending        — pending orders needing action
 *   POST /admin/payment/monitor/retry/:orderId — re-trigger webhook for order
 *
 * Reads from admin_db (PaymentGateway, DepositOrder, WithdrawOrder).
 * For cross-project stats, reads from game_db (most payment volume).
 */
const { getPrismaClient } = require('../../config/databases');
const { ok, error, notFound } = require('../utils/response');
const PaymentFactory = require('../payment/PaymentFactory');
const logger = require('../services/logger');

// ── helpers ──────────────────────────────────────────────────────────────────

const adminDb = () => getPrismaClient('admin');
const gameDb  = () => getPrismaClient('game');

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

// ── GET /admin/payment/monitor/summary ───────────────────────────────────────

/**
 * Daily revenue snapshot — total deposited, withdrawn, pending counts.
 * Reads deposit/withdraw orders from game_db (primary payment DB).
 */
exports.getSummary = async (_req, res) => {
  try {
    const db    = gameDb();
    const today = todayRange();

    const [
      depositToday,
      depositCount,
      withdrawToday,
      withdrawCount,
      pendingDeposits,
      pendingWithdrawals,
    ] = await Promise.all([
      db.depositOrder.aggregate({
        where:  { status: 'success', createdAt: today },
        _sum:   { amount: true },
        _count: { id: true },
      }),
      db.depositOrder.count({ where: { createdAt: today } }),
      db.withdrawOrder.aggregate({
        where:  { status: 'success', createdAt: today },
        _sum:   { amount: true },
        _count: { id: true },
      }),
      db.withdrawOrder.count({ where: { createdAt: today } }),
      db.depositOrder.count({ where: { status: 'pending' } }),
      db.withdrawOrder.count({ where: { status: { in: ['pending', 'processing'] } } }),
    ]);

    return ok(res, {
      today: {
        depositAmount:   Number(depositToday._sum.amount  ?? 0),
        depositCount:    depositToday._count.id,
        depositTotal:    depositCount,
        withdrawAmount:  Number(withdrawToday._sum.amount ?? 0),
        withdrawCount:   withdrawToday._count.id,
        withdrawTotal:   withdrawCount,
      },
      pending: {
        deposits:    pendingDeposits,
        withdrawals: pendingWithdrawals,
      },
    });
  } catch (err) {
    logger.error('paymentMonitor.getSummary', { err: err.message });
    return error(res, err.message, 500);
  }
};

// ── GET /admin/payment/monitor/channels ──────────────────────────────────────

/**
 * Per-gateway stats: status, today's volume, success rate.
 */
exports.getChannels = async (_req, res) => {
  try {
    const adb = adminDb();
    const gdb = gameDb();

    const gateways = await adb.paymentGateway.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const today = todayRange();

    const stats = await Promise.all(
      gateways.map(async (gw) => {
        const [successCount, failedCount, pendingCount, totalVolume] = await Promise.all([
          gdb.depositOrder.count({ where: { gatewayId: gw.id, status: 'success',  createdAt: today } }).catch(() => 0),
          gdb.depositOrder.count({ where: { gatewayId: gw.id, status: 'failed',   createdAt: today } }).catch(() => 0),
          gdb.depositOrder.count({ where: { gatewayId: gw.id, status: 'pending'                   } }).catch(() => 0),
          gdb.depositOrder.aggregate({
            where: { gatewayId: gw.id, status: 'success', createdAt: today },
            _sum:  { amount: true },
          }).catch(() => ({ _sum: { amount: 0 } })),
        ]);

        const total       = successCount + failedCount;
        const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;

        return {
          code:        gw.code,
          name:        gw.name,
          type:        gw.type,
          status:      gw.status,
          successRate,
          todayVolume: Number(totalVolume._sum.amount ?? 0),
          todaySuccess: successCount,
          todayFailed:  failedCount,
          pending:      pendingCount,
          limits:       gw.limits,
        };
      })
    );

    return ok(res, stats);
  } catch (err) {
    logger.error('paymentMonitor.getChannels', { err: err.message });
    return error(res, err.message, 500);
  }
};

// ── GET /admin/payment/monitor/pending ───────────────────────────────────────

/**
 * Returns pending deposit + withdrawal orders that need admin action.
 * Sorted by oldest first (most urgent).
 */
exports.getPendingOrders = async (req, res) => {
  try {
    const db    = gameDb();
    const limit = Math.min(100, parseInt(req.query.limit) || 50);

    const [deposits, withdrawals] = await Promise.all([
      db.depositOrder.findMany({
        where:   { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take:    limit,
        include: {
          user:    { select: { id: true, username: true, email: true } },
          gateway: { select: { code: true, name: true, type: true } },
        },
      }).catch(() => []),

      db.withdrawOrder.findMany({
        where:   { status: { in: ['pending', 'processing'] } },
        orderBy: { createdAt: 'asc' },
        take:    limit,
        include: {
          user:    { select: { id: true, username: true, email: true } },
          gateway: { select: { code: true, name: true, type: true } },
        },
      }).catch(() => []),
    ]);

    return ok(res, { deposits, withdrawals });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── POST /admin/payment/monitor/retry/:orderId ───────────────────────────────

/**
 * Re-check status of a pending deposit order via the gateway's checkStatus().
 * If the gateway reports completion, marks the order done and credits balance.
 */
exports.retryOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const db  = gameDb();
    const adb = adminDb();

    const order = await db.depositOrder.findUnique({
      where:   { id: orderId },
      include: { gateway: true },
    });
    if (!order)                      return notFound(res, 'Order not found');
    if (order.status !== 'pending')  return error(res, `Order status is already '${order.status}'`, 400);

    const factory  = new PaymentFactory(adb);
    const adapter  = await factory.getAdapter(order.gateway.code, db);
    const statusRes = await adapter.checkStatus(order.txId ?? orderId);

    if (statusRes.status === 'completed' || statusRes.status === 'success') {
      const amount = Number(order.amount);
      await db.$transaction(async (tx) => {
        await tx.depositOrder.update({
          where: { id: orderId },
          data:  { status: 'success', processedAt: new Date() },
        });
        if (tx.user) {
          await tx.user.update({
            where: { id: order.userId },
            data:  { balance: { increment: amount } },
          }).catch(() => {});
        }
      });

      logger.info('Admin retry: deposit confirmed', { orderId, userId: order.userId, amount });
      return ok(res, { confirmed: true, orderId, amount }, 'Đơn đã được xác nhận và cộng số dư');
    }

    return ok(res, { confirmed: false, orderId, status: statusRes.status }, 'Giao dịch chưa hoàn tất');
  } catch (err) {
    logger.error('paymentMonitor.retryOrder', { err: err.message });
    return error(res, err.message, 500);
  }
};
