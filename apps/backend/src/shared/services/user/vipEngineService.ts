// @ts-nocheck
/**
 * vipEngineService.ts — Engine 9: Multi-Project VIP Engine
 *
 * Manages VIP level progression based on cumulative bet/deposit/trade activity.
 * Unified across all 5 sub-projects with per-project config.
 *
 * VIP Progression:
 *  - Experience points earned on every qualifying transaction
 *  - Level up when experience reaches tier threshold
 *  - Level-up bonus credited to wallet
 *  - Daily/monthly bonuses per VIP level
 *  - Benefits: cashback rate, withdrawal priority, bonus multiplier
 *
 * Configuration (via ProjectConfig):
 *   module='vip' group='earn'  key='bet_rate'     value=0.001  (XP per VND bet)
 *   module='vip' group='earn'  key='deposit_rate' value=0.0005
 *   module='vip' group='tiers' key='levels'       value=[{level,name,minXp,reward,...}]
 *
 * Required user fields: vipLevel (Int), totalBet (Decimal), totalDeposit (Decimal)
 * Required admin_db model: VipConfig, VipHistory
 *
 * USAGE
 * ─────
 *   const vip = new VipEngineService(prisma, 'game', adminPrisma);
 *
 *   // After every bet
 *   await vip.addExperience(userId, betAmount, 'bet');
 *
 *   // Check and process level-ups
 *   await vip.processLevelUp(userId);
 *
 *   // Get user VIP status
 *   const status = await vip.getUserVipStatus(userId);
 */

'use strict';

const logger = require('../logger');
const cache  = require('../cacheService');

// Default VIP tiers (overridden by ProjectConfig)
const DEFAULT_TIERS = [
  { level: 1,  name: 'Thành viên', minBet: 0,           rewardAmount: 0,      cashback: 0.000, bonusMultiplier: 1.00 },
  { level: 2,  name: 'V1',         minBet: 1_000_000,   rewardAmount: 10_000, cashback: 0.001, bonusMultiplier: 1.05 },
  { level: 3,  name: 'V2',         minBet: 5_000_000,   rewardAmount: 30_000, cashback: 0.002, bonusMultiplier: 1.10 },
  { level: 4,  name: 'V3',         minBet: 20_000_000,  rewardAmount: 80_000, cashback: 0.003, bonusMultiplier: 1.15 },
  { level: 5,  name: 'V4',         minBet: 50_000_000,  rewardAmount: 200_000, cashback: 0.005, bonusMultiplier: 1.20 },
  { level: 6,  name: 'V5',         minBet: 100_000_000, rewardAmount: 500_000, cashback: 0.008, bonusMultiplier: 1.30 },
  { level: 7,  name: 'V6',         minBet: 200_000_000, rewardAmount: 1_000_000, cashback: 0.010, bonusMultiplier: 1.40 },
  { level: 8,  name: 'V7',         minBet: 500_000_000, rewardAmount: 2_000_000, cashback: 0.015, bonusMultiplier: 1.50 },
  { level: 9,  name: 'V8',         minBet: 1_000_000_000, rewardAmount: 5_000_000, cashback: 0.020, bonusMultiplier: 1.60 },
  { level: 10, name: 'V9',         minBet: 3_000_000_000, rewardAmount: 10_000_000, cashback: 0.030, bonusMultiplier: 2.00 },
];

class VipEngineService {
  private prisma:      any;
  private project:     string;
  private adminPrisma: any;

  constructor(prisma: any, project: string, adminPrisma: any = null) {
    this.prisma      = prisma;
    this.project     = project;
    this.adminPrisma = adminPrisma || prisma;
  }

  // ── Tier config ───────────────────────────────────────────────────────────

  private async _getTiers(): Promise<typeof DEFAULT_TIERS> {
    const cacheKey = `vip:tiers:${this.project}`;
    return cache.remember(cacheKey, 3600, async () => {
      // Try to load from admin_db VipConfig
      try {
        const configs = await this.adminPrisma.vipConfig.findMany({
          where:   { status: 'active' },
          orderBy: { level: 'asc' },
        });
        if (configs.length) {
          return configs.map((c: any) => ({
            level:           c.level,
            name:            c.name,
            minBet:          Number(c.betRequired ?? 0),
            rewardAmount:    Number(c.rewardAmount ?? 0),
            cashback:        Number((c.benefits as any)?.cashback ?? 0),
            bonusMultiplier: Number((c.benefits as any)?.bonusMultiplier ?? 1),
          }));
        }
      } catch { /* fall back */ }
      return DEFAULT_TIERS;
    });
  }

  private _getTierForBet(totalBet: number, tiers: typeof DEFAULT_TIERS): typeof DEFAULT_TIERS[0] {
    let current = tiers[0];
    for (const tier of tiers) {
      if (totalBet >= tier.minBet) current = tier;
      else break;
    }
    return current;
  }

  // ── Level-up processing ───────────────────────────────────────────────────

  /**
   * Recalculate and apply VIP level for a user based on totalBet.
   * Grants level-up bonus if level increased.
   * Called after every significant transaction (deposit, bet, trade).
   *
   * @returns { oldLevel, newLevel, levelsGained, bonusPaid }
   */
  async processLevelUp(userId: string): Promise<{
    oldLevel: number; newLevel: number; levelsGained: number; bonusPaid: number;
  }> {
    const tiers = await this._getTiers();

    return this.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({
        where:  { id: userId },
        select: { vipLevel: true, totalBet: true, totalDeposit: true },
      });
      if (!user) throw new Error('User not found');

      const totalBet  = Number(user.totalBet ?? 0);
      const newTier   = this._getTierForBet(totalBet, tiers);
      const oldLevel  = user.vipLevel ?? 1;
      const newLevel  = newTier.level;

      if (newLevel <= oldLevel) return { oldLevel, newLevel, levelsGained: 0, bonusPaid: 0 };

      // Calculate total bonus for all gained levels
      let bonusPaid = 0;
      for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
        const tier = tiers.find(t => t.level === lvl);
        if (tier?.rewardAmount) bonusPaid += tier.rewardAmount;
      }

      // Update user VIP level
      await tx.user.update({
        where: { id: userId },
        data:  { vipLevel: newLevel },
      });

      // Credit level-up bonus
      if (bonusPaid > 0) {
        await tx.user.update({
          where: { id: userId },
          data:  { balance: { increment: bonusPaid } },
        });
        await tx.transaction.create({
          data: {
            userId, type: 'bonus', amount: bonusPaid, balanceAfter: 0, status: 'completed',
            note: `Lên cấp VIP ${oldLevel}→${newLevel}: nhận ${bonusPaid.toLocaleString('vi-VN')}đ`,
          },
        });
      }

      // Record in VIP history (admin_db)
      try {
        await this.adminPrisma.vipHistory.create({
          data: { userId, oldLevel, newLevel, rewardAmount: bonusPaid, project: this.project },
        });
      } catch { /* non-critical */ }

      // Bust cache
      await cache.del(`vip:status:${this.project}:${userId}`);

      logger.info(`[VIP] Level-up userId=${userId} ${oldLevel}→${newLevel} bonus=${bonusPaid} (${this.project})`);
      return { oldLevel, newLevel, levelsGained: newLevel - oldLevel, bonusPaid };
    });
  }

  /**
   * Get full VIP status for a user: level, tier info, progress to next level.
   */
  async getUserVipStatus(userId: string) {
    const cacheKey = `vip:status:${this.project}:${userId}`;
    return cache.remember(cacheKey, 300, async () => {
      const user = await this.prisma.user.findUnique({
        where:  { id: userId },
        select: { vipLevel: true, totalBet: true },
      });
      if (!user) return null;

      const tiers    = await this._getTiers();
      const totalBet = Number(user.totalBet ?? 0);
      const current  = this._getTierForBet(totalBet, tiers);
      const nextTier = tiers.find(t => t.level === current.level + 1);

      const progressPct = nextTier
        ? Math.round(((totalBet - current.minBet) / (nextTier.minBet - current.minBet)) * 100)
        : 100;

      return {
        level:          current.level,
        name:           current.name,
        cashback:       current.cashback,
        bonusMultiplier: current.bonusMultiplier,
        totalBet,
        nextLevel:      nextTier?.level ?? null,
        nextLevelName:  nextTier?.name  ?? null,
        betToNextLevel: nextTier ? Math.max(0, nextTier.minBet - totalBet) : 0,
        progressPct:    Math.min(100, progressPct),
      };
    });
  }

  /**
   * Calculate cashback amount for a bet/transaction.
   */
  async calculateCashback(userId: string, betAmount: number): Promise<number> {
    const status = await this.getUserVipStatus(userId);
    if (!status?.cashback) return 0;
    return Math.round(betAmount * status.cashback);
  }
}

module.exports = VipEngineService;
