'use strict';
/**
 * trade/controllers/investmentController.js
 *
 * Handles InvestmentPackage CRUD (admin) and user Investment lifecycle.
 */
const { success, created, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');
const notifSvc = require('../../../shared/services/notificationService');
const { Decimal } = require('@lkvip/utils'); // Standardized decimal handling
const Joi = require('joi');

// ── Commission rates (overridable via DB config) ──────────────────────────────
const COMMISSION_F1 = new Decimal('0.05'); // 5%
const COMMISSION_F2 = new Decimal('0.02'); // 2%

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
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null).optional(),
    minAmount: Joi.string().regex(/^\d+(\.\d{1,4})?$/).required(),
    maxAmount: Joi.string().regex(/^\d+(\.\d{1,4})?$/).required(),
    dailyProfit: Joi.string().regex(/^\d+(\.\d{1,4})?$/).required(),
    duration: Joi.number().integer().positive().required(),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().default(0)
  });
  const { error: valError } = schema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const pkg = await req.prisma.investmentPackage.create({
      data: {
        ...req.body,
        minAmount:   new Decimal(req.body.minAmount),
        maxAmount:   new Decimal(req.body.maxAmount),
        dailyProfit: new Decimal(req.body.dailyProfit),
      },
    });
    return created(res, pkg, 'Đã tạo gói đầu tư');
  } catch (e) { return error(res, e.message, 500); }
};

// PATCH /trade/admin/investment/packages/:id
exports.adminUpdatePackage = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().allow('', null).optional(),
    minAmount: Joi.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
    maxAmount: Joi.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
    dailyProfit: Joi.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
    duration: Joi.number().integer().positive().optional(),
    isActive: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().optional()
  });
  const { error: valError } = schema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const existing = await req.prisma.investmentPackage.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res);

    const data = { ...req.body };
    if (data.minAmount)   data.minAmount   = new Decimal(data.minAmount);
    if (data.maxAmount)   data.maxAmount   = new Decimal(data.maxAmount);
    if (data.dailyProfit) data.dailyProfit = new Decimal(data.dailyProfit);

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
    const where: Record<string, any> = { userId: req.user.id };
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
    return success(res, { data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// POST /trade/investment/buy
exports.buyInvestment = async (req, res) => {
  const schema = Joi.object({
    packageId: Joi.string().required(),
    amount: Joi.string().regex(/^\d+(\.\d{1,4})?$/).required()
  });
  const { error: valError } = schema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const { packageId, amount } = req.body;
    const amtDec = new Decimal(amount);

    if (amtDec.lte(0)) return error(res, 'Số tiền đầu tư phải lớn hơn 0', 400);

    const pkg = await req.prisma.investmentPackage.findFirst({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) return notFound(res, 'Gói đầu tư không tồn tại');

    const minAmt = new Decimal(pkg.minAmount);
    const maxAmt = new Decimal(pkg.maxAmount);

    if (minAmt.gt(0) && amtDec.lt(minAmt)) {
      return error(res, `Số tiền tối thiểu là ${pkg.minAmount} USD`, 400);
    }
    if (maxAmt.gt(0) && amtDec.gt(maxAmt)) {
      return error(res, `Số tiền tối đa là ${pkg.maxAmount} USD`, 400);
    }

    // Check wallet balance
    const wallet = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    const balance = new Decimal(wallet?.balance || 0);
    const frozen  = new Decimal(wallet?.frozen || 0);
    const available = balance.minus(frozen);

    if (available.lt(amtDec)) return error(res, 'Số dư khả dụng không đủ', 400);

    const startDate = new Date();
    const endDate   = new Date(startDate.getTime() + pkg.duration * 24 * 60 * 60 * 1000);

    // Atomic: deduct balance, create investment, create transaction ledger entry
    const investment = await req.prisma.$transaction(async (tx) => {
      // Deduct from wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: req.user.id },
        data:  { balance: { decrement: amtDec.toNumber() } },
      });
      // Create investment record
      const inv = await tx.investment.create({
        data: {
          userId:    req.user.id,
          packageId,
          amount:    amtDec.toNumber(),
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
          amount:        amtDec.neg().toNumber(),
          referenceId:   inv.id,
          referenceType: 'investment',
          note:          `Mua gói đầu tư: ${pkg.name}`,
          balanceAfter:  parseFloat(updatedWallet.balance),
        },
      });
      return inv;
    });

    // Pay referral commissions asynchronously (fire-and-forget with error catch)
    _payReferralCommissions(req.prisma, req.user.id, investment.id, amtDec).catch(() => {});

    notifSvc.sendToUser(req.user.id, 'notification', {
      title:   'Đầu tư thành công',
      content: `Bạn đã mua gói ${pkg.name} với số tiền ${amtDec.toString()} USD`,
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
    const where: Record<string, any> = {};
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
    return success(res, { data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// =============================================================================
// Internal: pay referral commissions
// =============================================================================

async function _payReferralCommissions(prisma, userId, investmentId, amountDec) {
  const rates = { 1: COMMISSION_F1, 2: COMMISSION_F2 };
  const referrals = await prisma.referral.findMany({ where: { referredId: userId } });
  for (const ref of referrals) {
    const rate       = rates[ref.level] ?? new Decimal(0);
    const commission = amountDec.times(rate).toDecimalPlaces(4);
    if (commission.lte(0)) continue;
    // Credit referrer wallet
    await prisma.wallet.upsert({
      where:  { userId: ref.referrerId },
      create: { userId: ref.referrerId, balance: commission.toNumber(), frozen: 0 },
      update: { balance: { increment: commission.toNumber() } },
    });
    // Log commission
    await prisma.commissionLog.create({
      data: {
        userId:     ref.referrerId,
        fromUserId: userId,
        amount:     commission.toNumber(),
        level:      ref.level,
        source:     'investment',
        sourceId:   investmentId,
        status:     'PAID',
        paidAt:     new Date(),
      },
    });
    // Ledger
    const wallet = await prisma.wallet.findUnique({ where: { userId: ref.referrerId } });
    const balanceAfter = new Decimal(wallet?.balance ?? 0);
    await prisma.transaction.create({
      data: {
        userId:        ref.referrerId,
        type:          'referral',
        amount:        commission.toNumber(),
        referenceId:   investmentId,
        referenceType: 'commission',
        note:          `Hoa hồng F${ref.level} từ đầu tư`,
        balanceAfter:  balanceAfter.toNumber(),
      },
    });
    notifSvc.sendToUser(ref.referrerId, 'notification', {
      title:   'Nhận hoa hồng',
      content: `Bạn nhận được ${commission.toString()} USD hoa hồng F${ref.level}`,
    });
  }
}
