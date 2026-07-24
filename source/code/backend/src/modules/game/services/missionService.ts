/**
 * game/services/missionService.js
 *
 * Daily missions / tasks system.
 * MissionTemplate defines what to do (bet 3 times, deposit, login, invite).
 * UserMission tracks per-user progress for each calendar day.
 *
 * Progress hooks are called by other controllers:
 *   missionService.incrementProgress(userId, 'BET', 1, prisma)
 *   missionService.incrementProgress(userId, 'DEPOSIT', 1, prisma)
 *   missionService.incrementProgress(userId, 'LOGIN', 1, prisma)
 *   missionService.incrementProgress(userId, 'INVITE', 1, prisma)
 */

function toDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Ensure UserMission rows exist for today's active missions.
 * Idempotent — skips existing rows.
 */
async function initDailyMissions(userId, prisma) {
  const today     = toDateString();
  const templates = await prisma.missionTemplate.findMany({
    where: { isActive: true, missionType: 'daily' },
  });

  for (const tpl of templates) {
    await prisma.userMission.upsert({
      where:  { userId_templateId_date: { userId, templateId: tpl.id, date: today } },
      create: { userId, templateId: tpl.id, date: today },
      update: {}, // no-op if exists
    });
  }
}

/**
 * Get today's missions with progress for a user.
 */
async function getTodayMissions(userId, prisma) {
  await initDailyMissions(userId, prisma);
  const today = toDateString();

  const missions = await prisma.userMission.findMany({
    where:   { userId, date: today },
    include: { template: true },
    orderBy: { template: { sortOrder: 'asc' } },
  });

  return missions.map(m => ({
    id:           m.id,
    templateId:   m.templateId,
    code:         m.template.code,
    title:        m.template.title,
    description:  m.template.description,
    targetType:   m.template.targetType,
    targetValue:  m.template.targetValue,
    rewardType:   m.template.rewardType,
    rewardAmount: m.template.rewardAmount,
    progress:     m.progress,
    progressPct:  Math.min(100, Math.round((m.progress / m.template.targetValue) * 100)),
    completed:    m.completed,
    claimed:      m.claimed,
    completedAt:  m.completedAt,
    claimedAt:    m.claimedAt,
  }));
}

/**
 * Increment mission progress for a given targetType.
 * Automatically marks completed when progress >= targetValue.
 * Called by other controllers (wallet, lottery, auth) as a fire-and-forget side effect.
 *
 * @param {string} userId
 * @param {'LOGIN'|'DEPOSIT'|'BET'|'INVITE'|'LOTTERY'} targetType
 * @param {number} amount  — how much to increment (usually 1)
 * @param {PrismaClient} prisma
 */
async function incrementProgress(userId, targetType, amount, prisma) {
  try {
    const today = toDateString();
    const missions = await prisma.userMission.findMany({
      where:   { userId, date: today, completed: false },
      include: { template: true },
    });

    for (const m of missions) {
      if (m.template.targetType !== targetType) continue;
      const newProgress = m.progress + amount;
      const completed   = newProgress >= m.template.targetValue;
      await prisma.userMission.update({
        where: { id: m.id },
        data:  {
          progress:    newProgress,
          completed,
          completedAt: completed && !m.completedAt ? new Date() : m.completedAt,
        },
      });
    }
  } catch {
    // Non-blocking — mission progress failure must never break the main action
  }
}

/**
 * Claim a completed mission reward.
 * @param {string} userId
 * @param {string} templateId
 * @param {PrismaClient} prisma
 */
async function claimMission(userId, templateId, prisma) {
  const today   = toDateString();
  const mission = await prisma.userMission.findUnique({
    where:   { userId_templateId_date: { userId, templateId, date: today } },
    include: { template: true },
  });

  if (!mission)          throw new Error('Nhiệm vụ không tồn tại');
  if (!mission.completed) throw new Error('Bạn chưa hoàn thành nhiệm vụ này');
  if (mission.claimed)    throw new Error('Bạn đã nhận thưởng nhiệm vụ này rồi');

  const { rewardType, rewardAmount } = mission.template;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });

  await prisma.$transaction([
    prisma.userMission.update({
      where: { id: mission.id },
      data:  { claimed: true, claimedAt: new Date() },
    }),
    ...(rewardType === 'coin' ? [
      prisma.user.update({
        where: { id: userId },
        data:  { balance: { increment: rewardAmount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type:          'mission_reward',
          amount:        rewardAmount,
          balanceBefore: user.balance,
          balanceAfter:  Number(user.balance) + Number(rewardAmount),
          referenceType: 'user_mission',
          referenceId:   mission.id,
          note:          `Mission reward: ${mission.template.title}`,
        },
      }),
    ] : []),
  ]);

  return { rewardType, rewardAmount };
}

module.exports = { initDailyMissions, getTodayMissions, incrementProgress, claimMission };
