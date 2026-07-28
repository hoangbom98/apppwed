/**
 * config/cron/risk.cron.ts — Risk & security background jobs.
 *
 * Jobs:
 *   batch-risk-scoring  every 30 min   recalculate risk scores for active users
 *   adaptive-limits     daily 02:00    adjust bet limits based on risk profiles
 */

import { logger } from '../../shared/services/core/logger';
import { getPrismaClient } from '../databases';

export async function batchRiskScoring(): Promise<void> {
  try {
    const prisma     = getPrismaClient('admin');
    const RiskScorer = require('../../risk/riskScorer');
    const riskScorer = new RiskScorer(prisma);
    const processed  = await riskScorer.runBatch(500);
    if (processed > 0) logger.info(`[RiskCron] batch scored ${processed} users`);
  } catch (err: any) {
    logger.error('batchRiskScoring failed', { err: err.message });
  }
}

export async function adaptiveLimitsJob(): Promise<void> {
  try {
    const prisma         = getPrismaClient('admin');
    const AdaptiveLimits = require('../../risk/adaptiveLimits');
    const al             = new AdaptiveLimits(prisma);
    const updated        = await al.runBatchAdjustment();
    logger.info(`[RiskCron] adaptive limits updated for ${updated} users`);
  } catch (err: any) {
    logger.error('adaptiveLimitsJob failed', { err: err.message });
  }
}
