// @ts-nocheck
'use strict';
/**
 * trade/controllers/investmentController.js
 *
 * Handles investment package browsing, buying, and history.
 * Uses InvestmentPackage + Investment + Wallet + Transaction models.
 */
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const notifSvc = require('../../../shared/services/notificationService');

// ── GET /trade/investment/packages — list active packages ─────────────────────
exports.getPackages = async (req, res) => {
  try {
    const packages = await req.prisma.investmentPackage.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, packages);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/investment/packages/:id — single package ──────────────────────
exports.getPackageById = async (req, res) => {
  try {
    const pkg = await req.prisma.investmentPackage.findUnique({ where: { id: req.params.id } });
    if (!pkg || !pkg.isActive) return notFound(res, 'Gói đầu tư không tồn tại');
    return success(res, pkg);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /trade/investment/buy — buy an investment package ────────────────────
exports.buyPackage = async (req, res) => {
  try {
    const { packageId, amount } = req.body;
    if (!packageId || !amount || parseFloat(amount) <= 0) {
      return error(res, 'packageId và amount là bắt buộc', 400);
    }

    const pkg = await req.prisma.investmentPackage.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) return notFound(res, 'Gói đầu tư không tồn tại');

    const amtNum = parseFloat(amount);
    if (amtNum < parseFloat(pkg.minAmount)) {
      return error(res, `Số tiền tối thiểu là ${pkg.minAmount}`, 400);
    }
    if (amtNum > parseFloat(pkg.maxAmount)) {
      return error(res, `Số tiền tối đa là ${pkg.maxAmount}`, 400);
    }

    // Check wallet balance
    const wallet = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.frozen) : 0;
    if (available < amtNum) return error(res, 'Số dư khả dụng không đủ', 400);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pkg.duration);

    const investment = await req.prisma.$transaction(async (tx) => {
      // Deduct from wallet
      const wallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
      const newBal = parseFloat(wallet.balance) - amtNum;
      await tx.wallet.update({
        where: { userId: req.user.id },
        data:  { balance: { decrement: amtNum } },
      });
      // Create transaction log
      await tx.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'invest',
          amount:        -amtNum,
          balanceAfter:  newBal,
          referenceType: 'investment',
          note:          `Mua gói đầu tư: ${pkg.name}`,
        },
      });
      // Create investment record
      return tx.investmentPackage.findUnique({ where: { id: packageId } })
        .then(() => tx.investment.create({
          data: {
            userId:    req.user.id,
            packageId,
            amount:    amtNum,
            endDate,
            status:    'active',
          },
          include: { package: true },
        }));
    });

    notifSvc.sendToUser(req.user.id, 'notification', {
      title:   'Đầu tư thành công',
      content: `Bạn đã đầu tư ${amtNum} USD vào gói ${pkg.name}. Lợi nhuận hàng ngày: ${pkg.dailyProfit}%`,
    });
    return created(res, investment, 'Đầu tư thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/investment/history — user investment history ───────────────────
exports.getHistory = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.investment.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { package: true },
      }),
      req.prisma.investment.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: list all investments ───────────────────────────────────────────────
exports.adminList = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.investment.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { package: true, user: { select: { email: true, fullName: true } } },
      }),
      req.prisma.investment.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};
