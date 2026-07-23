// @ts-nocheck
/* eslint-disable */

const { success, created, error } = require('../../../shared/utils/response');
const VirtualAccountService  = require('../services/virtualAccountService');
const ConfigService          = require('../../../shared/services/configService');
const paymentService         = require('../../../shared/services/paymentService');

const ALLOWED_GATEWAYS = ['momo', 'zalopay', 'vnpay'];

// ── Validate amount helper ────────────────────────────────────────
function parseAmount(raw) {
  const n = parseFloat(raw);
  if (!raw || isNaN(n) || n <= 0) throw new Error('Số tiền không hợp lệ');
  return n;
}

exports.createDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    // Check if deposit is enabled
    const configService = new ConfigService(req.prisma);
    const enabled = await configService.get('game', 'payment', 'lkvip', 'deposit.enabled') !== false;
    if (!enabled) {
      return error(res, 'Nạp tiền tạm thời đóng', 400);
    }

    // Check user exists
    const user = await req.prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true, frozen: true },
    });
    if (!user) return error(res, 'User not found', 404);

    // Create VA
    const vaService = new VirtualAccountService(req.prisma, configService);
    const va = await vaService.createVirtualAccount(userId, amount || null, 60);

    return success(res, {
      va_number: va.vaNumber,
      bank_name: va.bankName,
      account_name: va.accountName,
      qr_code: va.qrDataUrl,
      expired_at: va.expiredAt,
      expected_amount: va.expectedAmount,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// ── MoMo deposit ──────────────────────────────────────────────────
exports.createMomoDeposit = async (req, res) => {
  try {
    const amount = parseAmount(req.body.amount);
    const order = await req.prisma.depositOrder.create({
      data: { userId: req.user.id, method: 'momo', amount, status: 'pending' },
    });
    const momoResult = await paymentService.createMomoPayment(order.id, Math.round(amount), 'Nạp tiền qua MoMo');
    return created(res, { ...momoResult, orderId: order.id }, 'Tạo thanh toán MoMo thành công');
  } catch (err) { return error(res, err.message, 500); }
};

// ── ZaloPay deposit ───────────────────────────────────────────────
exports.createZaloPayDeposit = async (req, res) => {
  try {
    const amount = parseAmount(req.body.amount);
    const order = await req.prisma.depositOrder.create({
      data: { userId: req.user.id, method: 'zalopay', amount, status: 'pending' },
    });
    const zaloResult = await paymentService.createZaloPayOrder(order.id, Math.round(amount), 'Nạp tiền qua ZaloPay');
    return created(res, { ...zaloResult, orderId: order.id }, 'Tạo thanh toán ZaloPay thành công');
  } catch (err) { return error(res, err.message, 500); }
};

// ── VNPay deposit ─────────────────────────────────────────────────
exports.createVNPayDeposit = async (req, res) => {
  try {
    const amount = parseAmount(req.body.amount);
    const order = await req.prisma.depositOrder.create({
      data: { userId: req.user.id, method: 'vnpay', amount, status: 'pending' },
    });
    const ip  = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const url = paymentService.createVNPayUrl(order.id, Math.round(amount), 'Nạp tiền qua VNPay', null, ip);
    return created(res, { payUrl: url, orderId: order.id }, 'Tạo thanh toán VNPay thành công');
  } catch (err) { return error(res, err.message, 500); }
};

exports.getDepositHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [transactions, total] = await Promise.all([
      req.prisma.lkvipTransaction.findMany({
        where:   { userId, type: 'deposit' },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.lkvipTransaction.count({ where: { userId, type: 'deposit' } }),
    ]);

    return success(res, { data: transactions, total, page, limit });
  } catch (err) {
    return error(res, err.message);
  }
};
