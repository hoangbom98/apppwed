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

    // ── Validate quota / balance TRƯỚC khi vào transaction ──────────────────
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

    const selectedPrize               = weightedRandom(activePrizes);
    const { rewardType, rewardValue } = selectedPrize;
    const spinCost                    = !isFree ? Number(wheel.spinCost ?? 0) : 0;
    const coinReward                  = rewardType === 'COIN' ? Number(rewardValue ?? 0) : 0;

    // ── Atomic transaction: tất cả mutation gộp vào 1 $transaction ──────────
    // Lý do: tách 2 user.update (debit + credit) trong cùng $transaction gây
    // "conflict on the same row" với Prisma. Thay bằng 1 update duy nhất với
    // net balance change = coinReward - spinCost.
    await this.prisma.$transaction(async (tx) => {
      // Đọc balance TRONG transaction để có snapshot nhất quán
      const userSnap = await tx.user.findUnique({
        where:  { id: userId },
        select: { balance: true },
      });
      const balanceBefore = Number(userSnap?.balance ?? 0);

      // Tính net delta: credit COIN reward, debit spin cost
      const netDelta = coinReward - spinCost;

      // 1. Ghi spin history
      await tx.spinHistory.create({
        data: {
          userId,
          wheelId:    wheel.id,
          prizeId:    selectedPrize.id,
          rewardType,
          rewardValue,
          isFree,
        },
      });

      // 2. Cập nhật balance nếu có thay đổi (1 lần duy nhất để tránh conflict)
      if (netDelta !== 0) {
        // Nếu là debit (spinCost > coinReward), kiểm tra lại số dư trong transaction
        if (netDelta < 0 && balanceBefore + netDelta < 0) {
          throw new Error('Số dư không đủ để quay');
        }
        await tx.user.update({
          where: { id: userId },
          data:  { balance: { increment: netDelta } },
        });
      }

      // 3. Ghi ledger transaction nếu có thay đổi tài chính
      if (spinCost > 0 || coinReward > 0) {
        await tx.transaction.create({
          data: {
            userId,
            type:          'wheel_reward',
            amount:        coinReward - spinCost, // dương = nhận tiền, âm = mất tiền
            balanceBefore,
            balanceAfter:  balanceBefore + netDelta,
            referenceType: 'spin_history',
            note:          `Lucky Wheel — ${selectedPrize.label || 'prize'}${spinCost > 0 ? ` (phí: ${spinCost})` : ''}`,
          },
        }).catch(() => {
          // Transaction model có thể yêu cầu thêm field tuỳ project — không fatal
        });
      }
    });

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
