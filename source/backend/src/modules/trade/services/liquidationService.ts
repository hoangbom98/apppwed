// @ts-nocheck
'use strict';
/**
 * trade/services/liquidationService.js
 *
 * Checks all open positions and triggers liquidation when price
 * crosses the liquidation threshold (margin call).
 *
 * Liquidation price:
 *   LONG:  entryPrice × (1 − 1/leverage)
 *   SHORT: entryPrice × (1 + 1/leverage)
 *
 * On liquidation: position is closed at current price, margin is forfeited.
 */
const logger = require('../../../shared/services/logger');

class LiquidationService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma
   * @param {import('socket.io').Server|null}       io
   */
  constructor(prisma, io = null) {
    this.prisma = prisma;
    this.io     = io;
  }

  /**
   * Check and liquidate all open positions for a given symbol at currentPrice.
   * @param {string} symbolId
   * @param {number} currentPrice
   * @returns {number} count of liquidated positions
   */
  async checkSymbol(symbolId, currentPrice) {
    const openPositions = await this.prisma.position.findMany({
      where: { symbolId, status: 'open' },
    });

    let liquidated = 0;
    for (const pos of openPositions) {
      if (await this._shouldLiquidate(pos, currentPrice)) {
        await this._liquidate(pos, currentPrice);
        liquidated++;
      }
    }
    return liquidated;
  }

  /**
   * Run full liquidation scan across all open positions.
   * Used by cron job — fetches current price per symbol from DB.
   */
  async runFullScan() {
    const openPositions = await this.prisma.position.findMany({
      where:   { status: 'open' },
      include: { symbol: true },
    });

    let liquidated = 0;
    const checked = new Set();

    for (const pos of openPositions) {
      if (checked.has(pos.symbolId)) continue;
      checked.add(pos.symbolId);

      // Get latest price from price_history
      const ph = await this.prisma.priceHistory.findFirst({
        where:   { symbolId: pos.symbolId },
        orderBy: { timestamp: 'desc' },
      });
      if (!ph) continue;

      const price = parseFloat(ph.close);
      liquidated += await this.checkSymbol(pos.symbolId, price);
    }

    if (liquidated > 0) {
      logger.info(`[LiquidationService] Full scan complete — liquidated ${liquidated} positions`);
    }
    return liquidated;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _shouldLiquidate(pos, currentPrice) {
    const entry   = parseFloat(pos.entryPrice);
    const lev     = pos.leverage || 1;
    const liqPrice = pos.side === 'long'
      ? entry * (1 - 1 / lev)
      : entry * (1 + 1 / lev);

    return pos.side === 'long'
      ? currentPrice <= liqPrice
      : currentPrice >= liqPrice;
  }

  async _liquidate(pos, currentPrice) {
    try {
      const qty      = parseFloat(pos.quantity);
      const entry    = parseFloat(pos.entryPrice);
      const margin   = parseFloat(pos.margin);
      const leverage = pos.leverage || 1;

      const pnl = pos.side === 'long'
        ? (currentPrice - entry) * qty * leverage
        : (entry - currentPrice) * qty * leverage;

      // On liquidation margin is forfeited (pnl is very negative)
      // Return whatever remains (normally 0 or very small)
      const returned = Math.max(0, margin + pnl);

      const wallet   = await this.prisma.wallet.findUnique({ where: { userId: pos.userId } });
      const newBal   = Math.max(0, (wallet ? parseFloat(wallet.balance) : 0) + returned);
      const newFrozen = Math.max(0, (wallet ? parseFloat(wallet.frozen) : 0) - margin);

      await this.prisma.$transaction([
        this.prisma.position.update({
          where: { id: pos.id },
          data: {
            status:      'closed',
            closedPrice: currentPrice,
            pnl,
            pnlPercent:  entry > 0 ? (pnl / (entry * qty)) * 100 : 0,
            closedAt:    new Date(),
            currentPrice,
          },
        }),
        this.prisma.wallet.update({
          where: { userId: pos.userId },
          data:  { balance: newBal, frozen: newFrozen },
        }),
        this.prisma.transaction.create({
          data: {
            userId:        pos.userId,
            type:          'liquidation',
            amount:        returned - margin, // negative = loss
            balanceAfter:  newBal,
            referenceId:   pos.id,
            referenceType: 'position',
            note:          `Thanh lý vị thế ${pos.side} tại ${currentPrice}`,
          },
        }),
      ]);

      // Real-time notification
      if (this.io) {
        this.io.to(`user_${pos.userId}`).emit('notification', {
          title:   'Vị thế bị thanh lý',
          content: `Vị thế ${pos.side.toUpperCase()} của bạn bị thanh lý tại giá ${currentPrice}. P&L: ${pnl.toFixed(2)} USD`,
        });
      }

      logger.warn(`[LiquidationService] Position ${pos.id} liquidated at ${currentPrice} — PnL: ${pnl.toFixed(2)}`);
    } catch (err) {
      logger.error(`[LiquidationService] Failed to liquidate position ${pos.id}: ${err.message}`);
    }
  }
}

module.exports = LiquidationService;
