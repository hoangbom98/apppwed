// src/third-parties/providers/Binance/services/PriceFeedService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Binance spot price feed.
// Used by: trade module (crypto price display) + sports module (if odds need
// USD/VND conversion).
// No auth required for public ticker endpoints.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }    from '../../../core/BaseService';
import { ServiceType }    from '../../../core/interfaces';
import { BinanceProvider } from '../BinanceProvider';

export interface BinancePricePayload {
  symbol:   string;    // e.g. 'BTCUSDT', 'ETHUSDT'
  action?:  'price' | 'ticker24h' | 'bookTicker';
}

export class PriceFeedService extends BaseService {
  constructor(private readonly provider: BinanceProvider) {
    super(ServiceType.PRICE_FEED, 'Binance Price Feed', 'BINANCE');
  }

  async call(payload: unknown, _prisma?: unknown): Promise<unknown> {
    const p = payload as BinancePricePayload;
    switch (p.action ?? 'price') {
      case 'price':       return this.getPrice(p.symbol);
      case 'ticker24h':   return this.get24hTicker(p.symbol);
      case 'bookTicker':  return this.getBookTicker(p.symbol);
      default:
        throw new Error(`Binance PriceFeedService: unknown action "${p.action}"`);
    }
  }

  /** Get latest price for a symbol. */
  async getPrice(symbol: string): Promise<number> {
    const res = await this.provider.callApi<{ price: string }>({
      method: 'GET',
      url:    '/api/v3/ticker/price',
      params: { symbol },
    });
    return parseFloat(res.price);
  }

  /** Get 24-hour rolling window price change statistics. */
  async get24hTicker(symbol: string): Promise<unknown> {
    return this.provider.callApi({
      method: 'GET',
      url:    '/api/v3/ticker/24hr',
      params: { symbol },
    });
  }

  /** Get best bid/ask price. */
  async getBookTicker(symbol: string): Promise<unknown> {
    return this.provider.callApi({
      method: 'GET',
      url:    '/api/v3/ticker/bookTicker',
      params: { symbol },
    });
  }

  /** Get prices for multiple symbols at once (batch). */
  async getBatchPrices(symbols: string[]): Promise<Record<string, number>> {
    const results = await Promise.all(symbols.map((s) => this.getPrice(s).catch(() => 0)));
    return Object.fromEntries(symbols.map((s, i) => [s, results[i]!]));
  }
}
