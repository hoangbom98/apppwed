/**
 * config/cron/game.cron.ts — Game-domain scheduled jobs.
 *
 * Jobs:
 *   game-rebate-calculate    55 23 * * *     dispatch to BullMQ game-rebate queue
 *   game-rebate-settle       0  1  * * *     settle claimable rebates (T+1)
 *   game-vip-check           30 2  * * *     upgrade users who hit VIP thresholds
 *   game-savingsVault-int    5  0  * * *     dispatch BullMQ savings-vault interest
 *   agent-settlement-daily   10 0  * * *     commission calc for previous day
 *   robot-bet-tick           every 30s       simulate liquidity bets (ENABLE_ROBOT_BETS=true)
 *   vip-expiry               0  *  * * *     expire dating VIP memberships
 */

import { logger } from '../../shared/services/core/logger';
import { getPrismaClient } from '../databases';
const redisClient = require('../redis');

// ── Dispatch rebate calculate job ────────────────────────────────────────────
export async function gameRebateCalculate(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    if (redisClient) {
      const { Queue } = require('bullmq');
      const q = new Queue('game-rebate', { connection: redisClient });
      await q.add('calculate', { action: 'calculate', betDate: today });
      logger.info(`[RebateCron] dispatched calculate job to BullMQ for ${today}`);
    } else {
      // Inline fallback when Redis unavailable
      const RebateService = require('../../shared/services/finance/rebateService');
      const rebateSvc = new RebateService(getPrismaClient('game'), logger);
      const { created, totalAmount } = await rebateSvc.calculateDailyRebates(today);
      if (created > 0) logger.info(`[RebateCron] calculated ${created} rebates, total=${totalAmount}`);
    }
  } catch (err: any) {
    logger.error('gameRebateCalculate failed', { err: err.message });
  }
}

// ── Dispatch rebate settle job ───────────────────────────────────────────────
export async function gameRebateSettle(): Promise<void> {
  try {
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
    if (redisClient) {
      const { Queue } = require('bullmq');
      const q = new Queue('game-rebate', { connection: redisClient });
      await q.add('settle', { action: 'settle', betDate: yesterday });
      logger.info(`[RebateCron] dispatched settle job to BullMQ for ${yesterday}`);
    } else {
      const RebateService = require('../../shared/services/finance/rebateService');
      const rebateSvc = new RebateService(getPrismaClient('game'), logger);
      const { settled, totalAmount } = await rebateSvc.settleDailyRebates(yesterday);
      if (settled > 0) logger.info(`[RebateCron] settled ${settled} rebates, total=${totalAmount}`);
    }
  } catch (err: any) {
    logger.error('gameRebateSettle failed', { err: err.message });
  }
}

export async function gameVipLevelCheck(): Promise<void> {
  try {
    const gamePrisma = getPrismaClient('game');
    const vipLevels  = await gamePrisma.vipLevel.findMany({
      where: { status: 'active' },
      select: { id: true, level: true, minTotalDeposit: true },
      orderBy: { level: 'asc' },
    });
    if (vipLevels.length === 0) return;
    const maxLevel = vipLevels[vipLevels.length - 1].level;
    const users = await gamePrisma.user.findMany({
      where: { status: 'active', vipLevel: { lt: maxLevel } },
      select: { id: true, vipLevel: true, totalDeposit: true },
    });
    let upgraded = 0;
    for (const user of users) {
      let newLevel = user.vipLevel;
      for (const vl of vipLevels) {
        if (vl.level > user.vipLevel && user.totalDeposit.gte(vl.minTotalDeposit)) newLevel = vl.level;
      }
      if (newLevel <= user.vipLevel) continue;
      await gamePrisma.user.update({ where: { id: user.id }, data: { vipLevel: newLevel } });
      upgraded++;
      logger.info(`[VipCron] userId=${user.id} upgraded vip ${user.vipLevel} → ${newLevel}`);
    }
    if (upgraded > 0) logger.info(`[VipCron] Upgraded ${upgraded} users`);
  } catch (err: any) {
    logger.error('gameVipLevelCheck failed', { err: err.message });
  }
}

export async function gameSavingsVaultInterest(): Promise<void> {
  try {
    const { dispatchSavingsVaultInterest } = require('../../modules/workers/savingsVault-interest.worker');
    await dispatchSavingsVaultInterest();
  } catch (err: any) {
    logger.error('gameSavingsVaultInterest failed', { err: err.message });
  }
}

export async function agentSettlementDaily(): Promise<void> {
  try {
    const { enqueueAgentSettlement } = require('../../modules/workers/agent-settlement.worker');
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
    await enqueueAgentSettlement(yesterday);
  } catch (err: any) {
    logger.error('agentSettlementDaily failed', { err: err.message });
  }
}

export async function robotBetTick(): Promise<void> {
  if (process.env.ENABLE_ROBOT_BETS !== 'true') return;
  try {
    const { enqueueAllRobotBets } = require('../../modules/workers/robot-bet.worker');
    await enqueueAllRobotBets();
  } catch (err: any) {
    logger.error('robotBetTick failed', { err: err.message });
  }
}

export async function processVipExpiry(): Promise<void> {
  try {
    const datingPrisma  = getPrismaClient('dating');
    const expiredDating = await datingPrisma.vipMembership.findMany({
      where: { status: 'active', endDate: { lt: new Date() } },
      select: { id: true, userId: true },
    });
    for (const vm of expiredDating) {
      await datingPrisma.$transaction([
        datingPrisma.vipMembership.update({ where: { id: vm.id }, data: { status: 'expired' } }),
        datingPrisma.user.update({ where: { id: vm.userId }, data: { isVip: false } }),
      ]);
    }
    if (expiredDating.length > 0) logger.info(`Expired ${expiredDating.length} dating VIP memberships`);
  } catch (err: any) {
    logger.error('processVipExpiry failed', { err: err.message });
  }
}
