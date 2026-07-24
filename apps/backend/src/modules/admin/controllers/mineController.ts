// @ts-nocheck
/* eslint-disable */

// backend/src/modules/admin/controllers/mineController.js
// Mine (personal profile) endpoints — all routes require auth + adminGuard
// Operates on the ADMIN DB (req.prisma is admin-client, injected by projectResolver)
'use strict';

const { getPrismaClient } = require('../../../shared/config/databases');
const { ok, notFound, badRequest, serverError, paginate } = require('../../../shared/utils/response');

// All mine endpoints use the shared admin DB for the logged-in admin user's data.
// For cross-project balance / VIP we read from game DB as the canonical source.

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute VIP progress % and next level info from vipConfigs array + totalBet.
 */
function computeVipProgress(vipConfigs, currentLevel, totalBet) {
  const sorted = [...vipConfigs].sort((a, b) => a.level - b.level);
  const current = sorted.find(v => v.level === currentLevel);
  const next    = sorted.find(v => v.level === currentLevel + 1);

  if (!next) return { vipProgressPct: 100, vipRequired: 0, vipReward: 0, nextVipLevel: null, nextVipName: null };

  const prevRequired = current ? Number(current.betRequired) : 0;
  const nextRequired = Number(next.betRequired);
  const diff         = nextRequired - prevRequired;
  const progress     = Math.max(0, Number(totalBet) - prevRequired);
  const pct          = diff > 0 ? Math.min(100, (progress / diff) * 100) : 0;

  return {
    vipProgressPct: Math.round(pct * 10) / 10,
    vipRequired:    nextRequired,
    vipReward:      Number(next.rewardAmount),
    nextVipLevel:   next.level,
    nextVipName:    next.name,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/profile
// Returns current admin user's profile + cross-project VIP info
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');

    const admin = await adminDb.adminUser.findUnique({
      where:  { id: req.user.id },
      select: {
        id:          true,
        username:    true,
        email:       true,
        fullName:    true,
        avatar:      true,
        role:        true,
        permissions: true,
        status:      true,
        lastLogin:   true,
        twoFaEnabled:true,
        createdAt:   true,
        updatedAt:   true,
      },
    });
    if (!admin) return notFound(res, 'Admin user not found');

    // VIP configs (admin DB)
    const vipConfigs = await adminDb.vipConfig.findMany({
      where:   { status: 'active' },
      orderBy: { level: 'asc' },
    }).catch(() => []);

    // Try to fetch game-db user (same email) for balance/VIP
    let balance    = 0;
    let vipLevel   = 0;
    let totalBet   = 0;
    let totalDeposit = 0;
    let referralCode = null;

    try {
      const gameDb   = getPrismaClient('game');
      const gameUser = await gameDb.user.findFirst({ where: { email: req.user.email } });
      if (gameUser) {
        balance      = Number(gameUser.balance      || 0);
        vipLevel     = Number(gameUser.vipLevel     || 0);
        totalBet     = Number(gameUser.totalBet     || 0);
        totalDeposit = Number(gameUser.totalDeposit || 0);
        referralCode = gameUser.referralCode || null;
      }
    } catch (_) { /* game DB may not be available in all environments */ }

    const vipInfo = computeVipProgress(vipConfigs, vipLevel, totalBet);

    return ok(res, {
      ...admin,
      balance,
      vipLevel,
      totalBet,
      totalDeposit,
      referralCode,
      vipConfigs,
      ...vipInfo,
    });
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/mine/profile
// Update avatar / fullName
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, avatar } = req.body;
    const adminDb = getPrismaClient('admin');

    const updated = await adminDb.adminUser.update({
      where: { id: req.user.id },
      data:  {
        ...(fullName !== undefined && { fullName }),
        ...(avatar   !== undefined && { avatar   }),
      },
      select: { id: true, username: true, fullName: true, avatar: true, email: true },
    });

    return ok(res, updated, 'Profile updated');
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/balance
// Fetch latest balance from game DB
// ─────────────────────────────────────────────────────────────────────────────
exports.getBalance = async (req, res) => {
  try {
    let balance = 0;
    try {
      const gameDb   = getPrismaClient('game');
      const gameUser = await gameDb.user.findFirst({ where: { email: req.user.email } });
      if (gameUser) balance = Number(gameUser.balance || 0);
    // eslint-disable-next-line no-empty
    } catch (_) {}
    return ok(res, { balance });
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/vip
// Full VIP status + config list
// ─────────────────────────────────────────────────────────────────────────────
exports.getVip = async (req, res) => {
  try {
    const adminDb   = getPrismaClient('admin');
    const vipConfigs = await adminDb.vipConfig.findMany({
      where:   { status: 'active' },
      orderBy: { level: 'asc' },
    }).catch(() => []);

    let vipLevel = 0;
    let totalBet = 0;
    try {
      const gameDb   = getPrismaClient('game');
      const gameUser = await gameDb.user.findFirst({ where: { email: req.user.email } });
      if (gameUser) {
        vipLevel = Number(gameUser.vipLevel || 0);
        totalBet = Number(gameUser.totalBet || 0);
      }
    // eslint-disable-next-line no-empty
    } catch (_) {}

    const vipInfo = computeVipProgress(vipConfigs, vipLevel, totalBet);

    return ok(res, { vipLevel, totalBet, vipConfigs, ...vipInfo });
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/transactions?page=1&limit=20&type=
// Transaction history from game DB
// ─────────────────────────────────────────────────────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let items = [];
    let total = 0;

    try {
      const gameDb   = getPrismaClient('game');
      const gameUser = await gameDb.user.findFirst({
        where:  { email: req.user.email },
        select: { id: true },
      });

      if (gameUser) {
        const where = { userId: gameUser.id, ...(type ? { type } : {}) };
        [items, total] = await Promise.all([
          gameDb.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
          gameDb.transaction.count({ where }),
        ]);
      }
    // eslint-disable-next-line no-empty
    } catch (_) {}

    return paginate(res, items, { total, page: Number(page), limit: take });
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/referrals
// Referral list + total commission from game DB
// ─────────────────────────────────────────────────────────────────────────────
exports.getReferrals = async (req, res) => {
  try {
    let referrals        = [];
    let totalCommission  = 0;
    let referralCode     = null;

    try {
      const gameDb   = getPrismaClient('game');
      const gameUser = await gameDb.user.findFirst({ where: { email: req.user.email } });
      if (gameUser) {
        referralCode = gameUser.referralCode;
        referrals    = await gameDb.referral.findMany({
          where:   { referrerId: gameUser.id },
          include: { referee: { select: { username: true, email: true, createdAt: true } } },
          orderBy: { createdAt: 'desc' },
        });
        // sum bonus from referrals
        const agg = await gameDb.referral.aggregate({
          where: { referrerId: gameUser.id },
          _sum:  { bonus: true },
        });
        totalCommission = Number(agg._sum.bonus || 0);
      }
    // eslint-disable-next-line no-empty
    } catch (_) {}

    return ok(res, { referralCode, referrals, totalCommission });
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/notifications?page=1&limit=20&unread=true
// ─────────────────────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let items = [];
    let total = 0;

    try {
      const gameDb   = getPrismaClient('game');
      const gameUser = await gameDb.user.findFirst({
        where:  { email: req.user.email },
        select: { id: true },
      });

      if (gameUser) {
        const where = {
          userId: gameUser.id,
          ...(unread === 'true' ? { isRead: false } : {}),
        };
        [items, total] = await Promise.all([
          gameDb.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
          gameDb.notification.count({ where }),
        ]);
      }
    // eslint-disable-next-line no-empty
    } catch (_) {}

    // Also pull from admin DB notifications if they exist
    try {
      const adminDb = getPrismaClient('admin');
      const adminWhere = {
        userId: req.user.id,
        ...(unread === 'true' ? { isRead: false } : {}),
      };
      const [adminItems, adminTotal] = await Promise.all([
        adminDb.notification.findMany({ where: adminWhere, orderBy: { createdAt: 'desc' }, take }),
        adminDb.notification.count({ where: adminWhere }),
      ]);
      items = [...adminItems, ...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, take);
      total += adminTotal;
    // eslint-disable-next-line no-empty
    } catch (_) {}

    return paginate(res, items, { total, page: Number(page), limit: take });
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/mine/notifications/:id/read
// Mark a single notification as read
// ─────────────────────────────────────────────────────────────────────────────
exports.markNotificationRead = async (req, res) => {
  try {
    // Try game DB first, then admin DB
    let updated = false;
    try {
      const gameDb   = getPrismaClient('game');
      const gameUser = await gameDb.user.findFirst({
        where:  { email: req.user.email },
        select: { id: true },
      });
      if (gameUser) {
        const n = await gameDb.notification.updateMany({
          where: { id: req.params.id, userId: gameUser.id },
          data:  { isRead: true },
        });
        if (n.count > 0) updated = true;
      }
    // eslint-disable-next-line no-empty
    } catch (_) {}

    if (!updated) {
      const adminDb = getPrismaClient('admin');
      await adminDb.notification.updateMany({
        where: { id: req.params.id, userId: req.user.id },
        data:  { isRead: true, readAt: new Date() },
      }).catch(() => {});
    }

    return ok(res, null, 'Marked as read');
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/tickets?page=1&limit=20
// Support tickets from admin DB
// ─────────────────────────────────────────────────────────────────────────────
exports.getTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const take  = Number(limit);
    const adminDb = getPrismaClient('admin');

    const where = { userId: req.user.id };
    const [items, total] = await Promise.all([
      adminDb.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { replies: { orderBy: { createdAt: 'asc' }, take: 1 } },
      }),
      adminDb.supportTicket.count({ where }),
    ]);

    return paginate(res, items, { total, page: Number(page), limit: take });
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/mine/tickets
// Create a new support ticket
// ─────────────────────────────────────────────────────────────────────────────
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category = 'general', priority = 'medium' } = req.body;
    if (!subject) return badRequest(res, 'subject is required');

    const adminDb = getPrismaClient('admin');
    const ticket  = await adminDb.supportTicket.create({
      data: { userId: req.user.id, subject, description, category, priority, status: 'open' },
    });

    return ok(res, ticket, 'Ticket created');
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/devices
// Trusted / recent devices for this admin account
// ─────────────────────────────────────────────────────────────────────────────
exports.getDevices = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const devices = await adminDb.userDevice.findMany({
      where:   { userId: req.user.id },
      orderBy: { lastSeenAt: 'desc' },
      take:    20,
    });
    return ok(res, devices);
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /admin/mine/devices/:id
// Revoke / remove a device
// ─────────────────────────────────────────────────────────────────────────────
exports.removeDevice = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const existing = await adminDb.userDevice.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return notFound(res, 'Device not found');

    await adminDb.userDevice.delete({ where: { id: req.params.id } });
    return ok(res, null, 'Device removed');
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/mine/vip-configs
// Admin-editable VIP config table
// ─────────────────────────────────────────────────────────────────────────────
exports.getVipConfigs = async (req, res) => {
  try {
    const adminDb    = getPrismaClient('admin');
    const vipConfigs = await adminDb.vipConfig.findMany({ orderBy: { level: 'asc' } });
    return ok(res, vipConfigs);
  } catch (e) { return serverError(res, e.message); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /admin/mine/vip-configs/:id
// Update a VIP level config
// ─────────────────────────────────────────────────────────────────────────────
exports.updateVipConfig = async (req, res) => {
  try {
    const { name, betRequired, rewardAmount, color, iconUrl, benefits, status } = req.body;
    const adminDb = getPrismaClient('admin');

    const updated = await adminDb.vipConfig.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name         !== undefined && { name         }),
        ...(betRequired  !== undefined && { betRequired: Number(betRequired)  }),
        ...(rewardAmount !== undefined && { rewardAmount: Number(rewardAmount) }),
        ...(color        !== undefined && { color        }),
        ...(iconUrl      !== undefined && { iconUrl      }),
        ...(benefits     !== undefined && { benefits     }),
        ...(status       !== undefined && { status       }),
      },
    });

    return ok(res, updated, 'VIP config updated');
  } catch (e) { return serverError(res, e.message); }
};
