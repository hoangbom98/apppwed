// @ts-nocheck
/**
 * game/controllers/rebateController.ts
 *
 * Hoàn trả hàng ngày (Rebate / Fanshui)
 * Learned from /var/www/boyue/app/service/RebateService.php
 *
 * Routes:
 *   GET  /game/rebate/status   — user's claimable rebate for today
 *   POST /game/rebate/claim    — claim today's pending rebates
 *   GET  /game/rebate/history  — paginated rebate history
 *   GET  /game/rebate/rates    — rebate rates by VIP level (public)
 */
'use strict';

const { success, error, badRequest } = require('../../../shared/utils/network/response');
const { paginate }                   = require('../../../shared/utils/core/helpers');

// Rebate rates per VIP level per game type (learned from caipiao_membergroup.fs_*)
// Format: { [vipLevel]: { live, slot, lottery, sports } }
const REBATE_RATES: Record<number, Record<string, number>> = {
  1: { live: 0.004, slot: 0.004, lottery: 0.002, sports: 0.003 },
  2: { live: 0.005, slot: 0.005, lottery: 0.003, sports: 0.004 },
  3: { live: 0.006, slot: 0.006, lottery: 0.004, sports: 0.005 },
  4: { live: 0.007, slot: 0.007, lottery: 0.005, sports: 0.006 },
  5: { live: 0.009, slot: 0.008, lottery: 0.007, sports: 0.008 },
  6: { live: 0.010, slot: 0.009, lottery: 0.008, sports: 0.009 },
  7: { live: 0.011, slot: 0.010, lottery: 0.009, sports: 0.010 },
  8: { live: 0.012, slot: 0.011, lottery: 0.010, sports: 0.011 },
};

function getRateForLevel(vipLevel: number, gameType: string): number {
  const tier = REBATE_RATES[vipLevel] ?? REBATE_RATES[1];
  return tier[gameType] ?? tier.slot ?? 0.004;
}

// ── GET /game/rebate/rates — public ──────────────────────────────────────────
exports.getRates = (_req, res) => {
  try {
    const rows = Object.entries(REBATE_RATES).map(([level, rates]) => ({
      vip:     `VIP ${level}`,
      level:   Number(level),
      sports:  `${(rates.sports * 100).toFixed(1)}%`,
      casino:  `${(rates.live   * 100).toFixed(1)}%`,
      lottery: `${(rates.lottery* 100).toFixed(1)}%`,
      slot:    `${(rates.slot   * 100).toFixed(1)}%`,
    }));
    return success(res, rows);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/rebate/status — protected ──────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const userId   = req.user.id;
    const user     = await req.prisma.user.findUnique({ where: { id: userId }, select: { vipLevel: true } });
    const vipLevel = user?.vipLevel ?? 1;

    // Sum all claimable rebates
    const claimable = await req.prisma.rebate.aggregate({
      where:  { userId, status: 'claimable' },
      _sum:   { amount: true, validBet: true },
      _count: { id: true },
    });

    // Yesterday's bet stats (for display)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const betDate  = yesterday.toISOString().slice(0, 10);
    const betStats = await req.prisma.betStats.aggregate({
      where: { userId, date: betDate },
      _sum:  { validBet: true },
    });

    const available = Number(claimable._sum.amount ?? 0);
    const canClaim  = available > 0;
    const rate      = `${(getRateForLevel(vipLevel, 'slot') * 100).toFixed(2)}%`;

    return success(res, {
      available,
      canClaim,
      betAmount: Number(betStats._sum.validBet ?? 0),
      rate,
      vipLevel,
      pendingCount: claimable._count.id,
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/rebate/claim — protected ──────────────────────────────────────
exports.claim = async (req, res) => {
  try {
    const userId = req.user.id;

    const pending = await req.prisma.rebate.findMany({ where: { userId, status: 'claimable' } });
    if (pending.length === 0) return badRequest(res, 'Không có hoàn trả để nhận');

    const total = pending.reduce((s, r) => s + Number(r.amount), 0);

    // Fetch current balance for accurate transaction log
    const user = await req.prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true },
    });
    const balanceBefore = Number(user?.balance ?? 0);
    const balanceAfter  = balanceBefore + total;

    await req.prisma.$transaction([
      req.prisma.rebate.updateMany({
        where: { id: { in: pending.map((r: any) => r.id) } },
        data:  { status: 'claimed', claimedAt: new Date() },
      }),
      req.prisma.user.update({
        where: { id: userId },
        data:  { balance: { increment: total } },
      }),
      req.prisma.transaction.create({
        data: {
          userId,
          type:          'rebate',
          amount:        total,
          balanceBefore,
          balanceAfter,
          referenceType: 'rebate',
          note:          `Nhận hoàn trả ${pending.length} kỳ`,
        },
      }),
    ]);

    return success(res, { claimed: true, amount: total, count: pending.length });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/rebate/history — protected ─────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await Promise.all([
      req.prisma.rebate.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.rebate.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};
