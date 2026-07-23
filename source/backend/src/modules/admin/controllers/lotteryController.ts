// @ts-nocheck
// backend/src/modules/admin/controllers/lotteryController.ts
// Lottery management — reads from game DB (LotteryBet, Game[type=lottery], GameSession)
//   GET  /api/admin/lottery                     — stats summary
//   GET  /api/admin/lottery/bets                — list lottery bets (paginated)
//   GET  /api/admin/lottery/bets/:id            — bet detail
//   GET  /api/admin/lottery/rounds              — game sessions with lottery type
//   PATCH /api/admin/lottery/bets/:id/refund    — refund a bet
'use strict';
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, notFound, paginate } = require('../../../shared/utils/response');
const emit = require('../../../shared/socket/projectEmitter');

// ── Summary stats ────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    const week = new Date(today);
    week.setDate(today.getDate() - 7);

    const [totalBets, todayBets, weekBets, pendingBets, totalWinAgg, totalBetAgg] = await Promise.all([
      db.lotteryBet.count().catch(() => 0),
      db.lotteryBet.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
      db.lotteryBet.count({ where: { createdAt: { gte: week  } } }).catch(() => 0),
      db.lotteryBet.count({ where: { status: 'pending' } }).catch(() => 0),
      db.lotteryBet.aggregate({ _sum: { winAmount: true } }).catch(() => null),
      db.lotteryBet.aggregate({ _sum: { betAmount: true } }).catch(() => null),
    ]);

    const totalBetAmount = Number(totalBetAgg?._sum?.betAmount || 0);
    const totalWinAmount = Number(totalWinAgg?._sum?.winAmount || 0);

    // Top 10 games by bet volume
    const topGames = await db.lotteryBet.groupBy({
      by:      ['gameCode'],
      _sum:    { betAmount: true },
      _count:  { _all: true },
      orderBy: { _sum: { betAmount: 'desc' } },
      take:    10,
    }).catch(() => []);

    return success(res, {
      stats: {
        totalBets,
        todayBets,
        weekBets,
        pendingBets,
        totalBetAmount,
        totalWinAmount,
        houseEdge: totalBetAmount > 0
          ? (((totalBetAmount - totalWinAmount) / totalBetAmount) * 100).toFixed(2) + '%'
          : '0%',
      },
      topGames: topGames.map(g => ({
        gameCode: g.gameCode,
        betAmount: Number(g._sum?.betAmount || 0),
        count: g._count?._all ?? 0,
      })),
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── List bets ────────────────────────────────────────────────────────────────
exports.listBets = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);
    const { page = 1, limit = 20, status, gameCode, userId, from, to } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status)   where.status   = status;
    if (gameCode) where.gameCode = gameCode;
    if (userId)   where.userId   = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [bets, total] = await Promise.all([
      db.lotteryBet.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      db.lotteryBet.count({ where }),
    ]);

    return paginate(res, bets, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Bet detail ────────────────────────────────────────────────────────────────
exports.getBet = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);

    const bet = await db.lotteryBet.findUnique({
      where:   { id: req.params.id },
      include: { user: { select: { id: true, username: true, fullName: true, email: true } } },
    });
    if (!bet) return notFound(res, 'Lottery bet not found');
    return success(res, bet);
  } catch (e) { return error(res, e.message, 500); }
};

// ── List lottery game sessions (rounds) ───────────────────────────────────────
exports.listRounds = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);
    const { page = 1, limit = 20, status, from, to } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { game: { type: 'lottery' } };
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [rounds, total] = await Promise.all([
      db.gameSession.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true } },
          game: { select: { id: true, name: true, code: true, type: true } },
        },
      }),
      db.gameSession.count({ where }),
    ]);

    return paginate(res, rounds, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Refund a lottery bet ──────────────────────────────────────────────────────
exports.refundBet = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);
    const { id }  = req.params;

    const bet = await db.lotteryBet.findUnique({ where: { id } });
    if (!bet) return notFound(res, 'Lottery bet not found');
    if (bet.status !== 'pending') return error(res, `Cannot refund bet with status: ${bet.status}`, 400);

    const amount = Number(bet.betAmount);
    let balanceAfter;

    await db.$transaction(async (tx) => {
      await tx.lotteryBet.update({ where: { id }, data: { status: 'refunded' } });
      const user = await tx.user.findUnique({ where: { id: bet.userId }, select: { balance: true } });
      const before = Number(user?.balance || 0);
      balanceAfter = before + amount;
      await tx.user.update({ where: { id: bet.userId }, data: { balance: { increment: amount } } });
      await tx.transaction.create({
        data: {
          userId:        bet.userId,
          type:          'refund',
          amount,
          balanceBefore: before,
          balanceAfter,
          referenceId:   id,
          referenceType: 'lottery_bet',
          note:          `Admin refunded lottery bet`,
        },
      });
    });

    emit.depositApproved(project, bet.userId, { orderId: id, amount, newBalance: balanceAfter, method: 'refund' });

    return success(res, { message: 'Bet refunded successfully' });
  } catch (e) { return error(res, e.message, 500); }
};
