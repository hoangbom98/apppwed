/**
 * game/services/spinService.js
 *
 * Lucky Wheel / Spin-to-win system.
 * Uses weighted random selection based on WheelPrize.probability.
 * Free spin quota resets daily at the configured resetHour (UTC).
 */
const cacheService = require('../../../shared/services/cacheService');

function toDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Get active wheel config + prizes (cached 5 min).
 * @param {PrismaClient} prisma
 */
async function getWheelConfig(prisma) {
  return cacheService.remember('game:wheel:config', 300, async () => {
    const wheel = await prisma.luckyWheelConfig.findFirst({
      where:   { isActive: true },
      include: { prizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    return wheel;
  });
}

/**
 * Get user's spin status for today.
 * Returns { freeSpinsUsed, freeSpinsRemaining, maxFreeSpins }
 */
async function getUserSpinStatus(userId, prisma) {
  const wheel = await getWheelConfig(prisma);
  if (!wheel) return { freeSpinsUsed: 0, freeSpinsRemaining: 0, maxFreeSpins: 0 };

  const today = toDateString();
  const freeSpinsUsed = await prisma.spinHistory.count({
    where: { userId, wheelId: wheel.id, isFree: true, createdAt: { gte: new Date(today) } },
  });

  return {
    freeSpinsUsed,
    freeSpinsRemaining: Math.max(0, wheel.maxFreeSpinsPerDay - freeSpinsUsed),
    maxFreeSpins:       wheel.maxFreeSpinsPerDay,
  };
}

/**
 * Weighted random prize selection.
 * Expects prizes[] with probability fields summing to ~1.0.
 * @param {Array} prizes
 * @returns {Object} selected prize
 */
function weightedRandom(prizes) {
  const rand = Math.random();
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += Number(prize.probability);
    if (rand <= cumulative) return prize;
  }
  // Fallback: last prize (handles floating point drift)
  return prizes[prizes.length - 1];
}

/**
 * Execute a spin.
 * @param {string} userId
 * @param {boolean} isFree  — use free spin quota or deduct spinCost
 * @param {PrismaClient} prisma
 * @returns {{ prize, rewardType, rewardValue }}
 */
async function spin(userId, isFree, prisma) {
  const wheel = await getWheelConfig(prisma);
  if (!wheel) throw new Error('Vòng quay chưa được cấu hình');

  const activePrizes = wheel.prizes.filter(p => p.isActive);
  if (!activePrizes.length) throw new Error('Vòng quay không có phần thưởng');

  // Validate free spin quota
  if (isFree) {
    const status = await getUserSpinStatus(userId, prisma);
    if (status.freeSpinsRemaining <= 0) {
      throw new Error('Hết lượt quay miễn phí hôm nay');
    }
  } else {
    // Paid spin — check balance
    if (Number(wheel.spinCost) > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (Number(user.balance) < Number(wheel.spinCost)) {
        throw new Error('Số dư không đủ để quay');
      }
    }
  }

  const selectedPrize = weightedRandom(activePrizes);
  const { rewardType, rewardValue } = selectedPrize;

  // Fetch user balance for transaction ledger
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });

  const ops = [
    prisma.spinHistory.create({
      data: {
        userId,
        wheelId:     wheel.id,
        prizeId:     selectedPrize.id,
        rewardType,
        rewardValue,
        isFree,
      },
    }),
  ];

  // Deduct spinCost for paid spin
  if (!isFree && Number(wheel.spinCost) > 0) {
    ops.push(
      prisma.user.update({
        where: { id: userId },
        data:  { balance: { decrement: wheel.spinCost } },
      })
    );
  }

  // Apply reward
  if (rewardType === 'COIN' && Number(rewardValue) > 0) {
    ops.push(
      prisma.user.update({
        where: { id: userId },
        data:  { balance: { increment: rewardValue } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type:          'wheel_reward',
          amount:        rewardValue,
          balanceBefore: user.balance,
          balanceAfter:  Number(user.balance) + Number(rewardValue),
          referenceType: 'spin_history',
          note:          `Lucky Wheel — ${selectedPrize.label}`,
        },
      })
    );
  }

  await prisma.$transaction(ops);

  // Invalidate wheel config cache so updated spin counts reflect
  await cacheService.del('game:wheel:config');

  return {
    prize:       { id: selectedPrize.id, label: selectedPrize.label, color: selectedPrize.color, icon: selectedPrize.icon },
    rewardType,
    rewardValue,
  };
}

module.exports = { getWheelConfig, getUserSpinStatus, spin };
