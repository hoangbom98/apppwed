// @ts-nocheck
'use strict';
/**
 * trade/jobs/liquidation.job.js
 *
 * Cron: every 10 seconds — scan all open positions for liquidation.
 * Uses LiquidationService to do the actual price-check + close.
 *
 * Injected from trade module index (prisma + io passed in).
 */
const cron   = require('node-cron');
const logger = require('../../../shared/services/logger');
const LiquidationService = require('../services/liquidationService');

let _task = null;

/**
 * Start the liquidation cron job.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {import('socket.io').Server|null}       io
 */
function start(prisma, io = null) {
  if (_task) return; // already running

  const svc = new LiquidationService(prisma, io);

  // Every 10 seconds — tight enough for real-time liquidation
  _task = cron.schedule('*/10 * * * * *', async () => {
    try {
      await svc.runFullScan();
    } catch (err) {
      logger.error(`[LiquidationJob] error: ${err.message}`);
    }
  });

  logger.info('[LiquidationJob] started (every 10 seconds)');
}

function stop() {
  if (_task) {
    _task.stop();
    _task = null;
    logger.info('[LiquidationJob] stopped');
  }
}

module.exports = { start, stop };
