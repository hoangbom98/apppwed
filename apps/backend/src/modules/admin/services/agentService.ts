// @ts-nocheck
'use strict';
/**
 * AgentService — agent management for the Admin domain.
 *
 * Reads/writes game_db: Agent, Commission models.
 * BoYue equivalent: caipiao_agent_relation / caipiao_agent_commission_log / caipiao_agent_rate.
 *
 * Exposed methods:
 *   list({ skip, take, where })               — paginated agent list
 *   getDetail(agentId)                        — agent + commission history + tree stats
 *   getTeam(agentId, depth)                   — direct downline members
 *   getTree(agentId)                          — recursive tree (up to 3 levels)
 *   calculateCommission(agentId, period)       — compute commission for period, upsert record
 *   payCommission(commissionId)               — mark commission as paid
 *   getStats()                                — platform-wide agent stats
 */

const { getPrismaClient } = require('../../../config/databases');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Get game_db prisma client (lazy, singleton via factory) */
const gameDb = () => getPrismaClient('game');

// ─────────────────────────────────────────────────────────────────────────────
// List agents
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated list of agents with latest commission and user info.
 * @param {{ skip?, take?, where? }} opts
 */
async function list({ skip = 0, take = 20, where = {} } = {}) {
  const db = gameDb();
  const [data, total] = await Promise.all([
    db.agent.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, username: true, fullName: true,
            email: true, phone: true,
            balance: true, totalDeposit: true, totalBet: true,
            vipLevel: true, status: true,
          },
        },
        commissions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count:      { select: { commissions: true } },
      },
    }),
    db.agent.count({ where }),
  ]);
  return { data, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent detail
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full agent detail: profile + recent 12 commissions + team member count.
 * @param {string} agentId
 */
async function getDetail(agentId) {
  const db    = gameDb();
  const agent = await db.agent.findUnique({
    where:   { id: agentId },
    include: {
      user:        { select: { id: true, username: true, fullName: true, email: true, phone: true, balance: true, totalDeposit: true, totalBet: true, vipLevel: true, status: true, createdAt: true } },
      commissions: { orderBy: { createdAt: 'desc' }, take: 12 },
    },
  });

  if (!agent) return null;

  // Count direct members (users whose agentId = this agent's userId)
  const [directMembers, pendingCommission] = await Promise.all([
    db.user.count({ where: { agentId: agent.userId } }),
    db.commission.aggregate({
      where:   { agentId, status: 'pending' },
      _sum:    { amount: true },
    }),
  ]);

  return {
    ...agent,
    directMemberCount: directMembers,
    pendingCommission:  Number(pendingCommission._sum.amount ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent tree (up to maxDepth levels)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build recursive agent tree starting from agentId (inclusive).
 * Depth-limited to avoid runaway queries.
 *
 * @param {string} agentId
 * @param {number} [maxDepth=3]
 * @returns {Promise<object>}
 */
async function getTree(agentId, maxDepth = 3) {
  const db = gameDb();

  async function buildNode(id, depth) {
    if (depth > maxDepth) return null;

    const agent = await db.agent.findUnique({
      where:   { id },
      include: { user: { select: { id: true, username: true, vipLevel: true, totalBet: true } } },
    });
    if (!agent) return null;

    const childAgents = await db.agent.findMany({
      where:   { parentAgentId: agent.userId },
      select:  { id: true },
    });

    const directCount = await db.user.count({ where: { agentId: agent.userId } });

    const children = await Promise.all(
      childAgents.map(c => buildNode(c.id, depth + 1))
    );

    return {
      agentId:          agent.id,
      userId:           agent.userId,
      username:         agent.user?.username ?? null,
      level:            agent.level,
      commissionRate:   Number(agent.commissionRate),
      totalCommission:  Number(agent.totalCommission),
      directMemberCount: directCount,
      children:         children.filter(Boolean),
    };
  }

  return buildNode(agentId, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct team (one-level downline)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated list of direct members under this agent.
 * @param {string} agentId
 * @param {{ skip?, take? }} pagination
 */
async function getTeam(agentId, { skip = 0, take = 20 } = {}) {
  const db = gameDb();

  // Resolve the agent's userId
  const agent = await db.agent.findUnique({ where: { id: agentId }, select: { userId: true } });
  if (!agent) return { data: [], total: 0 };

  const [data, total] = await Promise.all([
    db.user.findMany({
      where:   { agentId: agent.userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select:  {
        id: true, username: true, fullName: true,
        balance: true, totalDeposit: true, totalBet: true,
        vipLevel: true, status: true, createdAt: true,
      },
    }),
    db.user.count({ where: { agentId: agent.userId } }),
  ]);

  return { data, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculate commission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate commission for an agent for the given period.
 * Uses the agent's configured commissionRate × total bet volume of direct members.
 * Upserts a Commission record — idempotent per (agentId, period).
 *
 * @param {string} agentId
 * @param {string} period  YYYY-MM (monthly) or YYYY-MM-DD (daily)
 * @returns {Promise<object>} Commission record
 */
async function calculateCommission(agentId, period) {
  const db = gameDb();

  const agent = await db.agent.findUnique({
    where:   { id: agentId },
    select:  { id: true, userId: true, commissionRate: true, status: true },
  });

  if (!agent) throw Object.assign(new Error('Agent not found'), { code: 'AGENT_NOT_FOUND' });
  if (agent.status !== 'active') throw Object.assign(new Error('Agent is suspended'), { code: 'AGENT_SUSPENDED' });

  // Sum total bet of all direct members for the period
  const isMonthly = period.length === 7; // YYYY-MM
  const [periodStart, periodEnd] = isMonthly
    ? [new Date(`${period}-01`), new Date(`${period}-01`)]
    : [new Date(period), new Date(period)];

  if (isMonthly) {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setDate(periodEnd.getDate() + 1);
  }

  // Get all transactions of type 'bet' for direct members in this period
  const betAgg = await db.transaction.aggregate({
    where: {
      user:      { agentId: agent.userId },
      type:      'bet',
      createdAt: { gte: periodStart, lt: periodEnd },
    },
    _sum: { amount: true },
  });

  const totalBet  = Number(betAgg._sum.amount ?? 0);
  const netProfit = totalBet; // Conservative: commission on gross bet (can adjust)
  const rate      = Number(agent.commissionRate);
  const amount    = +(netProfit * rate).toFixed(2);

  const commission = await db.commission.upsert({
    where:  { agentId_period: { agentId, period } },
    create: { agentId, period, totalBet, netProfit, rate, amount, status: 'pending' },
    update: { totalBet, netProfit, rate, amount },
  });

  return commission;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pay commission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a commission as paid — credits the agent's user balance.
 * @param {string} commissionId
 */
async function payCommission(commissionId) {
  const db = gameDb();

  const comm = await db.commission.findUnique({
    where:   { id: commissionId },
    include: { agent: { select: { userId: true } } },
  });

  if (!comm) throw Object.assign(new Error('Commission not found'), { code: 'RESOURCE_NOT_FOUND' });
  if (comm.status === 'paid') throw Object.assign(new Error('Commission already paid'), { code: 'RESOURCE_CONFLICT' });

  await db.$transaction(async (tx) => {
    await tx.commission.update({
      where: { id: commissionId },
      data:  { status: 'paid', settledAt: new Date() },
    });

    const updated = await tx.user.update({
      where:  { id: comm.agent.userId },
      data:   { balance: { increment: comm.amount } },
      select: { balance: true },
    });

    await tx.transaction.create({
      data: {
        userId:        comm.agent.userId,
        type:          'commission',
        amount:        comm.amount,
        balanceBefore: +updated.balance - +comm.amount,
        balanceAfter:  +updated.balance,
        referenceId:   commissionId,
        referenceType: 'commission',
        note:          `Agent commission — period ${comm.period}`,
      },
    });

    // Update agent's totalCommission counter
    await tx.agent.update({
      where: { id: comm.agentId },
      data:  { totalCommission: { increment: comm.amount } },
    });
  });

  return { paid: true, amount: Number(comm.amount) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform stats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Platform-wide agent summary for admin dashboard.
 */
async function getStats() {
  const db = gameDb();

  const [totalAgents, activeAgents, commAgg] = await Promise.all([
    db.agent.count(),
    db.agent.count({ where: { status: 'active' } }),
    db.commission.aggregate({ _sum: { amount: true }, where: { status: 'paid' } }),
  ]);

  const pendingComm = await db.commission.aggregate({
    _sum: { amount: true },
    where: { status: 'pending' },
  });

  return {
    totalAgents,
    activeAgents,
    totalCommissionPaid: Number(commAgg._sum.amount ?? 0),
    pendingCommission:   Number(pendingComm._sum.amount ?? 0),
  };
}

module.exports = { list, getDetail, getTree, getTeam, calculateCommission, payCommission, getStats };
