// @ts-nocheck
'use strict';
/**
 * trade/jobs/price-update.job.js
 *
 * Cron: every 30 seconds — fetch live prices from Binance and update DB.
 * Broadcasts trade:price_update via Socket.IO.
 * Respects ENABLE_PRICE_FEED env flag.
 */
const cron   = require('node-cron');
const logger = require('../../../shared/services/logger');
const MarketPriceFeed = require('../services/marketPriceFeed');

let _task  = null;
let _feed  = null;

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {import('socket.io').Server|null}       io
 */
function start(prisma, io = null) {
  if (_task) return;
  if (process.env.ENABLE_PRICE_FEED !== 'true') {
    logger.info('[PriceUpdateJob] ENABLE_PRICE_FEED=false — skipped');
    return;
  }

  _feed = new MarketPriceFeed(prisma, io);

  // Every 30 seconds
  _task = cron.schedule('*/30 * * * * *', async () => {
    try {
      await _feed.updatePrices();
    } catch (err) {
      logger.error(`[PriceUpdateJob] error: ${err.message}`);
    }
  });

  // Immediate first fetch
  _feed.updatePrices().catch(() => {});

  logger.info('[PriceUpdateJob] started (every 30 seconds)');
}

function stop() {
  if (_task) {
    _task.stop();
    _task = null;
  }
  if (_feed) {
    _feed.stop();
    _feed = null;
  }
}

module.exports = { start, stop };
