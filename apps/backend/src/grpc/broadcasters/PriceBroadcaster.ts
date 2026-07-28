'use strict';
/**
 * apps/backend/src/grpc/broadcasters/PriceBroadcaster.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton EventEmitter bridging MarketPriceFeed → gRPC WatchPrices streams.
 *
 * MarketPriceFeed already polls Binance/CoinGecko every 30s and broadcasts via
 * Socket.IO. We extend that broadcast to also fire 'price:update' on this
 * EventEmitter so gRPC handlers can subscribe without modifying the feed logic.
 *
 * Usage:
 *   // In gRPC handler (WatchPrices):
 *   PriceBroadcaster.on('price:update', handler);
 *   PriceBroadcaster.off('price:update', handler);
 *
 *   // In MarketPriceFeed.updatePrices() after building snapshot:
 *   PriceBroadcaster.emit('price:update', snapshotItem);
 */
const EventEmitter = require('events');

class PriceBroadcasterClass extends EventEmitter {
  constructor() {
    super();
    // Unlimited listeners — one per connected gRPC stream client
    this.setMaxListeners(0);
  }

  /**
   * Emit a price update to all subscribed gRPC streams.
   * @param {{ symbol: string, lastPrice: number, priceChange: number, volume24h: number, high24h: number, low24h: number }} update
   */
  publish(update) {
    this.emit('price:update', update);
  }
}

/** @type {PriceBroadcasterClass} */
const PriceBroadcaster = new PriceBroadcasterClass();

module.exports = PriceBroadcaster;
