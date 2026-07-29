'use strict';
/**
 * store/controllers/orderController.js
 * POST /store/checkout           → create order + trigger payment
 * GET  /store/orders             → my orders
 * GET  /store/orders/:id         → order detail
 */
const Joi = require('joi');
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { v4: uuidv4 } = require('uuid');

const checkoutSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({ productId: Joi.string().required(), quantity: Joi.number().integer().min(1).default(1) })
  ).min(1).required(),
  paymentMethod: Joi.string().valid('momo', 'usdt', 'bank_transfer', 'wallet').required(),
});

exports.checkout = async (req, res) => {
  const { error: valError, value } = checkoutSchema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const { items, paymentMethod } = value;
    const userId = req.user.id;

    // Fetch product prices
    const productIds = items.map(i => i.productId);
    const products   = await req.prisma.storeProduct.findMany({
      where: { id: { in: productIds }, status: 'published' },
    });
    if (products.length !== productIds.length) return error(res, 'Một số sản phẩm không tồn tại hoặc đã ngừng bán', 400);

    // Compute total
    const orderItems = items.map(i => {
      const p = products.find(p => p.id === i.productId);
      return { productId: p.id, productName: p.name, quantity: i.quantity, price: Number(p.price) };
    });
    const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

    // Create order
    const order = await req.prisma.storeOrder.create({
      data: {
        id:            uuidv4(),
        userId,
        items:         JSON.stringify(orderItems),
        total,
        currency:      'VND',
        status:        'pending',
        paymentMethod,
        createdAt:     new Date(),
        updatedAt:     new Date(),
      },
    });

    return success(res, { orderId: order.id, total, status: 'pending' }, 'Đơn hàng đã được tạo. Tiến hành thanh toán.');
  } catch (e) { return error(res, e.message, 500); }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await req.prisma.storeOrder.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    return success(res, { data: orders });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await req.prisma.storeOrder.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!order) return notFound(res);
    return success(res, order);
  } catch (e) { return error(res, e.message, 500); }
};
