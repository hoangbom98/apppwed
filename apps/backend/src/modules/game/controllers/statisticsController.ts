// @ts-nocheck
/**
 * game/controllers/statisticsController.ts
 *
 * Admin statistics endpoints — phân tích dữ liệu toàn hệ thống.
 * Learned from /var/www/ht/src/api/statistics.ts + boyue PHP backend.
 *
 * Routes (all require auth + adminGuard):
 *   GET /game/admin/statistics/overview        — tổng quan
 *   GET /game/admin/statistics/finance         — tài chính (nạp/rút/lợi nhuận)
 *   GET /game/admin/statistics/team            — đại lý / nhóm
 *   GET /game/admin/statistics/profit          — lãi thuần
 *   GET /game/admin/statistics/users           — người dùng
 *   GET /game/admin/statistics/recharge-trend  — xu hướng nạp (7/14/30 ngày)
 *   GET /game/admin/statistics/bet-trend       — xu hướng cược
 */
'use strict';

const { success, error } = require('../../../shared/utils/response');

// ─── helpers ────────────────────────────────────────────────────────────────

function dateRange(req: any): { gte: Date; lte: Date } {
  const now  = new Date();
  const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to   = req.query.to   ? new Date(req.query.to)   : now;
  to.setHours(23, 59, 59, 999);
  return { gte: from, lte: to };
}

function nDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── controllers ─────────────────────────────────────────────────────────────

/**
 * GET /game/admin/statistics/overview
 * Tổng quan: số users, deposits hôm nay, cược hôm nay, lợi nhuận tháng này.
 */
export async function getOverview(req: any, res: any) {
  try {
    const prisma = req.prisma;
    const today  = todayStart();
    const month  = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalUsers,
      newUsersToday,
      activeUsersToday,
      depositToday,
      withdrawToday,
      depositMonth,
      withdrawMonth,
      betsToday,
      betsMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.gameSession.groupBy({ by: ['userId'], where: { createdAt: { gte: today } } }).then((r: any[]) => r.length),
      prisma.depositOrder.aggregate({ _sum: { amount: true }, where: { status: 'approved', updatedAt: { gte: today } } }),
      prisma.withdrawOrder.aggregate({ _sum: { amount: true }, where: { status: 'approved', updatedAt: { gte: today } } }),
      prisma.depositOrder.aggregate({ _sum: { amount: true }, where: { status: 'approved', updatedAt: { gte: month } } }),
      prisma.withdrawOrder.aggregate({ _sum: { amount: true }, where: { status: 'approved', updatedAt: { gte: month } } }),
      prisma.gameSession.aggregate({ _sum: { betAmount: true }, where: { createdAt: { gte: today } } }),
      prisma.gameSession.aggregate({ _sum: { betAmount: true }, where: { createdAt: { gte: month } } }),
    ]);

    const depToday  = Number(depositToday._sum?.amount  || 0);
    const withToday = Number(withdrawToday._sum?.amount || 0);
    const depMonth  = Number(depositMonth._sum?.amount  || 0);
    const withMonth = Number(withdrawMonth._sum?.amount || 0);
    const betToday  = Number(betsToday._sum?.betAmount  || 0);
    const betMonth  = Number(betsMonth._sum?.betAmount  || 0);

    return success(res, {
      totalUsers,
      newUsersToday,
      activeUsersToday,
      // Finance today
      depositToday:  depToday,
      withdrawToday: withToday,
      profitToday:   depToday - withToday,
      // Finance month
      depositMonth:  depMonth,
      withdrawMonth: withMonth,
      profitMonth:   depMonth - withMonth,
      // Bets
      betAmountToday: betToday,
      betAmountMonth: betMonth,
    });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}

/**
 * GET /game/admin/statistics/finance?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Tài chính chi tiết: tổng nạp, rút, lợi nhuận, xu hướng theo ngày, top kênh.
 */
export async function getFinance(req: any, res: any) {
  try {
    const prisma = req.prisma;
    const range  = dateRange(req);

    const [deposits, withdrawals, depositsByGateway, withdrawsByGateway] = await Promise.all([
      prisma.depositOrder.findMany({
        where:   { status: 'approved', updatedAt: range },
        select:  { amount: true, gateway: true, updatedAt: true },
        orderBy: { updatedAt: 'asc' },
      }),
      prisma.withdrawOrder.findMany({
        where:   { status: 'approved', updatedAt: range },
        select:  { amount: true, updatedAt: true },
        orderBy: { updatedAt: 'asc' },
      }),
      prisma.depositOrder.groupBy({
        by:     ['gateway'],
        where:  { status: 'approved', updatedAt: range },
        _sum:   { amount: true },
        _count: { id: true },
      }),
      prisma.withdrawOrder.groupBy({
        by:     ['status'],
        where:  { updatedAt: range },
        _sum:   { amount: true },
        _count: { id: true },
      }),
    ]);

    // Build daily trend
    const trendMap: Record<string, { date: string; deposits: number; withdrawals: number; profit: number }> = {};
    for (const d of deposits) {
      const key = d.updatedAt.toISOString().slice(0, 10);
      if (!trendMap[key]) trendMap[key] = { date: key, deposits: 0, withdrawals: 0, profit: 0 };
      trendMap[key].deposits += Number(d.amount);
    }
    for (const w of withdrawals) {
      const key = w.updatedAt.toISOString().slice(0, 10);
      if (!trendMap[key]) trendMap[key] = { date: key, deposits: 0, withdrawals: 0, profit: 0 };
      trendMap[key].withdrawals += Number(w.amount);
    }
    const trendData = Object.values(trendMap)
      .map(d => ({ ...d, profit: d.deposits - d.withdrawals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalDeposit   = deposits.reduce((s, d) => s + Number(d.amount), 0);
    const totalWithdraw  = withdrawals.reduce((s, w) => s + Number(w.amount), 0);

    return success(res, {
      totalDeposit,
      totalWithdraw,
      totalProfit: totalDeposit - totalWithdraw,
      depositCount:  deposits.length,
      withdrawCount: withdrawals.length,
      trendData,
      gatewayBreakdown: depositsByGateway.map((g: any) => ({
        gateway: g.gateway || 'manual',
        amount:  Number(g._sum?.amount || 0),
        count:   g._count?.id || 0,
      })),
    });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}

/**
 * GET /game/admin/statistics/team?from=&to=&username=
 * Đại lý / nhóm: cấu trúc cây, hoa hồng, xếp hạng.
 */
export async function getTeam(req: any, res: any) {
  try {
    const prisma = req.prisma;
    const range  = dateRange(req);

    // Top agents by downline count
    const topAgents = await prisma.agent.findMany({
      take:    10,
      orderBy: { totalCommission: 'desc' },
      include: { user: { select: { username: true, vipLevel: true } } },
    }).catch(() => []);

    // Commission paid in period
    const commissionPaid = await prisma.commission.aggregate({
      _sum: { amount: true },
      where: { createdAt: range, status: 'paid' },
    }).catch(() => ({ _sum: { amount: 0 } }));

    // Referral counts
    const referralCount = await prisma.user.count({
      where: { createdAt: range, referredBy: { not: null } },
    });

    // Level distribution
    const levelDist = await prisma.user.groupBy({
      by:     ['vipLevel'],
      _count: { id: true },
    });

    return success(res, {
      commissionPaid:  Number(commissionPaid._sum?.amount || 0),
      newReferrals:    referralCount,
      topAgents: topAgents.map((a: any) => ({
        username:        a.user?.username,
        totalCommission: Number(a.totalCommission || 0),
        downlineCount:   a.downlineCount || 0,
        vipLevel:        a.user?.vipLevel || 1,
      })),
      levelDistribution: levelDist.map((l: any) => ({
        level: l.vipLevel,
        count: l._count?.id || 0,
      })),
    });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}

/**
 * GET /game/admin/statistics/profit?from=&to=
 * Lợi nhuận thuần: nạp - rút - hoa hồng - rebate.
 */
export async function getProfit(req: any, res: any) {
  try {
    const prisma = req.prisma;
    const range  = dateRange(req);

    const [deposits, withdrawals, rebatePaid, commissionPaid] = await Promise.all([
      prisma.depositOrder.aggregate({
        _sum: { amount: true },
        where: { status: 'approved', updatedAt: range },
      }),
      prisma.withdrawOrder.aggregate({
        _sum: { amount: true },
        where: { status: 'approved', updatedAt: range },
      }),
      prisma.rebateTransaction.aggregate({
        _sum: { amount: true },
        where: { createdAt: range },
      }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'paid', createdAt: range },
      }).catch(() => ({ _sum: { amount: 0 } })),
    ]);

    const dep      = Number(deposits._sum?.amount     || 0);
    const with_    = Number(withdrawals._sum?.amount  || 0);
    const rebate   = Number(rebatePaid._sum?.amount   || 0);
    const commission = Number(commissionPaid._sum?.amount || 0);
    const grossProfit = dep - with_;
    const netProfit   = grossProfit - rebate - commission;

    return success(res, {
      grossDeposit:  dep,
      grossWithdraw: with_,
      grossProfit,
      rebatePaid:    rebate,
      commissionPaid: commission,
      netProfit,
      // for chart — break down by category
      breakdown: [
        { label: 'Tổng nạp',   value: dep },
        { label: 'Tổng rút',   value: -with_ },
        { label: 'Rebate',     value: -rebate },
        { label: 'Hoa hồng',   value: -commission },
        { label: 'Lợi nhuận', value: netProfit },
      ],
    });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}

/**
 * GET /game/admin/statistics/users?from=&to=
 * Thống kê người dùng: đăng ký, hoạt động, VIP, KYC.
 */
export async function getUserStats(req: any, res: any) {
  try {
    const prisma = req.prisma;
    const range  = dateRange(req);

    const [newUsers, activeUsers, vipDist, totalUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: range } }),
      prisma.gameSession.groupBy({
        by:    ['userId'],
        where: { createdAt: range },
      }).then((r: any[]) => r.length),
      prisma.user.groupBy({ by: ['vipLevel'], _count: { id: true } }),
      prisma.user.count(),
    ]);

    // Daily new users trend
    const userTrend = await prisma.user.findMany({
      where:  { createdAt: range },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const trendMap: Record<string, number> = {};
    for (const u of userTrend) {
      const key = u.createdAt.toISOString().slice(0, 10);
      trendMap[key] = (trendMap[key] || 0) + 1;
    }
    const dailyTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

    return success(res, {
      totalUsers,
      newUsers,
      activeUsers,
      vipDistribution: vipDist.map((v: any) => ({ level: v.vipLevel, count: v._count?.id || 0 })),
      dailyTrend,
    });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}

/**
 * GET /game/admin/statistics/recharge-trend?days=7
 * Xu hướng nạp N ngày gần nhất.
 */
export async function getRechargeTrend(req: any, res: any) {
  try {
    const prisma = req.prisma;
    const days   = Math.min(Number(req.query.days) || 7, 90);
    const from   = nDaysAgo(days);

    const deposits = await prisma.depositOrder.findMany({
      where:   { status: 'approved', updatedAt: { gte: from } },
      select:  { amount: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    const map: Record<string, number> = {};
    for (const d of deposits) {
      const key = d.updatedAt.toISOString().slice(0, 10);
      map[key] = (map[key] || 0) + Number(d.amount);
    }
    const data = Object.entries(map).map(([date, total]) => ({ date, total }));

    return success(res, { days, data });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}

/**
 * GET /game/admin/statistics/bet-trend?days=7
 * Xu hướng cược N ngày gần nhất.
 */
export async function getBetTrend(req: any, res: any) {
  try {
    const prisma = req.prisma;
    const days   = Math.min(Number(req.query.days) || 7, 90);
    const from   = nDaysAgo(days);

    const sessions = await prisma.gameSession.findMany({
      where:   { createdAt: { gte: from } },
      select:  { betAmount: true, winAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const map: Record<string, { bet: number; win: number }> = {};
    for (const s of sessions) {
      const key = s.createdAt.toISOString().slice(0, 10);
      if (!map[key]) map[key] = { bet: 0, win: 0 };
      map[key].bet += Number(s.betAmount || 0);
      map[key].win += Number(s.winAmount || 0);
    }
    const data = Object.entries(map).map(([date, v]) => ({ date, bet: v.bet, win: v.win, ggr: v.bet - v.win }));

    return success(res, { days, data });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}
