// @ts-nocheck
/**
 * core/gamification/lucky-wheel.service.ts
 *
 * Shared Lucky Wheel / Spin-to-win engine.
 * Replaces the game-only spinService with a cross-project implementation
 * that reads config from the project-specific DB but uses the same logic.
 *
 * Compatible with the existing game_db LuckyWheelConfig / WheelPrize / SpinHistory schema.
 *
 * Usage:
 *   const { LuckyWheelService } = require('../../core/gamification/lucky-wheel.service');
 *   const svc = new LuckyWheelService(prisma, 'dating');
 *   await svc.spin(userId, true);  // free spin
 */
'use strict';

const logger        = require('../../shared/services/logger');
const cacheService  = require('../../shared/services/cacheService');
const { RewardService }   = require('../rewards/reward.service');
const { eventBus, EVENTS } = require('../events/event-bus');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Weighted random selection from a set of prizes.
 * Each prize must have a `probability` (0–1) field.
 * @param {Array<{ probability: number }>} prizes
 */
function weightedRandom(prizes) {
  const rand = Math.random();
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += Number(prize.probability);
    if (rand <= cumulative) return prize;
  }
  return prizes[prizes.length - 1];
}

class LuckyWheelService {
  /**
   * @param {object} prisma       – project Prisma client (must have LuckyWheelConfig, WheelPrize, SpinHistory)
   * @param {string} projectCode  – 'game' | 'sports' | 'dating' | 'hub'
   */
  constructor(prisma, projectCode) {
    this.prisma      = prisma;
    this.projectCode = projectCode;
    this.rewardSvc   = new RewardService(prisma, projectCode);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Get wheel config + prizes (Redis-cached).
   */
  async getWheelConfig() {
    const key = `wheel:${this.projectCode}:config`;
    return cacheService.remember(key, 300, async () => {
      return this.prisma.luckyWheelConfig.findFirst({
        where:   { isActive: true },
        include: {
          prizes: {
            where:   { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Get user's spin status for today.
   * @param {string} userId
   */
  async getSpinStatus(userId) {
    const wheel = await this.getWheelConfig();
    if (!wheel) {
      return { freeSpinsUsed: 0, freeSpinsRemaining: 0, maxFreeSpins: 0, spinCost: 0 };
    }

    const today = todayStr();
    const freeSpinsUsed = await this.prisma.spinHistory.count({
      where: {
        userId,
        wheelId: wheel.id,
        isFree:  true,
        createdAt: { gte: new Date(today) },
      },
    });

    return {
      freeSpinsUsed,
      freeSpinsRemaining: Math.max(0, wheel.maxFreeSpinsPerDay - freeSpinsUsed),
      maxFreeSpins:       wheel.maxFreeSpinsPerDay,
      spinCost:           Number(wheel.spinCost ?? 0),
    };
  }

  /**
   * Execute a spin.
   * @param {string}  userId
   * @param {boolean} isFree – use free quota (true) or deduct spinCost (false)
   * @returns {{ prize, rewardType, rewardValue }}
   */
  async spin(userId, isFree) {
    const wheel = await this.getWheelConfig();
    if (!wheel) throw new Error('Vòng quay chưa được cấu hình');

    const activePrizes = (wheel.prizes || []).filter(p => p.isActive);
    if (!activePrizes.length) throw new Error('Vòng quay không có phần thưởng');

    // ── Validate quota / balance ─────────────────────────────────────────────
    if (isFree) {
      const status = await this.getSpinStatus(userId);
      if (status.freeSpinsRemaining <= 0) {
        throw new Error('Hết lượt quay miễn phí hôm nay');
      }
    } else if (Number(wheel.spinCost) > 0) {
      const user = await this.prisma.user.findUnique({
        where:  { id: userId },
        select: { balance: true },
      });
      if (!user || Number(user.balance) < Number(wheel.spinCost)) {
        throw new Error('Số dư không đủ để quay');
      }
    }

    const selectedPrize         = weightedRandom(activePrizes);
    const { rewardType, rewardValue } = selectedPrize;
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true },
    });

    const ops = [
      this.prisma.spinHistory.create({
        data: {
          userId,
          wheelId:    wheel.id,
          prizeId:    selectedPrize.id,
          rewardType,
          rewardValue,
          isFree,
        },
      }),
    ];

    // Deduct spin cost
    if (!isFree && Number(wheel.spinCost) > 0) {
      ops.push(
        this.prisma.user.update({
          where: { id: userId },
          data:  { balance: { decrement: wheel.spinCost } },
        }),
      );
    }

    // Apply COIN reward
    if (rewardType === 'COIN' && Number(rewardValue) > 0) {
      ops.push(
        this.prisma.user.update({
          where: { id: userId },
          data:  { balance: { increment: rewardValue } },
        }),
        this.prisma.transaction.create({
          data: {
            userId,
            type:          'wheel_reward',
            amount:        rewardValue,
            balanceBefore: Number(user?.balance ?? 0),
            balanceAfter:  Number(user?.balance ?? 0) + Number(rewardValue),
            referenceType: 'spin_history',
            note:          `Lucky Wheel — ${selectedPrize.label || 'prize'}`,
          },
        }),
      );
    }

    await this.prisma.$transaction(ops);

    // Apply POINTS reward
    if (rewardType === 'POINTS' && Number(rewardValue) > 0) {
      await this.rewardSvc.giveReward(
        userId,
        Number(rewardValue),
        'SPIN_REWARD',
        `Lucky Wheel — ${selectedPrize.label || 'points'}`,
        'loyalty_points',
      );
    }

    // Invalidate config cache so spin counts update
    await cacheService.del(`wheel:${this.projectCode}:config`);

    eventBus.emit(EVENTS.SPIN_COMPLETED, {
      userId,
      project:    this.projectCode,
      prizeId:    selectedPrize.id,
      rewardType,
      rewardValue: Number(rewardValue),
      isFree,
    });

    logger.info(
      `[LuckyWheel] spin userId=${userId} project=${this.projectCode} prize=${selectedPrize.label} free=${isFree}`,
    );

    return {
      prize: {
        id:    selectedPrize.id,
        label: selectedPrize.label,
        color: selectedPrize.color,
        icon:  selectedPrize.icon,
      },
      rewardType,
      rewardValue: Number(rewardValue),
    };
  }

  /**
   * Get a user's spin history (paginated).
   * @param {string} userId
   * @param {{ skip?: number, take?: number }} pagination
   */
  async getHistory(userId, { skip = 0, take = 20 } = {}) {
    const [data, total] = await Promise.all([
      this.prisma.spinHistory.findMany({
        where:   { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { prize: { select: { label: true, color: true } } },
      }),
      this.prisma.spinHistory.count({ where: { userId } }),
    ]);
    return { data, total };
  }
}

module.exports = { LuckyWheelService };
