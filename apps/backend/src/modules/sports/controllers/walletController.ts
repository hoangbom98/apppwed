// @ts-nocheck
const { success, created, error } = require('../../../shared/utils/network/response');
const { paginate }                = require('../../../shared/utils/core/helpers');
const paymentService              = require('../../../shared/services/paymentService');

exports.getWallet = async (req, res) => {
  try {
    const u = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { balance: true, frozen: true },
    });
    return success(res, { balance: Number(u?.balance || 0), frozen: Number(u?.frozen || 0), available: Number(u?.balance || 0) - Number(u?.frozen || 0) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getHistory = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.type) where.type = req.query.type;
    const [data, total] = await Promise.all([
      req.prisma.transaction.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.transaction.count({ where }),
    ]);
    return success(res, { data, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * Deposit via payment gateway (MoMo / ZaloPay / VNPay / bank transfer).
 * Defaults to bank transfer (manual) if no gateway specified.
 */
exports.createDeposit = async (req, res) => {
  try {
    const { amount, method = 'bank' } = req.body;
    if (!amount || amount <= 0) return error(res, 'Số tiền không hợp lệ');

    // Create a pending deposit order
    const order = await req.prisma.depositOrder.create({
      data: { userId: req.user.id, method, amount: parseFloat(amount), status: 'pending', currency: 'VND' },
    });

    let gatewayResult = null;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (method === 'momo') {
      gatewayResult = await paymentService.createMomoPayment(order.id, parseInt(amount), 'Nạp xu cá cược Sports');
      return created(res, { orderId: order.id, ...gatewayResult }, 'Tạo thanh toán MoMo thành công');
    }

    if (method === 'zalopay') {
      gatewayResult = await paymentService.createZaloPayOrder(order.id, parseInt(amount), 'Nạp xu cá cược Sports');
      return created(res, { orderId: order.id, ...gatewayResult }, 'Tạo thanh toán ZaloPay thành công');
    }

    if (method === 'vnpay') {
      const payUrl = paymentService.createVNPayUrl(order.id, parseInt(amount), 'Nạp xu Sports', null, ip);
      return created(res, { orderId: order.id, payUrl }, 'Tạo thanh toán VNPay thành công');
    }

    // Default: manual bank transfer — return order details
    return created(res, { orderId: order.id, amount, method, status: 'pending', note: 'Chuyển khoản ngân hàng — liên hệ hỗ trợ để xác nhận' }, 'Yêu cầu nạp đã gửi');
  } catch (e) { return error(res, e.message, 500); }
};

exports.createWithdraw = async (req, res) => {
  try {
    const { amount, bankInfo: _bankInfo } = req.body;
    if (!amount || amount <= 0) return error(res, 'Số tiền không hợp lệ');

    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { balance: true, frozen: true },
    });
    const available = Number(user?.balance || 0) - Number(user?.frozen || 0);
    if (available < parseFloat(amount)) return error(res, 'Số dư không đủ');

    await req.prisma.$transaction([
      req.prisma.user.update({ where: { id: req.user.id }, data: { frozen: { increment: parseFloat(amount) } } }),
      req.prisma.transaction.create({
        data: {
          userId: req.user.id,
          type:   'withdraw_request',
          amount: -parseFloat(amount),
          note:   'Yêu cầu rút tiền',
          balanceAfter: Number(user.balance) - parseFloat(amount),
        },
      }),
    ]);
    return created(res, null, 'Yêu cầu rút tiền đã gửi — đang chờ xử lý');
  } catch (e) { return error(res, e.message, 500); }
};
