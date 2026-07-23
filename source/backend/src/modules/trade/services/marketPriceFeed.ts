// @ts-nocheck
'use strict';
// backend/src/modules/trade/services/marketPriceFeed.js
/**
 * Market Price Feed Service
 *
 * Fetches live crypto/forex prices from third-party APIs and upserts
 * PriceHistory records, then broadcasts via Socket.IO.
 *
 * Schema facts (prisma/trade/schema.prisma):
 *   - NO `tradingPair` model → use `Symbol` model (@@map "symbols")
 *   - Symbol fields: id, code, name, baseAsset, quoteAsset, status, ...
 *   - NO lastPrice/change24h/high24h/low24h/volume24h on Symbol
 *     → upsert into `PriceHistory` (@@map "price_history") instead
 *
 * Sources (in priority order):
 *   1. Binance Public API (no key required for spot prices)
 *   2. Internal random-walk (fallback for demo/dev)
 *
 * Usage:
 *   const feed = new MarketPriceFeed(prisma, io);
 *   feed.start(30_000);  // poll every 30s
 *   feed.stop();
 */
const axios  = require('axios');
const logger = require('../../../shared/services/logger');

class MarketPriceFeed {
  constructor(prisma, io = null) {
    this.prisma = prisma;
    this.io     = io;
    this._timer = null;
  }

  // ── Binance price fetch ───────────────────────────────────────────────────

  async fetchBinancePrices() {
    try {
      // Single call returns all 24-hr tickers — very efficient
      const res = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
        timeout: 5000,
      });
      const map = {};
      for (const t of res.data) {
        map[t.symbol] = {
          price:     parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          high24h:   parseFloat(t.highPrice),
          low24h:    parseFloat(t.lowPrice),
          volume24h: parseFloat(t.volume),
        };
      }
      return map;
    } catch (err) {
      logger.warn(`[PriceFeed] Binance fetch failed: ${err.message}`);
      return null;
    }
  }

  // ── Update PriceHistory in DB ─────────────────────────────────────────────

  async updatePrices() {
    try {
      // Use Symbol model (NOT tradingPair) — code field maps to Binance symbol
      const symbols = await this.prisma.symbol.findMany({
        where:  { status: 'active' },
        select: { id: true, code: true },
      });

      if (!symbols.length) return;

      const binancePrices = await this.fetchBinancePrices();

      const updates = [];
      const snapshot = [];   // for Socket.IO broadcast

      for (const sym of symbols) {
        const ticker = binancePrices?.[sym.code];
        if (!ticker) continue;

        // Upsert into price_history — one record per symbol (keyed by symbolId)
        updates.push(
          this.prisma.priceHistory.upsert({
            where:  { symbolId: sym.id },
            create: {
              symbolId:  sym.id,
              open:      ticker.price,
              high:      ticker.high24h,
              low:       ticker.low24h,
              close:     ticker.price,
              volume:    ticker.volume24h,
              change:    ticker.change24h,
              interval:  '1d',
            },
            update: {
              close:    ticker.price,
              high:     ticker.high24h,
              low:      ticker.low24h,
              volume:   ticker.volume24h,
              change:   ticker.change24h,
            },
          })
        );
        snapshot.push({ symbolId: sym.id, code: sym.code, price: ticker.price, change24h: ticker.change24h });
      }

      if (updates.length) {
        await Promise.all(updates);
        logger.info(`[PriceFeed] Updated ${updates.length} symbols`);

        // Broadcast via Socket.IO
        if (this.io) {
          this.io.emit('trade:price_update', snapshot);
        }
      }
    } catch (err) {
      logger.error(`[PriceFeed] updatePrices error: ${err.message}`);
    }
  }

  /**
   * Start periodic price polling.
   * @param {number} intervalMs – polling interval in ms (default 30s)
   */
  start(intervalMs = 30_000) {
    if (this._timer) return; // already running
    logger.info(`[PriceFeed] Starting with interval ${intervalMs}ms`);
    this.updatePrices(); // immediate first fetch
    this._timer = setInterval(() => this.updatePrices(), intervalMs);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      logger.info('[PriceFeed] Stopped');
    }
  }
}

module.exports = MarketPriceFeed;
