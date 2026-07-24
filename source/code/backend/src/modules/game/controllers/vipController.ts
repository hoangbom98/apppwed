const { success, error, badRequest } = require('../../../shared/utils/response');

// ── GET /game/vip/levels — public ────────────────────────────────────────────
exports.getVipLevels = async (req, res) => {
  try {
    const levels = await req.prisma.vipLevel.findMany({
      where: { status: 'active' },
      orderBy: { level: 'asc' },
    });
    return success(res, levels);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/vip/me — protected ─────────────────────────────────────────────
exports.getMyVip = async (req, res) => {
  try {
    const [vip, user] = await Promise.all([
      req.prisma.userVip.findUnique({ where: { userId: req.user.id } }),
      req.prisma.user.findUnique({
        where:  { id: req.user.id },
        select: { vipLevel: true, balance: true, lastDailyClaimAt: true, lastMonthlyClaimAt: true },
      }),
    ]);
    return success(res, { ...vip, currentLevel: user?.vipLevel, balance: user?.balance, lastDailyClaimAt: user?.lastDailyClaimAt, lastMonthlyClaimAt: user?.lastMonthlyClaimAt });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/vip/level — alias (same as /vip/me, kept for frontend compat) ──
exports.getVipLevel = async (req, res) => {
  return exports.getMyVip(req, res);
};

// ── POST /game/vip/claim/daily ────────────────────────────────────────────────
exports.claimDailyReward = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, vipLevel: true, balance: true, lastDailyClaimAt: true },
    });

    // Enforce once-per-calendar-day (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (user.lastDailyClaimAt && new Date(user.lastDailyClaimAt) >= today) {
      return badRequest(res, 'Bạn đã nhận thưởng hàng ngày hôm nay rồi');
    }

    // Look up VIP level benefit
    const vipLevel = await req.prisma.vipLevel.findFirst({
      where: { level: user.vipLevel, status: 'active' },
    });
    const rewardAmount = vipLevel?.benefits?.dailyReward ?? 10;

    await req.prisma.$transaction([
      req.prisma.user.update({
        where: { id: user.id },
        data:  { balance: { increment: rewardAmount }, lastDailyClaimAt: new Date() },
      }),
      req.prisma.transaction.create({
        data: {
          userId:        user.id,
          type:          'vip_daily',
          amount:        rewardAmount,
          balanceBefore: user.balance,
          balanceAfter:  Number(user.balance) + Number(rewardAmount),
          referenceType: 'vip_daily',
          note:          `VIP ${user.vipLevel} daily reward`,
        },
      }),
    ]);

    return success(res, { claimed: true, rewardAmount }, 'Nhận thưởng hàng ngày thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/vip/claim/monthly ──────────────────────────────────────────────
exports.claimMonthlyReward = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, vipLevel: true, balance: true, lastMonthlyClaimAt: true },
    });

    // Enforce once-per-calendar-month (UTC)
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (user.lastMonthlyClaimAt && new Date(user.lastMonthlyClaimAt) >= startOfMonth) {
      return badRequest(res, 'Bạn đã nhận thưởng hàng tháng tháng này rồi');
    }

    const vipLevel = await req.prisma.vipLevel.findFirst({
      where: { level: user.vipLevel, status: 'active' },
    });
    const rewardAmount = vipLevel?.benefits?.monthlyReward ?? 50;

    await req.prisma.$transaction([
      req.prisma.user.update({
        where: { id: user.id },
        data:  { balance: { increment: rewardAmount }, lastMonthlyClaimAt: new Date() },
      }),
      req.prisma.transaction.create({
        data: {
          userId:        user.id,
          type:          'vip_monthly',
          amount:        rewardAmount,
          balanceBefore: user.balance,
          balanceAfter:  Number(user.balance) + Number(rewardAmount),
          referenceType: 'vip_monthly',
          note:          `VIP ${user.vipLevel} monthly reward`,
        },
      }),
    ]);

    return success(res, { claimed: true, rewardAmount }, 'Nhận thưởng hàng tháng thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/vip/cashbacks ────────────────────────────────────────────────────
exports.getCashbacks = async (req, res) => {
  try {
    const list = await req.prisma.cashbackHistory.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    });
    return success(res, list);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/vip/interests ────────────────────────────────────────────────────
exports.getInterests = async (req, res) => {
  try {
    const list = await req.prisma.interestHistory.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    });
    return success(res, list);
  } catch (e) { return error(res, e.message, 500); }
};
