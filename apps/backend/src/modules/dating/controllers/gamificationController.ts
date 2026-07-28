'use strict';
/**
 * dating/controllers/gamificationController.js
 *
 * Dating schema does NOT have: dailyCheckin, mission, missionProgress, level, exp
 * Those are game_db models.
 *
 * Dating schema DOES have:
 *   - User.coins  (Decimal) — rewarded on check-in
 *   - Transaction (@@map "transactions") — logs coin changes
 *   - Notification (@@map "notifications") — push notifications
 *
 * Check-in data is stored as a simple Transaction with type='checkin'
 * and a date-keyed note so we can detect duplicates.
 */
const { success, error } = require('../../../shared/utils/network/response');

// ── GET /dating/gamification/daily — daily check-in status ───────────────────
exports.getDailyStatus = async (req, res) => {
  try {
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().slice(0, 10);

    // Detect today's check-in via Transaction note pattern
    const checkin = await req.prisma.transaction.findFirst({
      where: { userId: req.user.id, type: 'checkin', note: { contains: dateStr } },
    });

    // Count check-ins in past 7 days
    const weekAgo = new Date(today.getTime() - 6 * 86400000);
    const weekCheckins = await req.prisma.transaction.count({
      where: {
        userId: req.user.id,
        type:   'checkin',
        createdAt: { gte: weekAgo },
      },
    });

    return success(res, {
      checked_today: !!checkin,
      checked_days:  weekCheckins,
      last_checkin:  checkin?.createdAt || null,
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/gamification/checkin — daily check-in reward ─────────────────
exports.checkin = async (req, res) => {
  try {
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().slice(0, 10);

    // Idempotency: one check-in per day per user
    const existing = await req.prisma.transaction.findFirst({
      where: { userId: req.user.id, type: 'checkin', note: { contains: dateStr } },
    });
    if (existing) return error(res, 'Đã điểm danh hôm nay', 400);

    const reward = 10; // coins

    await req.prisma.$transaction([
      req.prisma.user.update({
        where: { id: req.user.id },
        data:  { coins: { increment: reward } },
      }),
      req.prisma.transaction.create({
        data: {
          userId: req.user.id,
          type:   'checkin',
          amount: reward,
          coins:  reward,
          status: 'success',
          note:   `Điểm danh ${dateStr}`,
        },
      }),
    ]);

    return success(res, { reward }, 'Điểm danh thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/gamification/missions — mission list (from DB) ────────────────
exports.getMissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const missions = await req.prisma.datingMission.findMany({
      where:   { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch user's progress for each mission
    const progressList = await req.prisma.userMissionProgress.findMany({
      where: { userId, missionId: { in: missions.map(m => m.id) } },
    });
    const progressMap = Object.fromEntries(progressList.map(p => [p.missionId, p]));

    const result = missions.map(m => {
      const prog = progressMap[m.id];
      return {
        ...m,
        progress:     prog?.progress    ?? 0,
        completed_at: prog?.completedAt ?? null,
        claimed_at:   prog?.claimedAt   ?? null,
        is_completed: !!prog?.completedAt,
        is_claimed:   !!prog?.claimedAt,
      };
    });

    return success(res, { missions: result });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/gamification/spin — lucky spin ───────────────────────────────
exports.spin = async (req, res) => {
  try {
    const prizes = [50, 10, 100, 0, 200, 30, 20, 0];
    const idx    = Math.floor(Math.random() * prizes.length);
    const prize  = prizes[idx];

    if (prize > 0) {
      await req.prisma.$transaction([
        req.prisma.user.update({ where: { id: req.user.id }, data: { coins: { increment: prize } } }),
        req.prisma.transaction.create({
          data: {
            userId: req.user.id,
            type:   'spin_reward',
            amount: prize,
            coins:  prize,
            status: 'success',
            note:   `Vòng quay may mắn: +${prize} xu`,
          },
        }),
      ]);
    }

    return success(res, {
      prize:      prize > 0 ? `🪙 ${prize} xu` : 'Thử lại lần sau',
      coins_won:  prize,
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/gamification/level — user level info (derived from coins) ──────
// Dating User has no level/exp fields; derive level from total coins earned.
exports.getLevel = async (req, res) => {
  try {
    const u = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { coins: true },
    });
    // Simple tier based on coins balance: each 1000 coins = 1 level
    const coins    = Number(u?.coins || 0);
    const level    = Math.floor(coins / 1000) + 1;
    const exp      = coins % 1000;
    const nextLevelExp = 1000;
    return success(res, { level, exp, next_level_exp: nextLevelExp, coins });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/gamification/achievements ─────────────────────────────────────
exports.getAchievements = async (req, res) => {
  try {
    return success(res, {
      achievements: [
        { id: 1, icon: '⭐', title: 'Ngôi sao',  description: 'Có 1000+ xu',   is_unlocked: false },
        { id: 2, icon: '💕', title: 'Tình nhân', description: 'Đạt 100 lượt like', is_unlocked: false },
        { id: 3, icon: '🔥', title: 'Hot',       description: 'Ghép đôi 50 lần',  is_unlocked: false },
      ],
    });
  } catch (e) { return error(res, e.message, 500); }
};
