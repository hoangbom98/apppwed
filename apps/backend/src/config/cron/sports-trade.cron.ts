/**
 * config/cron/sports-trade.cron.ts — Sports & Trade domain scheduled jobs.
 *
 * Jobs:
 *   trade-price-feed          every 30s    CoinGecko + Alpha Vantage (ENABLE_PRICE_FEED=true)
 *   rollup-price-history      daily 03:30  1m→1h→1d candle roll-up
 *   trade-liquidation         every 30s    check margin positions
 *   trade-profit-distribution daily 00:05  daily profit dist
 *   trade-mining-distribution daily 01:00  mining income
 *   trade-savingsVault        daily 02:00  settle matured vaults
 *   sports-live-scores        every 30s    ApiFootball live score sync
 *   sports-fixtures           every 6 h    fixtures sync (today + tomorrow)
 *   sports-standings          daily 03:00  standings sync
 *   sports-news               every 30 min news sync (vi, 10 articles)
 */

import { logger } from '../../shared/services/core/logger';
import { getPrismaClient } from '../databases';

// ── Trade jobs ────────────────────────────────────────────────────────────────

export async function syncTradePrices(): Promise<void> {
  if (process.env.ENABLE_PRICE_FEED !== 'true') return;
  try {
    const tradePrisma = getPrismaClient('trade');

    // CoinGecko — crypto
    const cryptoSymbols = await tradePrisma.symbol.findMany({
      where: { status: 'active', market: { type: 'crypto' } },
      include: { market: true },
      take: 50,
    });

    if (cryptoSymbols.length > 0) {
      const ids  = cryptoSymbols.map((s: any) => (s.baseAsset || s.code.split('/')[0]).toLowerCase()).join(',');
      const base = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
      const url  = `${base}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (resp.ok) {
        const data = await resp.json() as Record<string, any>;
        const now  = new Date();
        const notifSvc = require('../../shared/services/communication/notificationService');
        for (const sym of cryptoSymbols) {
          const coinId = (sym.baseAsset || sym.code.split('/')[0]).toLowerCase();
          const price  = data[coinId]?.usd;
          if (!price) continue;
          await tradePrisma.priceHistory.create({
            data: {
              symbolId: sym.id, price,
              open: price, high: price, low: price, close: price,
              volume:   data[coinId]?.usd_24h_vol ?? 0,
              interval: '1m', timestamp: now,
            },
          });
          if (notifSvc._io) {
            notifSvc._io.emit('price:update', {
              symbol: sym.code, price,
              change24h: data[coinId]?.usd_24h_change ?? null,
              updatedAt: now,
            });
          }
        }
      }
    }

    // Alpha Vantage — forex
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      const forexSymbols = await tradePrisma.symbol.findMany({
        where: { status: 'active', market: { type: 'forex' } },
        take: 5,
      });
      for (const sym of forexSymbols) {
        try {
          const [from, to] = (sym.code || 'EUR/USD').split('/');
          const avUrl  = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to || 'USD'}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
          const avResp = await fetch(avUrl, { signal: AbortSignal.timeout(6000) });
          if (!avResp.ok) continue;
          const avData = await avResp.json() as Record<string, any>;
          const rate   = parseFloat(avData?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate']);
          if (!rate) continue;
          const now = new Date();
          await tradePrisma.priceHistory.create({
            data: { symbolId: sym.id, price: rate, open: rate, high: rate, low: rate, close: rate, volume: 0, interval: '1m', timestamp: now },
          });
        } catch { /* skip individual symbol */ }
      }
    }
  } catch (err: any) {
    logger.error('syncTradePrices failed', { err: err.message });
  }
}

export async function rollupPriceHistory(): Promise<void> {
  if (process.env.ENABLE_PRICE_FEED !== 'true') return;
  try {
    const tradePrisma     = getPrismaClient('trade');
    const MarketPriceFeed = require('../../modules/trade/services/marketPriceFeed');
    const feed = new MarketPriceFeed(tradePrisma, null);
    await feed.rollupPriceHistory();
  } catch (err: any) {
    logger.error('rollupPriceHistory cron failed', { err: err.message });
  }
}

export async function tradeLiquidationCheck(): Promise<void> {
  try {
    const { runLiquidationCheck } = require('../../modules/trade/jobs/liquidation.job');
    const tradePrisma = getPrismaClient('trade');
    const notifSvc   = require('../../shared/services/communication/notificationService');
    await runLiquidationCheck(tradePrisma, notifSvc._io || null);
  } catch (err: any) {
    logger.error('tradeLiquidationCheck failed', { err: err.message });
  }
}

export async function tradeProfitDistribution(): Promise<void> {
  try {
    const { runProfitDistribution } = require('../../modules/trade/jobs/profitDistribution.job');
    const tradePrisma = getPrismaClient('trade');
    const notifSvc   = require('../../shared/services/communication/notificationService');
    await runProfitDistribution(tradePrisma, notifSvc._io || null);
  } catch (err: any) {
    logger.error('tradeProfitDistribution failed', { err: err.message });
  }
}

export async function tradeMiningDistribution(): Promise<void> {
  try {
    const { runMiningDistribution } = require('../../modules/trade/jobs/miningDistribution.job');
    const tradePrisma = getPrismaClient('trade');
    const notifSvc   = require('../../shared/services/communication/notificationService');
    await runMiningDistribution(tradePrisma, notifSvc._io || null);
  } catch (err: any) {
    logger.error('tradeMiningDistribution failed', { err: err.message });
  }
}

export async function tradeSavingsVaultSettlement(): Promise<void> {
  try {
    const { runSavingsVaultSettlement } = require('../../modules/trade/jobs/savingsVaultSettlement.job');
    const tradePrisma = getPrismaClient('trade');
    const notifSvc   = require('../../shared/services/communication/notificationService');
    await runSavingsVaultSettlement(tradePrisma, notifSvc._io || null);
  } catch (err: any) {
    logger.error('tradeSavingsVaultSettlement failed', { err: err.message });
  }
}

// ── Sports jobs ───────────────────────────────────────────────────────────────

export async function syncSportsLiveScores(): Promise<void> {
  try {
    const sportsPrisma          = getPrismaClient('sports');
    const SportsDataSyncService = require('../../modules/sports/services/sportsDataSyncService');
    const svc = new SportsDataSyncService(sportsPrisma);
    await svc.syncLiveScores();
  } catch (err: any) {
    logger.error('[SportsCron] syncLiveScores failed', { err: err.message });
  }
}

export async function syncSportsFixtures(): Promise<void> {
  try {
    const sportsPrisma          = getPrismaClient('sports');
    const SportsDataSyncService = require('../../modules/sports/services/sportsDataSyncService');
    const svc = new SportsDataSyncService(sportsPrisma);
    const result = await svc.syncFixtures(1);
    logger.info(`[SportsCron] fixtures sync: ${JSON.stringify(result)}`);
  } catch (err: any) {
    logger.warn('[SportsCron] syncFixtures unavailable', { err: err.message });
  }
}

export async function syncSportsStandings(): Promise<void> {
  try {
    const sportsPrisma          = getPrismaClient('sports');
    const SportsDataSyncService = require('../../modules/sports/services/sportsDataSyncService');
    const svc = new SportsDataSyncService(sportsPrisma);
    const result = await svc.syncStandings();
    logger.info(`[SportsCron] standings sync: ${JSON.stringify(result)}`);
  } catch (err: any) {
    logger.warn('[SportsCron] syncStandings unavailable', { err: err.message });
  }
}

export async function syncSportsNews(): Promise<void> {
  try {
    const sportsPrisma          = getPrismaClient('sports');
    const SportsDataSyncService = require('../../modules/sports/services/sportsDataSyncService');
    const svc = new SportsDataSyncService(sportsPrisma);
    const result = await svc.syncNews('vi', 10);
    logger.debug(`[SportsCron] news sync: ${JSON.stringify(result)}`);
  } catch (err: any) {
    logger.warn('[SportsCron] syncNews unavailable', { err: err.message });
  }
}
