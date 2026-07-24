// @ts-nocheck
'use strict';
/**
 * trade/controllers/referralController.js
 *
 * Referral tree and commission history endpoints.
 *
 * Schema models:
 *   Referral      (@@map "referrals")
 *   CommissionLog (@@map "commission_logs")
 */
const { success, error } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const crypto = require('crypto');

// ── GET /trade/referral/code — get current user's referral code ───────────────
exports.getMyCode = async (req, res) => {
  try {
    // Referral code is derived from userId (deterministic, no extra column needed)
    const code = crypto.createHash('md5').update(req.user.id).digest('hex').slice(0, 8).toUpperCase();
    const referralUrl = `${process.env.TRADE_FRONTEND_URL ?? ''}/register?ref=${code}`;
    return success(res, { code, referralUrl });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/referral/tree — F1 and F2 downlines ────────────────────────────
exports.getReferralTree = async (req, res) => {
  try {
    const referrals = await req.prisma.referral.findMany({
      where: { referrerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with basic user info via raw query-style approach
    // (cross-DB joins not allowed, so we batch-fetch from same trade DB)
    const userIds = [...new Set(referrals.map(r => r.referredId))];
    const users   = userIds.length
      ? await req.prisma.user.findMany({
          where:  { id: { in: userIds } },
          select: { id: true, email: true, fullName: true, createdAt: true, kycStatus: true },
        })
      : [];

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const f1 = referrals.filter(r => r.level === 1).map(r => ({ ...r, user: userMap[r.referredId] ?? null }));
    const f2 = referrals.filter(r => r.level === 2).map(r => ({ ...r, user: userMap[r.referredId] ?? null }));

    return success(res, { f1, f2, totalF1: f1.length, totalF2: f2.length });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/referral/commissions — commission history ──────────────────────
exports.getCommissions = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.commissionLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.commissionLog.count({ where }),
    ]);

    const totalEarned = data.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    return res.json({
      success: true,
      data,
      meta: { total, page, limit, pages: Math.ceil(total / take) },
      summary: { totalEarned: parseFloat(totalEarned.toFixed(2)) },
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/referral/summary — quick stats ─────────────────────────────────
exports.getSummary = async (req, res) => {
  try {
    const [f1Count, f2Count, totalCommission] = await Promise.all([
      req.prisma.referral.count({ where: { referrerId: req.user.id, level: 1 } }),
      req.prisma.referral.count({ where: { referrerId: req.user.id, level: 2 } }),
      req.prisma.commissionLog.aggregate({
        where: { userId: req.user.id, status: 'PAID' },
        _sum:  { amount: true },
      }),
    ]);
    return success(res, {
      f1Count,
      f2Count,
      totalCommission: parseFloat(totalCommission._sum.amount ?? 0),
    });
  } catch (e) { return error(res, e.message, 500); }
};
