// @ts-nocheck
/**
 * game/controllers/savingsVaultController.ts
 *
 * Số dư Bảo — Savings / Money Market (余额宝)
 * Learned from /var/www/boyue/app/service/SavingsVaultService.php
 *
 * Routes:
 *   GET  /game/savingsVault/products  — product catalog (public)
 *   GET  /game/savingsVault/my        — user's active holdings (protected)
 *   POST /game/savingsVault/invest    — invest in a product (protected)
 *   POST /game/savingsVault/withdraw  — early withdrawal (flexible products only, protected)
 */
'use strict';

const { success, error, badRequest, notFound } = require('../../../shared/utils/network/response');
const { paginate }                             = require('../../../shared/utils/core/helpers');

// ── GET /game/savingsVault/products — public ───────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const products = await req.prisma.savingsVaultProduct.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, products);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/savingsVault/my — protected ──────────────────────────────────────────
exports.getMy = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await Promise.all([
      req.prisma.savingsVaultHolding.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { title: true, interestRate: true, days: true } } },
      }),
      req.prisma.savingsVaultHolding.count({ where }),
    ]);

    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/savingsVault/invest — protected ─────────────────────────────────────
exports.invest = async (req, res) => {
  try {
    const { productId, amount } = req.body;
    if (!productId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return badRequest(res, 'productId và amount là bắt buộc');
    }

    const product = await req.prisma.savingsVaultProduct.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) return notFound(res, 'Sản phẩm không khả dụng');

    const amt = Number(amount);
    if (amt < Number(product.minAmount)) {
      return badRequest(res, `Số tiền tối thiểu: ${product.minAmount}`);
    }
    if (product.maxAmount && amt > Number(product.maxAmount)) {
      return badRequest(res, `Số tiền tối đa: ${product.maxAmount}`);
    }

    // Check user balance
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id }, select: { balance: true } });
    if (Number(user.balance) < amt) return badRequest(res, 'Số dư không đủ');

    // Compute end date
    let endDate: Date | null = null;
    if (product.days > 0) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + product.days);
    }

    await req.prisma.$transaction([
      req.prisma.user.update({
        where: { id: req.user.id },
        data:  { balance: { decrement: amt } },
      }),
      req.prisma.savingsVaultHolding.create({
        data: {
          userId:    req.user.id,
          productId,
          amount:    amt,
          endDate,
        },
      }),
      req.prisma.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'savingsVault_invest',
          amount:        -amt,
          balanceBefore: Number(user.balance),
          balanceAfter:  Number(user.balance) - amt,
          referenceType: 'savingsVault_holding',
          note:          `Đầu tư Số dư Bảo: ${product.title}`,
        },
      }),
    ]);

    return success(res, { invested: true, amount: amt, product: product.title }, 'Đầu tư thành công!');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/savingsVault/withdraw — protected ────────────────────────────────────
exports.withdraw = async (req, res) => {
  try {
    const { holdingId } = req.body;
    if (!holdingId) return badRequest(res, 'holdingId là bắt buộc');

    const holding = await req.prisma.savingsVaultHolding.findFirst({
      where:   { id: holdingId, userId: req.user.id, status: 'active' },
      include: { product: true },
    });
    if (!holding) return notFound(res, 'Khoản đầu tư không tồn tại');

    // Flexible products (days=0) can be withdrawn anytime; fixed-term must wait
    if (holding.product.days > 0 && holding.endDate && new Date() < new Date(holding.endDate)) {
      return badRequest(res, 'Khoản đầu tư có kỳ hạn chưa đến ngày đáo hạn');
    }

    const returnAmt = Number(holding.amount) + Number(holding.profitPaid);

    const user = await req.prisma.user.findUnique({ where: { id: req.user.id }, select: { balance: true } });

    await req.prisma.$transaction([
      req.prisma.savingsVaultHolding.update({ where: { id: holdingId }, data: { status: 'completed' } }),
      req.prisma.user.update({ where: { id: req.user.id }, data: { balance: { increment: returnAmt } } }),
      req.prisma.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'savingsVault_withdraw',
          amount:        returnAmt,
          balanceBefore: Number(user.balance),
          balanceAfter:  Number(user.balance) + returnAmt,
          referenceType: 'savingsVault_holding',
          note:          `Rút Số dư Bảo: ${holding.product.title}`,
        },
      }),
    ]);

    return success(res, { withdrawn: true, amount: returnAmt }, 'Rút tiền thành công!');
  } catch (e) { return error(res, e.message, 500); }
};
