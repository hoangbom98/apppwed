// @ts-nocheck
'use strict';
/**
 * shopController — Points-based shop (积分商城)
 *
 * User:  GET /trade/shop, GET /trade/shop/:id, POST /trade/shop/exchange
 *        GET /trade/shop/orders
 * Admin: CRUD /trade/admin/shop/items
 */
const { success, created, error, notFound } = require('../../../shared/utils/network/response');
const { paginate }                           = require('../../../shared/utils/core/helpers');
const notifSvc                               = require('../../../shared/services/notificationService');

// ── GET /trade/shop ───────────────────────────────────────────────────────────
exports.listItems = async (req, res) => {
  try {
    const items = await req.prisma.shopItem.findMany({
      where:   { status: 'active', OR: [{ stock: { gt: 0 } }, { stock: 0 }] },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return success(res, items);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/shop/:id ───────────────────────────────────────────────────────
exports.getItem = async (req, res) => {
  try {
    const item = await req.prisma.shopItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.status !== 'active') return notFound(res, 'Sản phẩm không tồn tại');
    return success(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/shop/orders — user's exchange history ─────────────────────────
exports.myOrders = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.shopOrder.findMany({
        where: { userId: req.user.id }, skip, take, orderBy: { createdAt: 'desc' },
        include: { item: { select: { title: true, type: true, cashValue: true } } },
      }),
      req.prisma.shopOrder.count({ where: { userId: req.user.id } }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /trade/shop/exchange — redeem with points (integral) ─────────────────
exports.exchange = async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;
    if (!itemId) return error(res, 'itemId là bắt buộc', 400);
    const qty = parseInt(quantity, 10) || 1;

    const item = await req.prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item || item.status !== 'active') return notFound(res, 'Sản phẩm không tồn tại');

    // Check stock
    if (item.stock > 0 && item.stock < qty) return error(res, 'Số lượng sản phẩm không đủ', 400);

    const totalPoints = parseFloat(item.points) * qty;

    // Check user points (integral)
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (parseFloat(user.integral) < totalPoints) return error(res, 'Điểm tích lũy không đủ', 400);

    const order = await req.prisma.$transaction(async (tx) => {
      // Deduct integral
      await tx.user.update({
        where: { id: req.user.id },
        data:  { integral: { decrement: totalPoints } },
      });
      // Reduce stock if limited
      if (item.stock > 0) {
        await tx.shopItem.update({
          where: { id: itemId },
          data:  { stock: { decrement: qty } },
        });
      }
      const ord = await tx.shopOrder.create({
        data: {
          userId:   req.user.id,
          itemId,
          points:   totalPoints,
          quantity: qty,
          status:   'pending',
        },
      });
      // If cash type: credit wallet immediately
      if (item.type === 'cash' && parseFloat(item.cashValue) > 0) {
        const cashAmt = parseFloat(item.cashValue) * qty;
        const wallet  = await tx.wallet.findUnique({ where: { userId: req.user.id } });
        const newBal  = (wallet ? parseFloat(wallet.balance) : 0) + cashAmt;
        await tx.wallet.upsert({
          where:  { userId: req.user.id },
          create: { userId: req.user.id, balance: cashAmt, frozen: 0 },
          update: { balance: { increment: cashAmt } },
        });
        await tx.transaction.create({
          data: {
            userId:        req.user.id,
            type:          'bonus',
            amount:        cashAmt,
            balanceAfter:  newBal,
            referenceId:   ord.id,
            referenceType: 'shop_order',
            note:          `Đổi điểm lấy tiền mặt: ${item.title}`,
          },
        });
        await tx.shopOrder.update({ where: { id: ord.id }, data: { status: 'delivered' } });
      }
      return ord;
    });

    notifSvc.sendToUser(req.user.id, 'notification', {
      title:   'Đổi điểm thành công',
      content: `${item.title} x${qty} — đã trừ ${totalPoints} điểm`,
    });
    return created(res, order, 'Đổi điểm thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: CRUD ───────────────────────────────────────────────────────────────
exports.adminList = async (req, res) => {
  try {
    const items = await req.prisma.shopItem.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return success(res, items);
  } catch (e) { return error(res, e.message, 500); }
};

exports.adminCreate = async (req, res) => {
  try {
    const { title, description, image, points, stock = 0, type = 'physical', cashValue = 0, sortOrder = 0 } = req.body;
    if (!title || !points) return error(res, 'title và points là bắt buộc', 400);
    const item = await req.prisma.shopItem.create({
      data: { title, description, image, points: parseFloat(points), stock: parseInt(stock),
              type, cashValue: parseFloat(cashValue), sortOrder: parseInt(sortOrder), status: 'active' },
    });
    return created(res, item, 'Đã tạo sản phẩm');
  } catch (e) { return error(res, e.message, 500); }
};

exports.adminUpdate = async (req, res) => {
  try {
    const item = await req.prisma.shopItem.update({ where: { id: req.params.id }, data: req.body });
    return success(res, item, 'Đã cập nhật');
  } catch (e) { return error(res, e.message, 500); }
};

exports.adminDelete = async (req, res) => {
  try {
    await req.prisma.shopItem.update({ where: { id: req.params.id }, data: { status: 'inactive' } });
    return success(res, null, 'Đã ẩn sản phẩm');
  } catch (e) { return error(res, e.message, 500); }
};
