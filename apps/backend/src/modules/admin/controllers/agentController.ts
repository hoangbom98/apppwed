// @ts-nocheck
// backend/src/modules/admin/controllers/agentController.ts
// Agent management — reads from game DB (Agent, Commission models)
//   GET    /api/admin/agents               — list agents (paginated + search)
//   GET    /api/admin/agents/:id           — agent detail + team stats + commission history
//   GET    /api/admin/agents/:id/team      — direct downline members
//   POST   /api/admin/agents/:id/commission/calculate  — calculate commission for a period
//   POST   /api/admin/agents/:id/commission/:commId/pay — mark commission as paid
'use strict';
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, notFound, paginate } = require('../../../shared/utils/network/response');

// ── List agents ─────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);
    const { page = 1, limit = 20, search, status, level } = req.query;
    const skip    = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status) where.status = status;
    if (level)  where.level  = Number(level);
    if (search) {
      // Search by username via the related user record
      where.user = { username: { contains: search, mode: 'insensitive' } };
    }

    const [agents, total] = await Promise.all([
      db.agent.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user:        { select: { id: true, username: true, fullName: true, email: true, phone: true, balance: true, totalDeposit: true } },
          commissions: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count:      { select: { commissions: true } },
        },
      }),
      db.agent.count({ where }),
    ]);

    return paginate(res, agents, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Agent detail ─────────────────────────────────────────────────────────────
exports.getDetail = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);
    const { id }  = req.params;

    const agent = await db.agent.findUnique({
      where:   { id },
      include: {
        user:        { select: { id: true, username: true, fullName: true, email: true, phone: true, balance: true, totalDeposit: true, totalBet: true, vipLevel: true, status: true, createdAt: true } },
        commissions: { orderBy: { createdAt: 'desc' }, take: 12 },
      },
    });
    if (!agent) return notFound(res, 'Agent not found');

    // Team stats: direct downline users (users who set referredBy = agent's username)
    const agentUsername = agent.user?.username;
    const [teamCount, teamDeposit, teamBet] = await Promise.all([
      agentUsername ? db.user.count({ where: { referredBy: agentUsername } }) : 0,
      agentUsername ? db.transaction.aggregate({
        where: { user: { referredBy: agentUsername }, type: 'deposit' },
        _sum:  { amount: true },
      }).catch(() => null) : null,
      agentUsername ? db.transaction.aggregate({
        where: { user: { referredBy: agentUsername }, type: 'bet' },
        _sum:  { amount: true },
      }).catch(() => null) : null,
    ]);

    return success(res, {
      ...agent,
      teamStats: {
        memberCount:  teamCount,
        totalDeposit: Number(teamDeposit?._sum?.amount || 0),
        totalBet:     Number(teamBet?._sum?.amount     || 0),
      },
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Calculate commission for a period ────────────────────────────────────────
exports.calculateCommission = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);
    const { id }  = req.params;
    const period  = req.body.period; // e.g. '2025-06'

    if (!period) return error(res, 'period is required (e.g. 2025-06)', 400);

    const agent = await db.agent.findUnique({
      where:   { id },
      include: { user: { select: { username: true } } },
    });
    if (!agent) return notFound(res, 'Agent not found');

    // Commission already exists for this period?
    const existing = await db.commission.findUnique({
      where: { agentId_period: { agentId: id, period } },
    });
    if (existing) return error(res, `Commission for period ${period} already calculated`, 409);

    // Sum all bets from team members during the period
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1);

    const agentUsername = agent.user?.username;
    let totalBet  = 0;
    let netProfit = 0;
    if (agentUsername) {
      const betAgg = await db.gameTransaction.aggregate({
        where: {
          type:      'bet',
          createdAt: { gte: start, lt: end },
          user:      { referredBy: agentUsername },
        },
        _sum: { betAmount: true, validBetAmount: true, prizeAmount: true },
      }).catch(() => null);
      totalBet  = Number(betAgg?._sum?.validBetAmount || 0);
      netProfit = totalBet - Number(betAgg?._sum?.prizeAmount || 0);
    }

    const rate   = Number(agent.commissionRate);
    const amount = netProfit > 0 ? netProfit * rate : 0;

    const commission = await db.commission.create({
      data: { agentId: id, period, totalBet, netProfit, rate, amount, status: 'pending' },
    });

    return success(res, { commission, stats: { totalBet, netProfit, rate, amount } }, 201);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Pay commission ────────────────────────────────────────────────────────────
exports.payCommission = async (req, res) => {
  try {
    const project         = req.project || 'game';
    const db              = getPrismaClient(project);
    const { id, commId }  = req.params;

    const commission = await db.commission.findFirst({
      where:   { id: commId, agentId: id },
      include: { agent: { include: { user: { select: { id: true } } } } },
    });
    if (!commission)              return notFound(res, 'Commission record not found');
    if (commission.status !== 'pending') return error(res, `Already ${commission.status}`, 400);

    const amount    = Number(commission.amount);
    const userId    = commission.agent?.user?.id;

    await db.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commId },
        data:  { status: 'paid', settledAt: new Date() },
      });
      if (userId && amount > 0) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
        const before = Number(user?.balance || 0);
        await tx.user.update({
          where: { id: userId },
          data:  { balance: { increment: amount }, totalCommission: { increment: amount } },
        });
        await tx.transaction.create({
          data: {
            userId,
            type:          'commission',
            amount,
            balanceBefore: before,
            balanceAfter:  before + amount,
            referenceId:   commId,
            referenceType: 'commission',
            note:          `Commission paid for period ${commission.period}`,
          },
        });
      }
    });

    return success(res, { message: 'Commission paid successfully' });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /agents/stats ─────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const agentSvc = require('../services/agentService');
    const stats    = await agentSvc.getStats();
    return success(res, stats);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /agents/:id/tree ──────────────────────────────────────────────────────
exports.getTree = async (req, res) => {
  try {
    const agentSvc = require('../services/agentService');
    const tree     = await agentSvc.getTree(req.params.id);
    if (!tree) return notFound(res, 'Agent not found');
    return success(res, tree);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /agents/:id/team ──────────────────────────────────────────────────────
exports.getTeam = async (req, res) => {
  try {
    const agentSvc = require('../services/agentService');
    const { page = 1, limit = 20 } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const result = await agentSvc.getTeam(req.params.id, { skip, take: Number(limit) });
    return paginate(res, result.data, { total: result.total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};
