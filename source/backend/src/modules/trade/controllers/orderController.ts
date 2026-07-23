// @ts-nocheck
'use strict';
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.getOrders = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    if (req.query.side)   where.side   = req.query.side;
    const [data, total] = await Promise.all([
      req.prisma.order.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { symbol: { select: { code: true, name: true, baseAsset: true, quoteAsset: true } } },
      }),
      req.prisma.order.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await req.prisma.order.findFirst({
      where:   { id: req.params.id, userId: req.user.id },
      include: { symbol: true },
    });
    if (!order) return notFound(res);
    return success(res, order);
  } catch (e) { return error(res, e.message, 500); }
};

exports.createOrder = async (req, res) => {
  try {
    const { symbolId, type, side, price, quantity, leverage = 1, stopPrice } = req.body;
    if (!symbolId || !type || !side || !price || !quantity) {
      return error(res, 'Thiếu thông tin: symbolId, type, side, price, quantity');
    }
    if (parseFloat(quantity) <= 0 || parseFloat(price) <= 0) {
      return error(res, 'Số lượng và giá phải lớn hơn 0');
    }

    const symbol = await req.prisma.symbol.findUnique({ where: { id: symbolId } });
    if (!symbol || symbol.status !== 'active') return error(res, 'Symbol không khả dụng', 400);

    const wallet = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) return error(res, 'Chưa có ví giao dịch', 400);

    // For buy — freeze margin = (price * qty) / leverage
    let frozenAmount = 0;
    if (side === 'buy') {
      const totalCost = (parseFloat(price) * parseFloat(quantity)) / parseFloat(leverage);
      const available = parseFloat(wallet.balance) - parseFloat(wallet.frozen);
      if (available < totalCost) return error(res, 'Số dư khả dụng không đủ', 400);
      frozenAmount = totalCost;
      await req.prisma.wallet.update({
        where: { id: wallet.id },
        data:  { frozen: { increment: frozenAmount } },
      });
    }

    const order = await req.prisma.order.create({
      data: {
        userId:   req.user.id,
        symbolId,
        type,
        side,
        price:    parseFloat(price),
        quantity: parseFloat(quantity),
        leverage: parseInt(leverage, 10),
        ...(stopPrice && { stopPrice: parseFloat(stopPrice) }),
        status: 'pending',
      },
    });
    return created(res, order, 'Đặt lệnh thành công');
  } catch (e) { return error(res, e.message, 500); }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await req.prisma.order.findFirst({
      where:   { id: req.params.id, userId: req.user.id },
      include: { symbol: true },
    });
    if (!order) return notFound(res);
    if (!['pending', 'partial'].includes(order.status)) {
      return error(res, 'Không thể hủy lệnh đã xử lý xong', 400);
    }

    // Unfreeze margin for buy orders
    if (order.side === 'buy') {
      const remaining = parseFloat(order.quantity) - parseFloat(order.executedQty);
      if (remaining > 0) {
        const refund = (remaining * parseFloat(order.price)) / (order.leverage || 1);
        await req.prisma.wallet.update({
          where: { userId: req.user.id },
          data:  { frozen: { decrement: refund } },
        });
      }
    }

    await req.prisma.order.update({ where: { id: order.id }, data: { status: 'cancelled' } });
    return success(res, null, 'Đã hủy lệnh');
  } catch (e) { return error(res, e.message, 500); }
};
