// @ts-nocheck
'use strict';
/**
 * trade/controllers/investmentController.js
 *
 * Handles InvestmentPackage CRUD (admin) and user Investment lifecycle.
 *
 * Schema models used:
 *   InvestmentPackage  (@@map "investment_packages")
 *   Investment         (@@map "investments")
 *   Wallet             (@@map "wallets")
 *   Transaction        (@@map "transactions")
 *   CommissionLog      (@@map "commission_logs")
 *   Referral           (@@map "referrals")
 */
const { success, created, error, notFound, forbidden } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const notifSvc = require('../../../shared/services/notificationService');

// ── Commission rates (overridable via DB config) ──────────────────────────────
const COMMISSION_F1 = 0.05; // 5% of invested amount for direct referrer
const COMMISSION_F2 = 0.02; // 2% of invested amount for F2 referrer

// =============================================================================
// PACKAGES — Public
// =============================================================================

// GET /trade/investment/packages
exports.listPackages = async (req, res) => {
  try {
    const packages = await req.prisma.investmentPackage.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, packages);
  } catch (e) { return error(res, e.message, 500); }
};

// GET /trade/investment/packages/:id
exports.getPackage = async (req, res) => {
  try {
    const pkg = await req.prisma.investmentPackage.findFirst({
      where: { id: req.params.id, isActive: true },
    });
    if (!pkg) return notFound(res);
    return success(res, pkg);
  } catch (e) { return error(res, e.message, 500); }
};

// =============================================================================
// PACKAGES — Admin CRUD
// =============================================================================

// GET /trade/admin/investment/packages
exports.adminListPackages = async (req, res) => {
  try {
    const packages = await req.prisma.investmentPackage.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { investments: true } } },
    });
    return success(res, packages);
  } catch (e) { return error(res, e.message, 500); }
};

// GET /trade/admin/investment/packages/:id
exports.adminGetPackage = async (req, res) => {
  try {
    const pkg = await req.prisma.investmentPackage.findUnique({ where: { id: req.params.id } });
    if (!pkg) return notFound(res);
    return success(res, pkg);
  } catch (e) { return error(res, e.message, 500); }
};

// POST /trade/admin/investment/packages
exports.adminCreatePackage = async (req, res) => {
  try {
    const { name, description, minAmount = 0, maxAmount = 0, dailyProfit, duration, isActive = true, sortOrder = 0 } = req.body;
    if (!name || dailyProfit == null || !duration) {
      return error(res, 'name, dailyProfit, duration là bắt buộc', 400);
    }
    const pkg = await req.prisma.investmentPackage.create({
      data: {
        name,
        description: description || null,
        minAmount:   parseFloat(minAmount),
        maxAmount:   parseFloat(maxAmount),
        dailyProfit: parseFloat(dailyProfit),
        duration:    parseInt(duration, 10),
        isActive:    Boolean(isActive),
        sortOrder:   parseInt(sortOrder, 10),
      },
    });
    return created(res, pkg, 'Đã tạo gói đầu tư');
  } catch (e) { return error(res, e.message, 500); }
};

// PATCH /trade/admin/investment/packages/:id
exports.adminUpdatePackage = async (req, res) => {
  try {
    const existing = await req.prisma.investmentPackage.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res);

    const { name, description, minAmount, maxAmount, dailyProfit, duration, isActive, sortOrder } = req.body;
    const data = {};
    if (name        != null) data.name        = name;
    if (description != null) data.description = description;
    if (minAmount   != null) data.minAmount   = parseFloat(minAmount);
    if (maxAmount   != null) data.maxAmount   = parseFloat(maxAmount);
    if (dailyProfit != null) data.dailyProfit = parseFloat(dailyProfit);
    if (duration    != null) data.duration    = parseInt(duration, 10);
    if (isActive    != null) data.isActive    = Boolean(isActive);
    if (sortOrder   != null) data.sortOrder   = parseInt(sortOrder, 10);

    const pkg = await req.prisma.investmentPackage.update({ where: { id: req.params.id }, data });
    return success(res, pkg, 'Đã cập nhật gói đầu tư');
  } catch (e) { return error(res, e.message, 500); }
};

// DELETE /trade/admin/investment/packages/:id  (soft-disable only)
exports.adminDeletePackage = async (req, res) => {
  try {
    const existing = await req.prisma.investmentPackage.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res);
    await req.prisma.investmentPackage.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Đã vô hiệu hóa gói đầu tư');
  } catch (e) { return error(res, e.message, 500); }
};

// =============================================================================
// INVESTMENTS — User
// =============================================================================

// GET /trade/investment/my
exports.myInvestments = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.investment.findMany({
        where,
        skip, take,
        orderBy: { createdAt: 'desc' },
        include: { package: { select: { name: true, dailyProfit: true, duration: true } } },
      }),
      req.prisma.investment.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// POST /trade/investment/buy
exports.buyInvestment = async (req, res) => {
  try {
    const { packageId, amount } = req.body;
    if (!packageId || !amount || parseFloat(amount) <= 0) {
      return error(res, 'packageId và amount là bắt buộc', 400);
    }

    const pkg = await req.prisma.investmentPackage.findFirst({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) return notFound(res, 'Gói đầu tư không tồn tại');

    const amtNum = parseFloat(amount);
    if (parseFloat(pkg.minAmount) > 0 && amtNum < parseFloat(pkg.minAmount)) {
      return error(res, `Số tiền tối thiểu là ${pkg.minAmount} USD`, 400);
    }
    if (parseFloat(pkg.maxAmount) > 0 && amtNum > parseFloat(pkg.maxAmount)) {
      return error(res, `Số tiền tối đa là ${pkg.maxAmount} USD`, 400);
    }

    // Check wallet balance
    const wallet = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.frozen) : 0;
    if (available < amtNum) return error(res, 'Số dư khả dụng không đủ', 400);

    const startDate = new Date();
    const endDate   = new Date(startDate.getTime() + pkg.duration * 24 * 60 * 60 * 1000);

    // Atomic: deduct balance, create investment, create transaction ledger entry
    const investment = await req.prisma.$transaction(async (tx) => {
      // Deduct from wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: req.user.id },
        data:  { balance: { decrement: amtNum } },
      });
      // Create investment record
      const inv = await tx.investment.create({
        data: {
          userId:    req.user.id,
          packageId,
          amount:    amtNum,
          startDate,
          endDate,
          status:    'ACTIVE',
        },
      });
      // Ledger entry
      await tx.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'trade_open',
          amount:        -amtNum,
          referenceId:   inv.id,
          referenceType: 'investment',
          note:          `Mua gói đầu tư: ${pkg.name}`,
          balanceAfter:  parseFloat(updatedWallet.balance),
        },
      });
      return inv;
    });

    // Pay referral commissions asynchronously (fire-and-forget with error catch)
    _payReferralCommissions(req.prisma, req.user.id, investment.id, amtNum).catch(() => {});

    notifSvc.sendToUser(req.user.id, 'notification', {
      title:   'Đầu tư thành công',
      content: `Bạn đã mua gói ${pkg.name} với số tiền ${amtNum} USD`,
    });

    return created(res, investment, 'Đầu tư thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// =============================================================================
// INVESTMENTS — Admin list
// =============================================================================

// GET /trade/admin/investments
exports.adminListInvestments = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.userId) where.userId = req.query.userId;

    const [data, total] = await Promise.all([
      req.prisma.investment.findMany({
        where,
        skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          package: { select: { name: true, dailyProfit: true } },
          user:    { select: { email: true, fullName: true } },
        },
      }),
      req.prisma.investment.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// =============================================================================
// Internal: pay referral commissions
// =============================================================================

async function _payReferralCommissions(prisma, userId, investmentId, amount) {
  const rates = { 1: COMMISSION_F1, 2: COMMISSION_F2 };
  const referrals = await prisma.referral.findMany({ where: { referredId: userId } });
  for (const ref of referrals) {
    const rate       = rates[ref.level] ?? 0;
    const commission = parseFloat((amount * rate).toFixed(2));
    if (commission <= 0) continue;
    // Credit referrer wallet
    await prisma.wallet.upsert({
      where:  { userId: ref.referrerId },
      create: { userId: ref.referrerId, balance: commission, frozen: 0 },
      update: { balance: { increment: commission } },
    });
    // Log commission
    await prisma.commissionLog.create({
      data: {
        userId:     ref.referrerId,
        fromUserId: userId,
        amount:     commission,
        level:      ref.level,
        source:     'investment',
        sourceId:   investmentId,
        status:     'PAID',
        paidAt:     new Date(),
      },
    });
    // Ledger
    const wallet = await prisma.wallet.findUnique({ where: { userId: ref.referrerId } });
    await prisma.transaction.create({
      data: {
        userId:        ref.referrerId,
        type:          'referral',
        amount:        commission,
        referenceId:   investmentId,
        referenceType: 'commission',
        note:          `Hoa hồng F${ref.level} từ đầu tư`,
        balanceAfter:  parseFloat(wallet?.balance ?? commission),
      },
    });
    notifSvc.sendToUser(ref.referrerId, 'notification', {
      title:   'Nhận hoa hồng',
      content: `Bạn nhận được ${commission} USD hoa hồng F${ref.level}`,
    });
  }
}
