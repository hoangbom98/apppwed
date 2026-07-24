// @ts-nocheck
'use strict';
/**
 * trade/jobs/liquidation.job.js
 *
 * Runs every 30 seconds — scans all open positions and liquidates those
 * where price has breached the liquidation threshold.
 *
 * Liquidation price:
 *   long:  entryPrice × (1 - 1/leverage)
 *   short: entryPrice × (1 + 1/leverage)
 *
 * Called from: cron.js (registered on app startup)
 */
const logger = require('../../../shared/services/logger');
const notifSvc = require('../../../shared/services/notificationService');

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {import('socket.io').Server|null} io
 */
async function runLiquidationCheck(prisma, io = null) {
  const openPositions = await prisma.position.findMany({
    where: { status: 'open' },
    include: { symbol: true },
  });

  if (!openPositions.length) return;

  let liquidated = 0;

  for (const pos of openPositions) {
    try {
      const entryPrice = parseFloat(pos.entryPrice);
      const leverage   = pos.leverage || 1;
      const currentPrice = parseFloat(pos.currentPrice);

      const liqPrice = pos.side === 'long'
        ? entryPrice * (1 - 1 / leverage)
        : entryPrice * (1 + 1 / leverage);

      const shouldLiquidate = pos.side === 'long'
        ? currentPrice <= liqPrice
        : currentPrice >= liqPrice;

      if (!shouldLiquidate) continue;

      const qty    = parseFloat(pos.quantity);
      const margin = parseFloat(pos.margin);

      // PnL is -100% of margin on liquidation
      const pnl = -margin;

      const wallet = await prisma.wallet.findUnique({ where: { userId: pos.userId } });
      const newBalance = Math.max(0, parseFloat(wallet?.balance ?? 0) + margin + pnl);
      const newFrozen  = Math.max(0, parseFloat(wallet?.frozen ?? 0) - margin);

      await prisma.$transaction([
        prisma.position.update({
          where: { id: pos.id },
          data: {
            status:      'closed',
            closedPrice: currentPrice,
            pnl,
            pnlPercent:  -100,
            closedAt:    new Date(),
          },
        }),
        prisma.wallet.update({
          where: { userId: pos.userId },
          data:  { balance: newBalance, frozen: newFrozen },
        }),
        prisma.transaction.create({
          data: {
            userId:        pos.userId,
            type:          'trade_close',
            amount:        pnl,
            referenceId:   pos.id,
            referenceType: 'position_liquidated',
            note:          `Thanh lý ${pos.side} ${pos.symbol.code} tại ${currentPrice}`,
            balanceAfter:  newBalance,
          },
        }),
      ]);

      notifSvc.sendToUser(pos.userId, 'notification', {
        title:   'Vị thế bị thanh lý',
        content: `${pos.side.toUpperCase()} ${pos.symbol.code} bị thanh lý tại ${currentPrice}. Mất ${Math.abs(pnl).toFixed(2)} USD.`,
      });

      if (io) {
        io.to(`user:${pos.userId}`).emit('position:liquidated', {
          positionId: pos.id,
          symbol:     pos.symbol.code,
          currentPrice,
          pnl,
        });
      }

      liquidated++;
      logger.info(`[LiquidationJob] Position ${pos.id} liquidated: symbol=${pos.symbol.code} price=${currentPrice}`);
    } catch (err) {
      logger.error(`[LiquidationJob] Error processing position ${pos.id}: ${err.message}`);
    }
  }

  if (liquidated > 0) {
    logger.info(`[LiquidationJob] Liquidated ${liquidated} positions`);
  }
}

module.exports = { runLiquidationCheck };
