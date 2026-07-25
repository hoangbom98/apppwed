/**
 * currencyService.ts — Multi-Currency Engine
 *
 * Responsibilities:
 *  - Maintain an in-memory + Redis-cached exchange rate table (refreshed every 1h)
 *  - Convert amounts between any two supported currencies using Decimal.js precision
 *  - Format amounts for display per locale
 *  - Expose a simple REST handler: GET /api/currencies/rates
 *
 * Supported currencies (extend CURRENCIES_META to add more):
 *   Fiat : USD, VND, EUR, CNY, JPY, KRW, THB, IDR, SGD, MYR
 *   Crypto: BTC, ETH, USDT
 *
 * Exchange rate source:
 *   - Primary  : process.env.EXCHANGE_API_URL (e.g. Open Exchange Rates, ExchangeRate-API)
 *   - Fallback : STATIC_RATES (last-known good rates hard-coded below)
 *
 * Usage:
 *   const { CurrencyService } = require('./currencyService');
 *   const svc = CurrencyService.getInstance();
 *
 *   await svc.init();                                    // call once at startup
 *   const vnd = await svc.convert(100, 'USD', 'VND');   // → 2500000
 *   const fmt = svc.format(100, 'USD');                  // → "$100.00"
 *   const rates = await svc.getRates('USD');             // → { VND: 25000, EUR: 0.92, ... }
 */

import Decimal from 'decimal.js';
import { Request, Response } from 'express';

const cache  = require('./cacheService');
const logger = require('./logger');

// ── Static fallback rates (base = USD) ────────────────────────────────────────
// Updated periodically — used when live API is unavailable
const STATIC_RATES: Record<string, number> = {
  USD: 1,
  VND: 25400,
  EUR: 0.92,
  CNY: 7.26,
  JPY: 157.5,
  KRW: 1380,
  THB: 36.2,
  IDR: 16250,
  SGD: 1.34,
  MYR: 4.71,
  BTC: 0.0000156,
  ETH: 0.000297,
  USDT: 1.0,
};

// ── Currency display metadata ─────────────────────────────────────────────────
interface CurrencyMeta {
  symbol: string;
  name: string;
  decimals: number;
  locale: string;
}

const CURRENCIES_META: Record<string, CurrencyMeta> = {
  USD:  { symbol: '$',    name: 'US Dollar',          decimals: 2, locale: 'en-US' },
  VND:  { symbol: '₫',   name: 'Vietnamese Dong',     decimals: 0, locale: 'vi-VN' },
  EUR:  { symbol: '€',    name: 'Euro',                decimals: 2, locale: 'de-DE' },
  CNY:  { symbol: '¥',   name: 'Chinese Yuan',        decimals: 2, locale: 'zh-CN' },
  JPY:  { symbol: '¥',   name: 'Japanese Yen',        decimals: 0, locale: 'ja-JP' },
  KRW:  { symbol: '₩',   name: 'Korean Won',          decimals: 0, locale: 'ko-KR' },
  THB:  { symbol: '฿',   name: 'Thai Baht',           decimals: 2, locale: 'th-TH' },
  IDR:  { symbol: 'Rp',  name: 'Indonesian Rupiah',   decimals: 0, locale: 'id-ID' },
  SGD:  { symbol: 'S$',  name: 'Singapore Dollar',    decimals: 2, locale: 'en-SG' },
  MYR:  { symbol: 'RM',  name: 'Malaysian Ringgit',   decimals: 2, locale: 'ms-MY' },
  BTC:  { symbol: '₿',   name: 'Bitcoin',             decimals: 8, locale: 'en-US' },
  ETH:  { symbol: 'Ξ',   name: 'Ethereum',            decimals: 6, locale: 'en-US' },
  USDT: { symbol: '₮',   name: 'Tether USD',          decimals: 2, locale: 'en-US' },
};

const RATES_CACHE_KEY = 'currency:rates:usd_base';
const RATES_CACHE_TTL = 3600; // 1 hour

// ── Service ───────────────────────────────────────────────────────────────────

class CurrencyService {
  private static _instance: CurrencyService;
  private _rates: Record<string, number> = { ...STATIC_RATES };
  private _lastUpdated: Date | null = null;

  private constructor() {}

  static getInstance(): CurrencyService {
    if (!CurrencyService._instance) {
      CurrencyService._instance = new CurrencyService();
    }
    return CurrencyService._instance;
  }

  /**
   * Initialise — load rates from cache or live API.
   * Call once at server startup.
   */
  async init(): Promise<void> {
    const cached = await cache.get(RATES_CACHE_KEY).catch(() => null);
    if (cached) {
      this._rates = typeof cached === 'string' ? JSON.parse(cached) : cached;
      logger.info('[Currency] Rates loaded from cache');
      return;
    }
    await this._fetchRates();
  }

  // ── Conversion ──────────────────────────────────────────────────────────────

  /**
   * Convert `amount` from `from` currency to `to` currency.
   * Uses Decimal.js for financial precision (no IEEE 754 rounding errors).
   */
  convert(amount: number, from: string, to: string): number {
    if (from === to) return amount;
    const fromRate = this._rates[from.toUpperCase()];
    const toRate   = this._rates[to.toUpperCase()];
    if (!fromRate || !toRate) {
      throw new Error(`Unsupported currency: ${!fromRate ? from : to}`);
    }
    // Convert to USD base first, then to target
    return new Decimal(amount)
      .dividedBy(fromRate)
      .times(toRate)
      .toDecimalPlaces(CURRENCIES_META[to.toUpperCase()]?.decimals ?? 2)
      .toNumber();
  }

  /**
   * Format an amount as a locale-aware currency string.
   * e.g. format(25400, 'VND') → "25.400 ₫"
   */
  format(amount: number, currency: string): string {
    const meta = CURRENCIES_META[currency.toUpperCase()];
    if (!meta) return `${amount} ${currency}`;
    try {
      return new Intl.NumberFormat(meta.locale, {
        style:                 'currency',
        currency:              currency.toUpperCase(),
        minimumFractionDigits: meta.decimals,
        maximumFractionDigits: meta.decimals,
      }).format(amount);
    } catch {
      return `${meta.symbol}${amount.toFixed(meta.decimals)}`;
    }
  }

  // ── Rate retrieval ──────────────────────────────────────────────────────────

  /**
   * Return all rates relative to a base currency (default: USD).
   */
  getRates(baseCurrency = 'USD'): Record<string, number> {
    const base = baseCurrency.toUpperCase();
    const baseRate = this._rates[base];
    if (!baseRate) throw new Error(`Unknown base currency: ${baseCurrency}`);
    const result: Record<string, number> = {};
    for (const [code, rate] of Object.entries(this._rates)) {
      result[code] = new Decimal(rate).dividedBy(baseRate).toDecimalPlaces(8).toNumber();
    }
    return result;
  }

  getSupportedCurrencies(): Array<{ code: string } & CurrencyMeta> {
    return Object.entries(CURRENCIES_META).map(([code, meta]) => ({ code, ...meta }));
  }

  get lastUpdated(): Date | null { return this._lastUpdated; }

  // ── Express route handler ───────────────────────────────────────────────────

  /**
   * GET /api/currencies/rates?base=USD
   * Returns all exchange rates relative to the requested base currency.
   */
  httpGetRates(req: Request, res: Response): void {
    try {
      const base = (req.query['base'] as string | undefined)?.toUpperCase() ?? 'USD';
      const rates = this.getRates(base);
      res.json({
        success: true,
        data: {
          base,
          rates,
          currencies: this.getSupportedCurrencies(),
          updatedAt: this._lastUpdated?.toISOString() ?? null,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Currency error';
      res.status(400).json({ success: false, error: { code: 'CURRENCY_ERROR', message: msg } });
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private async _fetchRates(): Promise<void> {
    const apiUrl   = process.env.EXCHANGE_API_URL;
    const apiKey   = process.env.EXCHANGE_API_KEY;
    if (!apiUrl) {
      logger.warn('[Currency] EXCHANGE_API_URL not set — using static fallback rates');
      return;
    }
    try {
      const url = `${apiUrl}${apiKey ? `?apikey=${apiKey}` : ''}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json() as Record<string, unknown>;
      // Support common shapes: { rates: {...} } or { conversion_rates: {...} }
      const raw = (json['rates'] ?? json['conversion_rates']) as Record<string, number> | undefined;
      if (!raw || typeof raw !== 'object') throw new Error('Unexpected API response shape');
      // Merge live rates with static (static covers anything not in live feed)
      this._rates = { ...STATIC_RATES, ...raw };
      this._lastUpdated = new Date();
      await cache.set(RATES_CACHE_KEY, JSON.stringify(this._rates), RATES_CACHE_TTL);
      logger.info(`[Currency] Live rates fetched — ${Object.keys(this._rates).length} currencies`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`[Currency] Live rate fetch failed (${msg}) — using static fallback`);
      this._rates = { ...STATIC_RATES };
    }
  }
}

export { CurrencyService };
module.exports = { CurrencyService };
