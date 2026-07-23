// @ts-nocheck
'use strict';
/**
 * trade/jobs/index.js
 *
 * Central registry for all trade background jobs.
 * Called from trade/index.js after module initialization.
 *
 * Usage:
 *   const jobs = require('./jobs');
 *   jobs.startAll(prisma, io);
 *   // on shutdown:
 *   jobs.stopAll();
 */
const liquidationJob       = require('./liquidation.job');
const profitDistributionJob = require('./profit-distribution.job');
const priceUpdateJob        = require('./price-update.job');
const logger                = require('../../../shared/services/logger');

/**
 * Start all trade cron jobs.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {import('socket.io').Server|null}       io
 */
function startAll(prisma, io = null) {
  try { liquidationJob.start(prisma, io); }       catch (e) { logger.error(`[TradeJobs] liquidation start: ${e.message}`); }
  try { profitDistributionJob.start(prisma); }    catch (e) { logger.error(`[TradeJobs] profit-distribution start: ${e.message}`); }
  try { priceUpdateJob.start(prisma, io); }       catch (e) { logger.error(`[TradeJobs] price-update start: ${e.message}`); }
  logger.info('[TradeJobs] All trade jobs started');
}

function stopAll() {
  liquidationJob.stop();
  profitDistributionJob.stop();
  priceUpdateJob.stop();
}

module.exports = { startAll, stopAll };
