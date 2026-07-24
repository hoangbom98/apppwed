/**
 * game/services/checkinService.js
 *
 * Daily 7-day streak check-in system.
 * Each day in the weekly cycle has a configured reward (CheckinConfig).
 * Users can claim once per calendar day (UTC).
 * Streak resets to day 1 if a day is missed.
 */
const cacheService = require('../../../shared/services/cacheService');

/**
 * Returns the date string "YYYY-MM-DD" in UTC for a given Date (default: now).
 */
function toDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Get the 7-day reward schedule (cached 10 min).
 * @param {PrismaClient} prisma
 */
async function getConfig(prisma) {
  return cacheService.remember('game:checkin:config', 600, () =>
    prisma.checkinConfig.findMany({
      where:   { isActive: true },
      orderBy: { day: 'asc' },
    })
  );
}

/**
 * Get a user's current week check-in status.
 * Returns: { streak, todayClaimed, weekHistory, nextReward }
 * @param {string} userId
 * @param {PrismaClient} prisma
 */
async function getUserStatus(userId, prisma) {
  // Last 7 check-ins for this user
  const records = await prisma.userCheckin.findMany({
    where:   { userId },
    orderBy: { checkinDate: 'desc' },
    take:    7,
  });

  const today       = toDateString();
  const todayClaimed = records.some(r => r.checkinDate === today);

  // Compute current streak (consecutive days ending at yesterday or today)
  let streak = 0;
  if (records.length > 0) {
    const check = new Date();
    if (!todayClaimed) check.setUTCDate(check.getUTCDate() - 1); // start from yesterday if not yet claimed today
    for (let i = 0; i < records.length; i++) {
      const expected = toDateString(check);
      if (records[i].checkinDate === expected) {
        streak++;
        check.setUTCDate(check.getUTCDate() - 1);
      } else {
        break;
      }
    }
    if (todayClaimed) streak = Math.max(streak, 1);
  }

  const nextDay     = ((streak % 7) + 1); // 1–7
  const configs     = await getConfig(prisma);
  const nextReward  = configs.find(c => c.day === nextDay) ?? null;

  return {
    streak,
    todayClaimed,
    nextDay,
    nextReward,
    weekHistory: records.slice(0, 7),
  };
}

/**
 * Claim today's check-in reward.
 * Throws a descriptive error string on failure (caller wraps in try/catch).
 * @param {string} userId
 * @param {PrismaClient} prisma
 * @returns {{ rewardType, rewardAmount, streak, day }}
 */
async function claimToday(userId, prisma) {
  const today = toDateString();

  // Check already claimed today (unique constraint guard, also explicit check for clear error)
  const existing = await prisma.userCheckin.findUnique({
    where: { userId_checkinDate: { userId, checkinDate: today } },
  });
  if (existing) throw new Error('Bạn đã điểm danh hôm nay rồi');

  // Determine streak day
  const status = await getUserStatus(userId, prisma);
  const day    = status.nextDay;

  const config = await prisma.checkinConfig.findFirst({ where: { day, isActive: true } });
  const rewardType   = config?.rewardType   ?? 'coin';
  const rewardAmount = config?.rewardAmount ?? 10;

  // Atomic: create checkin record + credit balance + create transaction
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  await prisma.$transaction([
    prisma.userCheckin.create({
      data: { userId, checkinDate: today, day, rewardType, rewardAmount },
    }),
    ...(rewardType === 'coin' ? [
      prisma.user.update({
        where: { id: userId },
        data:  { balance: { increment: rewardAmount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type:          'checkin',
          amount:        rewardAmount,
          balanceBefore: user.balance,
          balanceAfter:  Number(user.balance) + Number(rewardAmount),
          referenceType: 'checkin',
          note:          `Điểm danh ngày ${day} — streak reward`,
        },
      }),
    ] : []),
  ]);

  return { rewardType, rewardAmount, streak: status.streak + 1, day };
}

module.exports = { getConfig, getUserStatus, claimToday };
