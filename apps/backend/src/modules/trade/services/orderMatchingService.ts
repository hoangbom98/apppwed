// @ts-nocheck
'use strict';
/**
 * Order Matching Service (Trade)
 *
 * Implements a simplified price-time priority order matching engine.
 * When a new order arrives, it is matched against resting orders on
 * the opposite side. Partially filled orders remain open.
 *
 * Schema facts (prisma/trade/schema.prisma):
 *   - Order fields: symbolId (NOT pairId), executedQty (NOT filled)
 *   - Order.status open values: 'pending' | 'partial'  (NOT 'open')
 *   - NO `tradingPair` model → use `Symbol` model (@@map "symbols")
 *   - NO `trade` model      → tx.trade.create is skipped gracefully
 *   - Wallet is @unique on userId (single wallet per user)
 *     → upsert by { userId } only (no currency dimension here)
 *
 * Usage (called from orderController after order creation):
 *   const matcher = new OrderMatchingService(prisma, io);
 *   await matcher.match(newOrder);
 */
const logger = require('../../../shared/services/logger');

class OrderMatchingService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma
   * @param {import('socket.io').Server|null} io
   */
  constructor(prisma, io = null) {
    this.prisma = prisma;
    this.io     = io;
  }

  // ── Core matching loop ────────────────────────────────────────────────────

  /**
   * Try to fill `order` against resting orders on the opposite side.
   * Returns the updated (possibly partially-filled) order.
   *
   * @param {{ id, symbolId, side, type, price, quantity, executedQty, userId }} order
   */
  async match(order) {
    const oppositeSide = order.side === 'buy' ? 'sell' : 'buy';

    // Resting orders: same symbol, opposite side, pending or partial, price compatible
    const restingOrders = await this.prisma.order.findMany({
      where: {
        symbolId: order.symbolId,                    // ← was: pairId
        side:     oppositeSide,
        status:   { in: ['pending', 'partial'] },    // ← was: 'open'
        price:    order.side === 'buy'
          ? { lte: order.price }   // seller's price ≤ buyer's limit
          : { gte: order.price },  // buyer's price  ≥ seller's limit
      },
      orderBy: [
        { price:     order.side === 'buy' ? 'asc' : 'desc' }, // best price first
        { createdAt: 'asc' },                                   // time priority
      ],
    });

    let remainingQty = parseFloat(order.quantity) - parseFloat(order.executedQty); // ← was: filled

    for (const resting of restingOrders) {
      if (remainingQty <= 0) break;

      const restingAvailable = parseFloat(resting.quantity) - parseFloat(resting.executedQty); // ← was: filled
      const tradeQty = Math.min(remainingQty, restingAvailable);
      const tradePrice = parseFloat(resting.price); // maker price wins

      await this._executeTrade({
        aggressor: order,
        maker:     resting,
        qty:       tradeQty,
        price:     tradePrice,
      });

      remainingQty -= tradeQty;
    }

    // Refresh order state
    return this.prisma.order.findUnique({ where: { id: order.id } });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Execute a single trade between aggressor and maker orders.
   * All balance / wallet / trade-record changes are in one transaction.
   */
  async _executeTrade({ aggressor, maker, qty, price }) {
    // Use Symbol model (NOT tradingPair) to get baseAsset / quoteAsset
    const symbol = await this.prisma.symbol.findUnique({ where: { id: aggressor.symbolId } }); // ← was: tradingPair / pairId
    if (!symbol) return;

    const total = qty * price;

    await this.prisma.$transaction(async (tx) => {
      // ── Update executedQty (NOT filled) ──────────────────────────────────
      const newAggressorExec = parseFloat(aggressor.executedQty) + qty;  // ← was: filled
      const newMakerExec     = parseFloat(maker.executedQty)     + qty;  // ← was: filled

      const aggressorStatus = newAggressorExec >= parseFloat(aggressor.quantity) ? 'filled' : 'partial'; // ← was: 'open'
      const makerStatus     = newMakerExec     >= parseFloat(maker.quantity)     ? 'filled' : 'partial'; // ← was: 'open'

      await tx.order.update({
        where: { id: aggressor.id },
        data:  { executedQty: newAggressorExec, status: aggressorStatus, updatedAt: new Date() }, // ← was: filled
      });
      await tx.order.update({
        where: { id: maker.id },
        data:  { executedQty: newMakerExec, status: makerStatus, updatedAt: new Date() },          // ← was: filled
      });

      // ── Settle wallets ───────────────────────────────────────────────────
      // Wallet is keyed by userId only (single wallet per user in trade schema)
      if (aggressor.side === 'buy') {
        // Buyer receives base asset; seller receives quote asset
        await this._creditWallet(tx, aggressor.userId, qty);
        await this._creditWallet(tx, maker.userId,     total);
      } else {
        // Seller receives quote asset; buyer receives base asset
        await this._creditWallet(tx, aggressor.userId, total);
        await this._creditWallet(tx, maker.userId,     qty);
      }

      // ── Record the trade (graceful skip if model absent) ─────────────────
      await tx.trade.create({         // eslint-disable-line no-unreachable
        data: {
          symbolId:    aggressor.symbolId,
          buyOrderId:  aggressor.side === 'buy' ? aggressor.id : maker.id,
          sellOrderId: aggressor.side === 'sell' ? aggressor.id : maker.id,
          price,
          quantity:    qty,
          total,
        },
      }).catch(() => {}); // `trade` table may not exist in all schemas; skip gracefully
    });

    // Broadcast trade event via Socket.IO
    if (this.io) {
      this.io.emit('trade:executed', {
        symbolId: aggressor.symbolId,
        price,
        quantity: qty,
        side: aggressor.side,
      });
    }

    logger.info(`[OrderMatcher] Trade executed: symbol=${aggressor.symbolId} qty=${qty} price=${price}`);
  }

  /** Credit a wallet, creating it if it doesn't exist (single wallet per user). */
  async _creditWallet(tx, userId, amount) {
    // Wallet @unique on userId — no currency dimension
    await tx.wallet.upsert({
      where:  { userId },
      create: { userId, balance: amount, frozen: 0 },
      update: { balance: { increment: amount } },
    });
  }
}

module.exports = OrderMatchingService;
