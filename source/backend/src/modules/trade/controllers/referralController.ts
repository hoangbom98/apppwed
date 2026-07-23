// @ts-nocheck
'use strict';
/**
 * trade/controllers/referralController.js
 *
 * Handles referral code generation, registration with referral code,
 * commission logs, and downline management.
 */
const { success, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const crypto = require('crypto');

/** Generate a short referral code from userId */
function makeRefCode(userId) {
  return crypto.createHash('md5').update(userId).digest('hex').slice(0, 8).toUpperCase();
}

// ── GET /trade/referral/my-code — get current user referral code ───────────────
exports.getMyCode = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, referralCode: true },
    });
    if (!user) return notFound(res);
    // If user has no code yet (field might not be in schema), derive from id
    const code = user.referralCode || makeRefCode(user.id);
    return success(res, { code, link: `${process.env.TRADE_APP_URL || ''}/register?ref=${code}` });
  } catch (e) {
    // referralCode field might not exist — return derived code
    const code = makeRefCode(req.user.id);
    return success(res, { code, link: `${process.env.TRADE_APP_URL || ''}/register?ref=${code}` });
  }
};

// ── GET /trade/referral/downline — list F1/F2 referrals ───────────────────────
exports.getDownline = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const level = req.query.level ? parseInt(req.query.level) : undefined;
    const where = { referrerId: req.user.id };
    if (level) where.level = level;

    const [data, total] = await Promise.all([
      req.prisma.referral.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          referred: {
            select: { id: true, email: true, fullName: true, createdAt: true, kycStatus: true },
          },
        },
      }),
      req.prisma.referral.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/referral/commissions — commission history ──────────────────────
exports.getCommissions = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await Promise.all([
      req.prisma.commissionLog.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: { select: { email: true, fullName: true } },
        },
      }),
      req.prisma.commissionLog.count({ where }),
    ]);

    // Total earned
    const totalEarned = await req.prisma.commissionLog.aggregate({
      where:  { userId: req.user.id, status: 'paid' },
      _sum:   { amount: true },
    });
    const totalPending = await req.prisma.commissionLog.aggregate({
      where:  { userId: req.user.id, status: 'pending' },
      _sum:   { amount: true },
    });

    return res.json({
      success: true,
      data,
      meta:    { total, page, limit, pages: Math.ceil(total / take) },
      summary: {
        totalEarned:  parseFloat(totalEarned._sum.amount || 0),
        totalPending: parseFloat(totalPending._sum.amount || 0),
      },
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/referral/stats — summary stats ────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [f1, f2, totalCommission] = await Promise.all([
      req.prisma.referral.count({ where: { referrerId: req.user.id, level: 1 } }),
      req.prisma.referral.count({ where: { referrerId: req.user.id, level: 2 } }),
      req.prisma.commissionLog.aggregate({
        where: { userId: req.user.id },
        _sum:  { amount: true },
      }),
    ]);
    return success(res, {
      f1Total:          f1,
      f2Total:          f2,
      totalReferrals:   f1 + f2,
      totalCommission:  parseFloat(totalCommission._sum.amount || 0),
    });
  } catch (e) { return error(res, e.message, 500); }
};
