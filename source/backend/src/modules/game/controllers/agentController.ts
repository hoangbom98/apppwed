/**
 * game/controllers/agentController.js
 *
 * Agent / Affiliate system:
 *   - Check agent status, register as agent
 *   - Get agent info + stats (referral count, commission total)
 *   - Get referral list (paginated)
 *   - Get agent downline tree (depth 3)
 *   - Get commissions (paginated)
 */
const { ok, forbidden, badRequest, error } = require('../../../shared/utils/response');
const { paginate }                          = require('../../../shared/utils/helpers');

// ── GET /agent/check ──────────────────────────────────────────────────────────
exports.checkAgent = async (req, res) => {
  try {
    const agent = await req.prisma.agent.findUnique({ where: { userId: req.user.id } });
    return ok(res, { isAgent: !!agent, agent });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /agent/register ──────────────────────────────────────────────────────
exports.registerAgent = async (req, res) => {
  try {
    const exists = await req.prisma.agent.findUnique({ where: { userId: req.user.id } });
    if (exists) return badRequest(res, 'Đã là đại lý');
    const agent = await req.prisma.agent.create({
      data: {
        userId:        req.user.id,
        parentAgentId: req.body.referralCode ?? null,
        level:         1,
        commissionRate: 0.03,
      },
    });
    return ok(res, agent);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /agent/info ───────────────────────────────────────────────────────────
exports.getAgentInfo = async (req, res) => {
  try {
    const agent = await req.prisma.agent.findUnique({ where: { userId: req.user.id } });
    if (!agent) {
      // Return non-agent state — frontend can prompt to register
      const user = await req.prisma.user.findUnique({
        where:  { id: req.user.id },
        select: { referralCode: true },
      });
      return ok(res, { isAgent: false, referralCode: user?.referralCode ?? null });
    }

    // Count referrals (users who used this agent's referral code)
    const [referralCount, totalReferralDeposit] = await Promise.all([
      req.prisma.referral.count({ where: { referrerId: req.user.id } }),
      req.prisma.referral.aggregate({
        where: { referrerId: req.user.id },
        _sum:  { bonus: true },
      }),
    ]);

    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { referralCode: true },
    });

    return ok(res, {
      isAgent:             true,
      agentId:             agent.id,
      level:               agent.level,
      commissionRate:      agent.commissionRate,
      totalCommission:     agent.totalCommission,
      status:              agent.status,
      referralCode:        user?.referralCode ?? null,
      referralCount,
      totalReferralBonus:  totalReferralDeposit._sum.bonus ?? 0,
      createdAt:           agent.createdAt,
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /agent/referrals ──────────────────────────────────────────────────────
exports.getReferrals = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.referral.findMany({
        where:   { referrerId: req.user.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          referee: {
            select: { id: true, username: true, createdAt: true, totalDeposit: true, status: true },
          },
        },
      }),
      req.prisma.referral.count({ where: { referrerId: req.user.id } }),
    ]);

    const items = data.map(r => ({
      id:           r.id,
      userId:       r.refereeId,
      username:     r.referee.username,
      status:       r.referee.status,
      totalDeposit: r.referee.totalDeposit,
      bonus:        r.bonus,
      joinedAt:     r.referee.createdAt,
      referralStatus: r.status,
    }));

    return res.json({ success: true, data: items, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /agent/tree — downline network (depth 3 max) ─────────────────────────
exports.getAgentTree = async (req, res) => {
  try {
    const rootAgent = await req.prisma.agent.findUnique({ where: { userId: req.user.id } });
    if (!rootAgent) return forbidden(res, 'Bạn chưa là đại lý');

    // Recursive helper — max 3 levels deep, max 50 per level to prevent abuse
    const buildTree = async (agentId, depth) => {
      if (depth > 3) return [];
      const children = await req.prisma.agent.findMany({
        where: { parentAgentId: agentId },
        take:  50,
        include: { user: { select: { id: true, username: true, totalDeposit: true, createdAt: true } } },
      });
      return Promise.all(children.map(async child => ({
        agentId:        child.id,
        userId:         child.userId,
        username:       child.user.username,
        level:          child.level,
        commissionRate: child.commissionRate,
        totalCommission: child.totalCommission,
        totalDeposit:   child.user.totalDeposit,
        joinedAt:       child.user.createdAt,
        children:       await buildTree(child.id, depth + 1),
      })));
    };

    const tree = await buildTree(rootAgent.id, 1);
    return ok(res, { agentId: rootAgent.id, tree });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /agent/downlines — flat list of direct downlines (paginated) ──────────
exports.getDownlines = async (req, res) => {
  try {
    const agent = await req.prisma.agent.findUnique({ where: { userId: req.user.id } });
    if (!agent) return forbidden(res, 'Bạn chưa là đại lý');
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.user.findMany({
        where:   { agentId: agent.id },
        skip,
        take,
        select:  { id: true, username: true, email: true, totalDeposit: true, createdAt: true },
      }),
      req.prisma.user.count({ where: { agentId: agent.id } }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /agent/commissions ─────────────────────────────────────────────────────
exports.getCommissions = async (req, res) => {
  try {
    const agent = await req.prisma.agent.findUnique({ where: { userId: req.user.id } });
    if (!agent) return forbidden(res, 'Bạn chưa là đại lý');
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.commission.findMany({
        where:   { agentId: agent.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.commission.count({ where: { agentId: agent.id } }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};
