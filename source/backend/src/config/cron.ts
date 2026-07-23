'use strict';
/**
 * src/config/cron.js — Scheduled cron jobs for the LKVIP GROUP.
 * Gracefully skips if node-cron is not installed.
 *
 * All require() calls inside job functions use paths RELATIVE TO THIS FILE
 * (src/config/):
 *   ./databases  → src/config/databases.js
 *   ../shared/services/... → shared services
 *   ../risk/...  → risk module
 *   ../shared/socket/handlers → socket helpers
 */

let cron;
try { cron = require('node-cron'); } catch { cron = null; }

const logger = require('../shared/services/logger');
const cache  = require('../shared/services/cacheService');

// ── Helper: schedule with error isolation ───────────────────────────────────
function schedule(expression, name, fn) {
  if (!cron) {
    logger.warn(`node-cron not installed — skipping job "${name}". Run: npm install node-cron`);
    return null;
  }
  const task = cron.schedule(expression, async () => {
    const start = Date.now();
    try {
      await fn();
      logger.info(`Cron "${name}" completed in ${Date.now() - start}ms`);
    } catch (err) {
      logger.error(`Cron "${name}" failed`, { err: err.message });
    }
  });
  logger.info(`Cron "${name}" scheduled: ${expression}`);
  return task;
}

// ── Job: Clear expired cache keys — every 5 minutes ─────────────────────────
async function clearExpiredCache() {
  await cache.flush('expired');
}

// ── Job: Reset daily checkin flags — midnight ────────────────────────────────
async function resetDailyFlags() {
  await cache.del('daily:*');
  logger.info('Daily flags reset');
}

// ── Job: Log system health snapshot — every 10 minutes ──────────────────────
async function healthSnapshot() {
  const mem = process.memoryUsage();
  const cacheMetrics = cache.getMetrics ? cache.getMetrics() : {};
  logger.info('health_snapshot', {
    rss:    `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heap:   `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    uptime: `${Math.round(process.uptime())}s`,
    cache:  cacheMetrics,
  });
}

// ── Job: Clean old audit logs (>90 days, info-level) — daily 3 AM ───────────
async function cleanAuditLogs() {
  try {
    const { getPrismaClient } = require('./databases');
    const prisma  = getPrismaClient('admin');
    const cutoff  = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const { count } = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff }, status: { in: ['info', 'success'] } },
    });
    if (count > 0) logger.info(`Cleaned ${count} old audit logs`);
  } catch (err) {
    logger.error('cleanAuditLogs failed', { err: err.message });
  }
}

// ── Job: Purge expired IP blacklist — every 6 hours ──────────────────────────
async function purgeExpiredIpBlacklist() {
  try {
    const { getPrismaClient } = require('./databases');
    const prisma = getPrismaClient('admin');
    const { count } = await prisma.ipBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) logger.info(`Purged ${count} expired IP blacklist entries`);
  } catch (err) {
    logger.error('purgeExpiredIpBlacklist failed', { err: err.message });
  }
}

// ── Job: Batch risk score recalculation — every 30 minutes ──────────────────
async function batchRiskScoring() {
  try {
    const { getPrismaClient } = require('./databases');
    const prisma     = getPrismaClient('admin');
    const RiskScorer = require('../risk/riskScorer');
    const riskScorer = new RiskScorer(prisma);
    const processed  = await riskScorer.runBatch(500);
    if (processed > 0) logger.info(`[RiskCron] batch scored ${processed} users`);
  } catch (err) {
    logger.error('batchRiskScoring failed', { err: err.message });
  }
}

// ── Job: Adaptive rate-limit adjustment — daily 2 AM ────────────────────────
async function adaptiveLimitsJob() {
  try {
    const { getPrismaClient } = require('./databases');
    const prisma         = getPrismaClient('admin');
    const AdaptiveLimits = require('../risk/adaptiveLimits');
    const al             = new AdaptiveLimits(prisma);
    const updated        = await al.runBatchAdjustment();
    logger.info(`[RiskCron] adaptive limits updated for ${updated} users`);
  } catch (err) {
    logger.error('adaptiveLimitsJob failed', { err: err.message });
  }
}

// ── Job: Clean old security logs (>30 days, low/medium) — daily 4 AM ────────
async function cleanSecurityLogs() {
  try {
    const { getPrismaClient } = require('./databases');
    const prisma  = getPrismaClient('admin');
    const cutoff  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count } = await prisma.securityLog.deleteMany({
      where: { createdAt: { lt: cutoff }, severity: { in: ['low', 'medium'] } },
    });
    if (count > 0) logger.info(`[RiskCron] cleaned ${count} old security logs`);
  } catch (err) {
    logger.error('cleanSecurityLogs failed', { err: err.message });
  }
}

// ── Job: VIP expiry — every hour ─────────────────────────────────────────────
// Dating: VipMembership (status, endDate)
// Game:   managed by plan duration — no expiry field needed
async function processVipExpiry() {
  try {
    const { getPrismaClient } = require('./databases');
    const datingPrisma  = getPrismaClient('dating');
    const expiredDating = await datingPrisma.vipMembership.findMany({
      where: { status: 'active', endDate: { lt: new Date() } },
      select: { id: true, userId: true },
    });
    for (const vm of expiredDating) {
      await datingPrisma.$transaction([
        datingPrisma.vipMembership.update({ where: { id: vm.id }, data: { status: 'expired' } }),
        datingPrisma.user.update({ where: { id: vm.userId }, data: { isVip: false } }),
      ]);
    }
    if (expiredDating.length > 0)
      logger.info(`Expired ${expiredDating.length} dating VIP memberships`);
  } catch (err) {
    logger.error('processVipExpiry failed', { err: err.message });
  }
}

// ── Job: Trade price feed (CoinGecko + Alpha Vantage) — every 30 seconds ────
// Disabled by default. Set ENABLE_PRICE_FEED=true in .env to activate.
async function syncTradePrices() {
  if (process.env.ENABLE_PRICE_FEED !== 'true') return;
  try {
    const { getPrismaClient } = require('./databases');
    const tradePrisma    = getPrismaClient('trade');

    // ── Crypto: CoinGecko ───────────────────────────────────────────────────
    const cryptoSymbols = await tradePrisma.symbol.findMany({
      where: { status: 'active', market: { type: 'crypto' } },
      include: { market: true },
      take: 50,
    });

    if (cryptoSymbols.length > 0) {
      const ids  = cryptoSymbols.map(s => (s.baseAsset || s.code.split('/')[0]).toLowerCase()).join(',');
      const base = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
      const url  = `${base}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (resp.ok) {
        const data = await resp.json();
        const now  = new Date();
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

          // Emit real-time price update via Socket.IO
          const notifSvc = require('../shared/services/notificationService');
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

    // ── Forex: Alpha Vantage (only when key is configured) ─────────────────
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      const forexSymbols = await tradePrisma.symbol.findMany({
        where: { status: 'active', market: { type: 'forex' } },
        take: 5, // Free tier: 5 req/min
      });
      for (const sym of forexSymbols) {
        try {
          const [from, to] = (sym.code || 'EUR/USD').split('/');
          const avUrl  = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to || 'USD'}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
          const avResp = await fetch(avUrl, { signal: AbortSignal.timeout(6000) });
          if (!avResp.ok) continue;
          const avData = await avResp.json();
          const rate   = parseFloat(avData?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate']);
          if (!rate) continue;
          const now = new Date();
          await tradePrisma.priceHistory.create({
            data: { symbolId: sym.id, price: rate, open: rate, high: rate, low: rate, close: rate, volume: 0, interval: '1m', timestamp: now },
          });
        } catch { /* skip individual symbol on error */ }
      }
    }

  } catch (err) {
    logger.error('syncTradePrices failed', { err: err.message });
  }
}

// ── Job: Sports live-score stub — every 1 minute ─────────────────────────────
// Randomly generates goal events for LIVE matches.
// Replace body with a real provider (Football-Data.org) once API key is set.
async function syncSportsLiveScores() {
  try {
    const { getPrismaClient }  = require('./databases');
    const { emitMatchUpdate }  = require('../shared/socket/handlers');
    const notifSvc             = require('../shared/services/notificationService');
    const sportsPrisma         = getPrismaClient('sports');
    const io                   = notifSvc._io;

    const liveMatches = await sportsPrisma.match.findMany({
      where: { status: 'live' },
      select: { id: true, homeScore: true, awayScore: true },
    });

    for (const match of liveMatches) {
      const delta = Math.random() < 0.1; // 10% chance per tick
      if (!delta) continue;

      const homeGoal = Math.random() < 0.5;
      const newHome  = (match.homeScore ?? 0) + (homeGoal ? 1 : 0);
      const newAway  = (match.awayScore ?? 0) + (!homeGoal ? 1 : 0);

      await sportsPrisma.$transaction([
        sportsPrisma.match.update({ where: { id: match.id }, data: { homeScore: newHome, awayScore: newAway } }),
        sportsPrisma.liveScore.create({
          data: { matchId: match.id, homeScore: newHome, awayScore: newAway, event: homeGoal ? 'GOAL_HOME' : 'GOAL_AWAY', eventDetail: `Score: ${newHome}-${newAway}` },
        }),
        sportsPrisma.liveUpdate.create({
          data: { matchId: match.id, type: 'goal', team: homeGoal ? 'home' : 'away', description: `Goal! Score now ${newHome}-${newAway}`, time: String(Math.floor(Math.random() * 90) + 1) },
        }),
      ]);

      if (io) {
        if (emitMatchUpdate) emitMatchUpdate(io, match.id, { homeScore: newHome, awayScore: newAway, event: homeGoal ? 'GOAL_HOME' : 'GOAL_AWAY' });
        else io.to(`match_${match.id}`).emit('match_update', { matchId: match.id, homeScore: newHome, awayScore: newAway });
      }
    }
    if (liveMatches.length > 0) logger.debug(`[SportsCron] processed ${liveMatches.length} live matches`);
  } catch (err) {
    logger.error('syncSportsLiveScores failed', { err: err.message });
  }
}

// ── Job: Keep-alive self-ping — every 14 minutes (production only) ───────────
async function keepAlive() {
  const appUrl = process.env.APP_URL;
  if (!appUrl || process.env.NODE_ENV !== 'production') return;
  try {
    const res = await fetch(`${appUrl}/health/live`, { signal: AbortSignal.timeout(5000) });
    logger.debug(`[KeepAlive] ping → ${res.status}`);
  } catch (err) {
    logger.warn(`[KeepAlive] ping failed: ${err.message}`);
  }
}

// ── Job: Trade liquidation scan — every 10 seconds ───────────────────────────
async function tradeLiquidationScan() {
  try {
    const { getPrismaClient } = require('./databases');
    const tradePrisma     = getPrismaClient('trade');
    const LiquidationSvc  = require('../modules/trade/services/liquidationService');
    const notifSvc        = require('../shared/services/notificationService');
    const svc             = new LiquidationSvc(tradePrisma, notifSvc._io);
    await svc.runFullScan();
  } catch (err) {
    logger.error('tradeLiquidationScan failed', { err: err.message });
  }
}

// ── Job: Trade daily profit distribution — daily 00:05 ───────────────────────
async function tradeDailyProfitDistribution() {
  try {
    const { getPrismaClient } = require('./databases');
    const tradePrisma = getPrismaClient('trade');
    const InvestSvc   = require('../modules/trade/services/investmentService');
    const svc         = new InvestSvc(tradePrisma);
    const result      = await svc.distributeDailyProfits();
    logger.info(`[TradeInvestCron] profits distributed: ${result.processed} investments, ${result.totalPaid.toFixed(2)} USD`);
  } catch (err) {
    logger.error('tradeDailyProfitDistribution failed', { err: err.message });
  }
}

// ── Register all jobs ────────────────────────────────────────────────────────
function register() {
  schedule('*/14 * * * *',   'keep-alive',                    keepAlive);
  schedule('*/5 * * * *',    'clear-expired-cache',           clearExpiredCache);
  schedule('*/10 * * * *',   'health-snapshot',               healthSnapshot);
  schedule('*/30 * * * *',   'batch-risk-scoring',            batchRiskScoring);
  schedule('0 * * * *',      'vip-expiry',                    processVipExpiry);
  schedule('0 */6 * * *',    'purge-ip-blacklist',            purgeExpiredIpBlacklist);
  schedule('0 2 * * *',      'adaptive-limits',               adaptiveLimitsJob);
  schedule('0 3 * * *',      'clean-audit-logs',              cleanAuditLogs);
  schedule('0 4 * * *',      'clean-security-logs',           cleanSecurityLogs);
  schedule('0 0 * * *',      'reset-daily-flags',             resetDailyFlags);
  schedule('5 0 * * *',      'trade-profit-distribution',     tradeDailyProfitDistribution);
  // 6-part expression (node-cron ≥ 3): seconds-level scheduling
  schedule('*/10 * * * * *', 'trade-liquidation',             tradeLiquidationScan);
  schedule('*/30 * * * * *', 'trade-price-feed',              syncTradePrices);
  schedule('* * * * *',      'sports-live-scores',            syncSportsLiveScores);
  logger.info('All cron jobs registered (risk + price-feed + live-scores + trade-liquidation + trade-profit)');
}

module.exports = { register };
