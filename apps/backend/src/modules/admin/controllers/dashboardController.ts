// @ts-nocheck
/* eslint-disable */

/**
 * Admin Dashboard Controller
 * GET /api/admin/dashboard         → cross-project aggregate stats
 * GET /api/admin/dashboard/chart/revenue → 7/30 day revenue chart
 */
'use strict';
const { success, error } = require('../../../shared/utils/response');
const { getPrismaClient } = require('../../../shared/config/databases');

// ── Helper: safe count ─────────────────────────────────────────────
const safeCount = async (prisma, model, where = {}) => {
  try { return await prisma[model].count({ where }); }
  catch (_) { return 0; }
};

const safeAggregate = async (prisma, model, field, where = {}) => {
  try {
    const res = await prisma[model].aggregate({ where, _sum: { [field]: true } });
    return Math.abs(Number(res._sum[field] || 0));
  } catch (_) { return 0; }
};

// ── GET /dashboard ─────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const hub    = getPrismaClient('hub');
    const game   = getPrismaClient('game');
    const dating = getPrismaClient('dating');
    const trade  = getPrismaClient('trade');
    const sports = getPrismaClient('sports');
    const admin  = req.prisma; // admin db

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── User counts (all projects) ─────────────────────────────────
    const [hubUsers, gameUsers, datingUsers, tradeUsers, sportsUsers] = await Promise.all([
      safeCount(hub,    'user'),
      safeCount(game,   'user'),
      safeCount(dating, 'user'),
      safeCount(trade,  'user'),
      safeCount(sports, 'user'),
    ]);
    const totalUsers = hubUsers + gameUsers + datingUsers + tradeUsers + sportsUsers;

    // ── New users today ────────────────────────────────────────────
    const [hubNew, gameNew, datingNew, tradeNew, sportsNew] = await Promise.all([
      safeCount(hub,    'user', { createdAt: { gte: today } }),
      safeCount(game,   'user', { createdAt: { gte: today } }),
      safeCount(dating, 'user', { createdAt: { gte: today } }),
      safeCount(trade,  'user', { createdAt: { gte: today } }),
      safeCount(sports, 'user', { createdAt: { gte: today } }),
    ]);
    const newUsersToday = hubNew + gameNew + datingNew + tradeNew + sportsNew;

    // ── Finance — game DB uses depositOrder / withdrawOrder / transaction ──
    const [pendingDeposits, pendingWithdrawals, todayDeposits] = await Promise.all([
      safeCount(game,     'depositOrder',  { status: 'pending' }),
      safeCount(game,     'withdrawOrder', { status: 'pending' }),
      safeAggregate(game, 'transaction',   'amount', { type: 'deposit', createdAt: { gte: today } }),
    ]);

    // ── Active sports bets ─────────────────────────────────────────
    const activeBets = await safeCount(sports, 'betSlip', { status: 'pending' });

    // ── Active dating livestreams ──────────────────────────────────
    const liveStreamers = await safeCount(dating, 'liveStream', { status: 'live' });

    // ── Open support tickets (admin DB) ───────────────────────────
    const openTickets = await safeCount(admin, 'supportTicket', { status: 'open' });

    // ── Recent transactions (game project) ────────────────────────
    let recentTransactions = [];
    try {
      recentTransactions = await game.transaction.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, email: true } } },
      });
    } catch { /* recentTransactions unavailable */ }

    // ── System announcements active ────────────────────────────────
    let announcementsCount = 0;
    try {
      announcementsCount = await admin.announcement.count({ where: { status: 'active' } });
    } catch { /* unavailable */ }

    return success(res, {
      users: {
        total:     totalUsers,
        newToday:  newUsersToday,
        byProject: { hub: hubUsers, game: gameUsers, dating: datingUsers, trade: tradeUsers, sports: sportsUsers },
      },
      finance: {
        todayDeposits,
        pendingDeposits,
        pendingWithdrawals,
      },
      activity: {
        activeBets,
        liveStreamers,
        openTickets,
        announcementsActive: announcementsCount,
      },
      recentTransactions,
      timestamp: new Date(),
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── GET /dashboard/chart/revenue ──────────────────────────────────
exports.getRevenueChart = async (req, res) => {
  try {
    const game = getPrismaClient('game');
    const days = Math.min(30, Math.max(7, parseInt(req.query.days || 7)));

    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 86400000);

      const [deposits, withdrawals] = await Promise.all([
        safeAggregate(game, 'transaction', 'amount', { type: 'deposit',  createdAt: { gte: dayStart, lt: dayEnd } }),
        safeAggregate(game, 'transaction', 'amount', { type: 'withdraw', createdAt: { gte: dayStart, lt: dayEnd } }),
      ]);

      chartData.push({
        date:        dayStart.toISOString().slice(0, 10),
        deposits,
        withdrawals,
        revenue:     deposits - withdrawals,
      });
    }

    return success(res, chartData);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── Backward compat: project-level stats ──────────────────────────
exports.getProjectStats = async (req, res) => {
  try {
    const project = req.params.project;
    const allowed = ['hub', 'game', 'trade', 'dating', 'sports'];
    if (!allowed.includes(project)) return error(res, 'Dự án không hợp lệ');
    const prisma = getPrismaClient(project);
    const total  = await safeCount(prisma, 'user');
    return success(res, { project, totalUsers: total });
  } catch (e) { return error(res, e.message, 500); }
};
