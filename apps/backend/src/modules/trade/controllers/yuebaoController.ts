// @ts-nocheck
'use strict';
/**
 * yuebaoController — money market / savings products (余额宝)
 *
 * User routes:  GET /trade/yuebao/products, POST /trade/yuebao/invest, GET /trade/yuebao/my
 * Admin routes: CRUD /trade/admin/yuebao/products, PUT .../settle, PUT .../renew
 */
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { paginate }                  = require('../../../shared/utils/core/helpers');
const notifSvc                      = require('../../../shared/services/notificationService');

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

// GET /trade/yuebao/products
exports.listProducts = async (req, res) => {
  try {
    const products = await req.prisma.yuebaoProduct.findMany({
      where:   { status: 'active' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return success(res, products);
  } catch (e: any) { return error(res, e.message, 500); }
};

// GET /trade/yuebao/my
exports.myInvestments = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.yuebaoInvestment.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: { product: { select: { title: true, interestRate: true, days: true } } },
      }),
      req.prisma.yuebaoInvestment.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e: any) { return error(res, e.message, 500); }
};

// POST /trade/yuebao/invest
exports.invest = async (req, res) => {
  try {
    const { productId, amount } = req.body;
    if (!productId || !amount)    return error(res, 'productId và amount là bắt buộc', 400);

    const product = await req.prisma.yuebaoProduct.findUnique({ where: { id: productId } });
    if (!product || product.status !== 'active') return error(res, 'Sản phẩm không tồn tại hoặc đã đóng', 400);

    const amt = parseFloat(amount);
    if (amt < parseFloat(product.minAmount)) return error(res, `Số tiền tối thiểu là ${product.minAmount}`, 400);
    if (parseFloat(product.maxAmount) > 0 && amt > parseFloat(product.maxAmount))
      return error(res, `Số tiền tối đa là ${product.maxAmount}`, 400);

    // Check wallet balance
    const wallet = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.frozen) : 0;
    if (available < amt) return error(res, 'Số dư không đủ', 400);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + product.days);

    const investment = await req.prisma.$transaction(async (tx: any) => {
      // Deduct balance
      await tx.wallet.update({
        where: { userId: req.user.id },
        data:  { frozen: { increment: amt } },
      });
      const inv = await tx.yuebaoInvestment.create({
        data: { userId: req.user.id, productId, amount: amt, endDate, status: 'active' },
      });
      await tx.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'yuebao_invest',
          amount:        -amt,
          balanceAfter:  available - amt,
          referenceId:   inv.id,
          referenceType: 'yuebao_investment',
          note:          `Đầu tư Yuebao: ${product.title}`,
        },
      });
      return inv;
    });

    return success(res, investment, 'Đầu tư thành công');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

exports.adminListProducts = async (req, res) => {
  try {
    const products = await req.prisma.yuebaoProduct.findMany({
      where:   { status: { not: 'deleted' } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return success(res, products);
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminCreateProduct = async (req, res) => {
  try {
    const { title, description, interestRate, days, minAmount, maxAmount = 0, stars = 0, sortOrder = 0 } = req.body;
    if (!title || !interestRate || !days || !minAmount) return error(res, 'Thiếu thông tin bắt buộc', 400);
    const product = await req.prisma.yuebaoProduct.create({
      data: { title, description, interestRate: parseFloat(interestRate), days: parseInt(days),
              minAmount: parseFloat(minAmount), maxAmount: parseFloat(maxAmount), stars, sortOrder, status: 'active' },
    });
    return success(res, product, 'Đã tạo sản phẩm Yuebao');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminUpdateProduct = async (req, res) => {
  try {
    const product = await req.prisma.yuebaoProduct.update({
      where: { id: req.params.id }, data: req.body,
    });
    return success(res, product, 'Đã cập nhật');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminDeleteProduct = async (req, res) => {
  try {
    await req.prisma.yuebaoProduct.update({ where: { id: req.params.id }, data: { status: 'deleted' } });
    return success(res, null, 'Đã xóa sản phẩm');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminListInvestments = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.yuebaoInvestment.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } }, product: { select: { title: true } } },
      }),
      req.prisma.yuebaoInvestment.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e: any) { return error(res, e.message, 500); }
};

// PUT /trade/admin/yuebao/investments/:id/settle — manual settle
exports.adminSettle = async (req, res) => {
  try {
    const inv = await req.prisma.yuebaoInvestment.findUnique({
      where: { id: req.params.id }, include: { product: true },
    });
    if (!inv) return notFound(res, 'Khoản đầu tư không tồn tại');
    if (inv.status !== 'active') return error(res, 'Khoản đầu tư không ở trạng thái active', 400);

    // Calculate final profit: simple interest = amount * rate * days / 365
    const profit = parseFloat(inv.amount) * parseFloat(inv.product.interestRate) / 100;
    const total  = parseFloat(inv.amount) + profit;

    await req.prisma.$transaction(async (tx: any) => {
      await tx.yuebaoInvestment.update({
        where: { id: inv.id },
        data:  { status: 'completed', profitPaid: profit, settledAt: new Date() },
      });
      await tx.wallet.upsert({
        where:  { userId: inv.userId },
        update: { balance: { increment: total }, frozen: { decrement: parseFloat(inv.amount) } },
        create: { userId: inv.userId, balance: total, frozen: 0 },
      });
      await tx.transaction.create({
        data: {
          userId:        inv.userId,
          type:          'yuebao_settle',
          amount:        total,
          balanceAfter:  0,
          referenceId:   inv.id,
          referenceType: 'yuebao_investment',
          note:          `Tất toán Yuebao — lãi: ${profit.toFixed(2)}`,
        },
      });
    });

    notifSvc.sendToUser(inv.userId, 'notification', {
      title:   'Yuebao đáo hạn',
      content: `Khoản đầu tư ${inv.amount} đã tất toán, nhận lãi ${profit.toFixed(2)}`,
    });
    return success(res, null, 'Đã tất toán khoản đầu tư');
  } catch (e: any) { return error(res, e.message, 500); }
};
