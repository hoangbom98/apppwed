// @ts-nocheck
/**
 * core/rewards/reward.service.ts
 *
 * Base reward engine — dispatches concrete reward types
 * (balance credit, loyalty points, bonus credits) to the correct handlers.
 *
 * Used by: ReferralService, AffiliateService, MissionService, CampaignService.
 *
 * @example
 *   const { RewardService } = require('../../core/rewards/reward.service');
 *   const svc = new RewardService(prisma, 'game');
 *   await svc.giveReward(userId, 50000, 'REFERRAL', 'Thưởng giới thiệu bạn bè');
 */
'use strict';

const logger       = require('../../shared/services/logger');
const auditService = require('../../shared/services/auditService');
const { eventBus, EVENTS } = require('../events/event-bus');

/** Supported reward categories */
const REWARD_TYPES = Object.freeze({
  BALANCE:           'balance',           // credit directly to balance
  BONUS:             'bonus',             // bonus wallet (requires wager)
  LOYALTY_POINTS:    'loyalty_points',    // points added to loyaltyPoints
});

class RewardService {
  /**
   * @param {object} prisma       – project Prisma client (must have user + transaction models)
   * @param {string} projectCode  – 'game' | 'sports' | 'trade' | 'dating' | 'hub'
   */
  constructor(prisma, projectCode) {
    this.prisma       = prisma;
    this.projectCode  = projectCode;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Give a reward to a user.
   *
   * @param {string} userId
   * @param {number} amount         – VND amount or points quantity
   * @param {string} rewardCategory – e.g. 'REFERRAL' | 'AFFILIATE_COMMISSION' | 'MISSION'
   * @param {string} description    – human-readable description for ledger
   * @param {'balance'|'bonus'|'loyalty_points'} [rewardType='balance']
   * @returns {Promise<{ success: boolean, newBalance?: number, newPoints?: number }>}
   */
  async giveReward(
    userId,
    amount,
    rewardCategory,
    description,
    rewardType = REWARD_TYPES.BALANCE,
  ) {
    if (!userId || !amount || amount <= 0) return { success: false };

    try {
      let result;

      switch (rewardType) {
        case REWARD_TYPES.BALANCE:
          result = await this._creditBalance(userId, amount, rewardCategory, description);
          break;
        case REWARD_TYPES.LOYALTY_POINTS:
          result = await this._addLoyaltyPoints(userId, amount, rewardCategory, description);
          break;
        case REWARD_TYPES.BONUS:
          result = await this._creditBonus(userId, amount, rewardCategory, description);
          break;
        default:
          result = await this._creditBalance(userId, amount, rewardCategory, description);
      }

      await auditService.log({
        action:  `reward.${rewardCategory.toLowerCase()}`,
        userId,
        project: this.projectCode,
        meta:    { amount, rewardType, description },
      });

      logger.info(
        `[RewardService] ${rewardCategory} userId=${userId} amount=${amount} type=${rewardType} project=${this.projectCode}`,
      );

      return { success: true, ...result };
    } catch (e) {
      logger.error(`[RewardService] giveReward error: ${e.message}`, { userId, amount, rewardCategory });
      return { success: false, error: e.message };
    }
  }

  /**
   * Batch-give the same reward to multiple users.
   * Non-fatal: failures are logged and skipped.
   * @param {string[]} userIds
   * @param {number}   amount
   * @param {string}   rewardCategory
   * @param {string}   description
   * @param {string}   [rewardType='balance']
   */
  async giveBulkReward(userIds, amount, rewardCategory, description, rewardType = REWARD_TYPES.BALANCE) {
    const results = [];
    for (const userId of userIds) {
      const r = await this.giveReward(userId, amount, rewardCategory, description, rewardType);
      results.push({ userId, ...r });
    }
    return results;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  async _creditBalance(userId, amount, referenceType, description) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true },
    });
    if (!user) throw new Error(`User ${userId} not found`);

    const newBalance = Number(user.balance) + amount;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data:  { balance: { increment: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          type:          referenceType,
          amount,
          balanceBefore: Number(user.balance),
          balanceAfter:  newBalance,
          note:          description,
          referenceType,
        },
      }),
    ]);

    return { newBalance };
  }

  async _addLoyaltyPoints(userId, points, referenceType, description) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { loyaltyPoints: true },
    });
    if (!user) throw new Error(`User ${userId} not found`);

    const newPoints = Number(user.loyaltyPoints ?? 0) + points;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data:  {
          loyaltyPoints:  { increment: points },
          lifetimePoints: { increment: points },
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          type:         'earn',
          points,
          balanceAfter: newPoints,
          description:  description || `${referenceType} +${points}pts`,
        },
      }),
    ]);

    eventBus.emit(EVENTS.POINTS_EARNED, {
      userId,
      points,
      project:     this.projectCode,
      reason:      referenceType,
      totalPoints: newPoints,
    });

    return { newPoints };
  }

  async _creditBonus(userId, amount, referenceType, description) {
    // Bonus credits behave like balance for now
    // Future: separate bonus wallet with wagering requirement
    return this._creditBalance(userId, amount, `${referenceType}_BONUS`, `[BONUS] ${description}`);
  }
}

module.exports = { RewardService, REWARD_TYPES };
