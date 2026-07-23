// @ts-nocheck
'use strict';
/**
 * trade/jobs/profit-distribution.job.js
 *
 * Cron: daily at 00:05 — distribute profits to all active investments
 * and pay referral commissions.
 */
const cron   = require('node-cron');
const logger = require('../../../shared/services/logger');
const InvestmentService = require('../services/investmentService');

let _task = null;

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 */
function start(prisma) {
  if (_task) return;

  const svc = new InvestmentService(prisma);

  // Daily at 00:05 AM
  _task = cron.schedule('5 0 * * *', async () => {
    try {
      logger.info('[ProfitDistributionJob] Starting daily profit distribution...');
      const result = await svc.distributeDailyProfits();
      logger.info(`[ProfitDistributionJob] Done — processed: ${result.processed}, paid: ${result.totalPaid.toFixed(2)} USD`);
    } catch (err) {
      logger.error(`[ProfitDistributionJob] error: ${err.message}`);
    }
  });

  logger.info('[ProfitDistributionJob] started (daily at 00:05)');
}

function stop() {
  if (_task) {
    _task.stop();
    _task = null;
  }
}

module.exports = { start, stop };
