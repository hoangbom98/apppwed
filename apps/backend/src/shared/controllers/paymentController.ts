'use strict';
/**
 * paymentController.js — Payment Engine HTTP layer
 *
 * Routes (mounted at /api/payment or per-project):
 *   GET  /gateways               — public list of active gateways
 *   POST /deposit                — create deposit order + get instructions
 *   POST /webhook/:gatewayCode   — inbound webhook from payment provider
 *   GET  /orders/deposit         — user's deposit history
 *   GET  /orders/withdraw        — user's withdraw history
 *   POST /withdraw               — create withdrawal request
 *
 * Admin routes (additional guards applied in router):
 *   GET    /admin/gateways           — all gateways (masked config)
 *   PUT    /admin/gateways/:code     — update gateway config
 *   POST   /admin/gateways/:code/toggle — toggle active/inactive
 *   GET    /admin/gateways/available — list registered adapter codes
 */
const PaymentFactory = require('../payment/PaymentFactory');
const { success, created, error, notFound, paginate } = require('../utils/response');
const logger = require('../services/logger');

// ── Helper: get admin_db Prisma for gateway config ──────────────────────────
function getAdminPrisma(_req) {
  // projectResolver attaches req.prisma for the current project's DB.
  // PaymentGateway table lives in admin_db, so we get it from databases config.
  const { getPrismaClient } = require('../../config/databases');
  return getPrismaClient('admin');
}

// ── PUBLIC ───────────────────────────────────────────────────────────────────

/**
 * GET /payment/gateways
 * Returns active gateways (public info, no secrets).
 */
exports.getGateways = async (req, res) => {
  try {
    const adminPrisma = getAdminPrisma(req);
    const factory     = new PaymentFactory(adminPrisma);
    const gateways    = await factory.getActiveGateways();
    return success(res, gateways);
  } catch (err) {
    logger.error('getGateways error', { err: err.message });
    return error(res, 'Không thể tải danh sách cổng thanh toán', 500);
  }
};

/**
 * POST /payment/deposit
 * Body: { gatewayCode: string, amount: number }
 * Creates a DepositOrder and returns payment instructions.
 */
exports.createDeposit = async (req, res) => {
  try {
    const { gatewayCode, amount } = req.body;
    const userId = req.user?.id;

    if (!gatewayCode) return error(res, 'gatewayCode là bắt buộc');
    if (!amount || Number(amount) <= 0) return error(res, 'Số tiền không hợp lệ');

    const adminPrisma = getAdminPrisma(req);
    const factory     = new PaymentFactory(adminPrisma);

    // Build adapter (validates gateway is active) — pass project prisma for DB writes
    const adapter = await factory.getAdapter(gatewayCode, req.prisma);

    // Validate amount before creating order
    adapter.validateAmount(Number(amount));

    // Create pending deposit order in the current project's DB
    const order = await req.prisma.depositOrder.create({
      data: {
        userId,
        gatewayId: adapter.gateway.id,
        amount:    Number(amount),
        currency:  req.body.currency ?? 'VND',
        status:    'pending',
      },
    });

    // Get payment instructions from adapter
    const instructions = await adapter.createDeposit(order);

    logger.info('Deposit order created', { orderId: order.id, userId, gatewayCode, amount });

    return created(res, { orderId: order.id, ...instructions }, 'Tạo đơn nạp tiền thành công');
  } catch (err) {
    logger.error('createDeposit error', { err: err.message, body: req.body });
    return error(res, err.message || 'Không thể tạo đơn nạp tiền', 500);
  }
};

/**
 * POST /payment/withdraw
 * Body: { gatewayCode, amount, address?, bankInfo? }
 */
exports.createWithdraw = async (req, res) => {
  try {
    const { gatewayCode, amount, address, bankInfo } = req.body;
    const userId = req.user?.id;

    if (!gatewayCode) return error(res, 'gatewayCode là bắt buộc');
    if (!amount || Number(amount) <= 0) return error(res, 'Số tiền không hợp lệ');

    const adminPrisma = getAdminPrisma(req);
    const factory     = new PaymentFactory(adminPrisma);
    const adapter     = await factory.getAdapter(gatewayCode, req.prisma);

    adapter.validateAmount(Number(amount));

    const order = await req.prisma.withdrawOrder.create({
      data: {
        userId,
        gatewayId: adapter.gateway.id,
        amount:    Number(amount),
        currency:  req.body.currency ?? 'VND',
        address:   address ?? null,
        bankInfo:  bankInfo ?? null,
        status:    'pending',
      },
    });

    logger.info('Withdraw order created', { orderId: order.id, userId, gatewayCode, amount });

    return created(res, { orderId: order.id }, 'Yêu cầu rút tiền đã được tạo. Đang chờ xử lý.');
  } catch (err) {
    logger.error('createWithdraw error', { err: err.message });
    return error(res, err.message || 'Không thể tạo yêu cầu rút tiền', 500);
  }
};

/**
 * POST /payment/webhook/:gatewayCode
 * Inbound webhook — no auth middleware (uses signature verification inside adapter).
 */
exports.handleWebhook = async (req, res) => {
  const { gatewayCode } = req.params;

  try {
    const sig         = req.headers['x-signature'] ?? req.headers['x-webhook-signature'] ?? null;
    const adminPrisma = getAdminPrisma(req);
    const factory     = new PaymentFactory(adminPrisma);
    const adapter     = await factory.getAdapter(gatewayCode, req.prisma);

    const result = await adapter.verifyPayment(req.body, sig);

    if (!result.success) {
      logger.warn('Webhook verification failed', { gatewayCode, error: result.error });
      return res.status(400).json({ success: false, error: result.error ?? 'Verification failed' });
    }

    // Update deposit order + credit user balance in a single transaction
    if (result.orderId) {
      await req.prisma.$transaction(async (tx) => {
        const depositOrder = await tx.depositOrder.findFirst({
          where: {
            id:     result.orderId,
            status: 'pending',
          },
        });

        if (depositOrder) {
          await tx.depositOrder.update({
            where: { id: depositOrder.id },
            data:  { status: 'completed', txId: result.txId, processedAt: new Date() },
          });

          // Credit user balance if model exists in this project's DB
          if (tx.user) {
            await tx.user.update({
              where: { id: depositOrder.userId },
              data:  { balance: { increment: Number(depositOrder.amount) } },
            }).catch(() => {/* model may not have balance field */ });
          }

          logger.info('Deposit confirmed via webhook', {
            orderId: depositOrder.id,
            userId:  depositOrder.userId,
            amount:  depositOrder.amount,
            gatewayCode,
          });
        }
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('handleWebhook error', { gatewayCode, err: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
};

// ── USER HISTORY ─────────────────────────────────────────────────────────────

/**
 * GET /payment/orders/deposit?page=1&limit=10
 */
exports.getDepositHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;

    const [data, total] = await Promise.all([
      req.prisma.depositOrder.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { gateway: { select: { code: true, name: true, type: true } } },
      }),
      req.prisma.depositOrder.count({ where: { userId } }),
    ]);

    return paginate(res, data, { total, page, limit });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /payment/orders/withdraw?page=1&limit=10
 */
exports.getWithdrawHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;

    const [data, total] = await Promise.all([
      req.prisma.withdrawOrder.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { gateway: { select: { code: true, name: true, type: true } } },
      }),
      req.prisma.withdrawOrder.count({ where: { userId } }),
    ]);

    return paginate(res, data, { total, page, limit });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

/**
 * GET /admin/payment/gateways  — all gateways with masked config
 */
exports.adminListGateways = async (req, res) => {
  try {
    const adminPrisma = getAdminPrisma(req);
    const factory     = new PaymentFactory(adminPrisma);
    const gateways    = await factory.getAllGateways();
    return success(res, gateways);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /admin/payment/gateways/available
 * Returns list of registered adapter codes (those with an implementation).
 */
exports.adminAvailableAdapters = (_req, res) => {
  return success(res, Object.keys(PaymentFactory.ADAPTER_MAP));
};

/**
 * PUT /admin/payment/gateways/:code  — update gateway config/fees/limits
 * Body: { name?, status?, config?, fees?, limits?, sortOrder? }
 */
exports.adminUpdateGateway = async (req, res) => {
  try {
    const { code } = req.params;
    const adminPrisma = getAdminPrisma(req);
    const factory     = new PaymentFactory(adminPrisma);
    const updated     = await factory.updateGateway(code, req.body);
    return success(res, updated, 'Đã cập nhật gateway');
  } catch (err) {
    if (err.code === 'P2025') return notFound(res);
    return error(res, err.message, 500);
  }
};

/**
 * POST /admin/payment/gateways/:code/toggle  — bật/tắt gateway
 */
exports.adminToggleGateway = async (req, res) => {
  try {
    const { code } = req.params;
    const adminPrisma = getAdminPrisma(req);
    const factory     = new PaymentFactory(adminPrisma);
    const updated     = await factory.toggleStatus(code);
    const label       = updated.status === 'active' ? 'đã bật' : 'đã tắt';
    return success(res, updated, `Gateway ${code} ${label}`);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
