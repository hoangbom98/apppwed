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

// ── Job: Trade — liquidation check every 30s ─────────────────────────────────
async function tradeLiquidationCheck() {
  try {
    const { getPrismaClient } = require('./databases');
    const { runLiquidationCheck } = require('../modules/trade/jobs/liquidation.job');
    const tradePrisma = getPrismaClient('trade');
    const notifSvc   = require('../shared/services/notificationService');
    await runLiquidationCheck(tradePrisma, notifSvc._io || null);
  } catch (err) {
    logger.error('tradeLiquidationCheck failed', { err: err.message });
  }
}

// ── Job: Trade — profit distribution daily 00:05 UTC ─────────────────────────
async function tradeProfitDistribution() {
  try {
    const { getPrismaClient } = require('./databases');
    const { runProfitDistribution } = require('../modules/trade/jobs/profitDistribution.job');
    const tradePrisma = getPrismaClient('trade');
    const notifSvc   = require('../shared/services/notificationService');
    await runProfitDistribution(tradePrisma, notifSvc._io || null);
  } catch (err) {
    logger.error('tradeProfitDistribution failed', { err: err.message });
  }
}

// ── Job: Mining — daily income 01:00 UTC ──────────────────────────────────────
async function tradeMiningDistribution() {
  try {
    const { getPrismaClient } = require('./databases');
    const { runMiningDistribution } = require('../modules/trade/jobs/miningDistribution.job');
    const tradePrisma = getPrismaClient('trade');
    await runMiningDistribution(tradePrisma, require('../shared/services/notificationService')._io || null);
  } catch (err) {
    logger.error('tradeMiningDistribution failed', { err: err.message });
  }
}

// ── Job: Yuebao — auto-settle matured at 02:00 UTC ───────────────────────────
async function tradeYuebaoSettlement() {
  try {
    const { getPrismaClient } = require('./databases');
    const { runYuebaoSettlement } = require('../modules/trade/jobs/yuebaoSettlement.job');
    const tradePrisma = getPrismaClient('trade');
    await runYuebaoSettlement(tradePrisma, require('../shared/services/notificationService')._io || null);
  } catch (err) {
    logger.error('tradeYuebaoSettlement failed', { err: err.message });
  }
}

// ── Job: Game rebate — calculate end-of-day 23:55 UTC ────────────────────────
// Dispatches to BullMQ game-rebate worker (falls back to direct if Redis down)
async function gameRebateCalculate() {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Try BullMQ first (reliable, non-blocking)
    let dispatched = false;
    try {
      const { Queue } = require('bullmq');
      const IORedis   = require('ioredis');
      const conn = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null, lazyConnect: true });
      await conn.connect();
      const q = new Queue('game-rebate', { connection: conn });
      await q.add('calculate', { action: 'calculate', betDate: today });
      await conn.quit();
      dispatched = true;
      logger.info(`[RebateCron] dispatched calculate job to BullMQ for ${today}`);
    } catch { /* Redis unavailable — fall through to direct */ }

    if (!dispatched) {
      const { getPrismaClient } = require('./databases');
      const RebateService = require('../shared/services/rebateService');
      const rebateSvc = new RebateService(getPrismaClient('game'), logger);
      const { created, totalAmount } = await rebateSvc.calculateDailyRebates(today);
      if (created > 0) logger.info(`[RebateCron] calculated ${created} pending rebates, total=${totalAmount.toString()}`);
    }
  } catch (err) {
    logger.error('gameRebateCalculate failed', { err: err.message });
  }
}

// ── Job: Game rebate — settle claimable 01:00 UTC (T+1) ─────────────────────
// Dispatches to BullMQ game-rebate worker (falls back to direct if Redis down)
async function gameRebateSettle() {
  try {
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })();
    let dispatched = false;
    try {
      const { Queue } = require('bullmq');
      const IORedis   = require('ioredis');
      const conn = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null, lazyConnect: true });
      await conn.connect();
      const q = new Queue('game-rebate', { connection: conn });
      await q.add('settle', { action: 'settle', betDate: yesterday });
      await conn.quit();
      dispatched = true;
      logger.info(`[RebateCron] dispatched settle job to BullMQ for ${yesterday}`);
    } catch { /* Redis unavailable — fall through */ }

    if (!dispatched) {
      const { getPrismaClient } = require('./databases');
      const RebateService = require('../shared/services/rebateService');
      const rebateSvc = new RebateService(getPrismaClient('game'), logger);
      const { settled, totalAmount } = await rebateSvc.settleDailyRebates(yesterday);
      if (settled > 0) logger.info(`[RebateCron] settled ${settled} rebates as claimable, total=${totalAmount.toString()}`);
    }
  } catch (err) {
    logger.error('gameRebateSettle failed', { err: err.message });
  }
}

// ── Job: Game VIP check — upgrade users who hit totalBet threshold — daily 02:30 UTC ──
// Re-check all users: if totalBet >= next VIP threshold → upgrade + grant reward
async function gameVipLevelCheck() {
  try {
    const { getPrismaClient } = require('./databases');
    const gamePrisma = getPrismaClient('game');

    // Get all VIP level thresholds (sorted ascending)
    const vipLevels = await gamePrisma.vipLevel.findMany({
      where: { status: 'active' },
      select: { id: true, level: true, minTotalDeposit: true, cashbackRate: true },
      orderBy: { level: 'asc' },
    });

    if (vipLevels.length === 0) return;
    const maxLevel = vipLevels[vipLevels.length - 1].level;

    // Find users below max VIP level
    const users = await gamePrisma.user.findMany({
      where: { status: 'active', vipLevel: { lt: maxLevel } },
      select: { id: true, vipLevel: true, totalDeposit: true },
    });

    let upgraded = 0;
    for (const user of users) {
      // Find highest level user qualifies for
      let newLevel = user.vipLevel;
      for (const vl of vipLevels) {
        if (vl.level > user.vipLevel && user.totalDeposit.gte(vl.minTotalDeposit)) {
          newLevel = vl.level;
        }
      }
      if (newLevel <= user.vipLevel) continue;

      await gamePrisma.user.update({
        where: { id: user.id },
        data: { vipLevel: newLevel },
      });
      upgraded++;
      logger.info(`[VipCron] userId=${user.id} upgraded vip ${user.vipLevel} → ${newLevel}`);
    }

    if (upgraded > 0) logger.info(`[VipCron] Upgraded ${upgraded} users`);
  } catch (err) {
    logger.error('gameVipLevelCheck failed', { err: err.message });
  }
}

// ── Register all jobs ────────────────────────────────────────────────────────
function register() {
  schedule('*/14 * * * *',   'keep-alive',               keepAlive);
  schedule('*/5 * * * *',    'clear-expired-cache',      clearExpiredCache);
  schedule('*/10 * * * *',   'health-snapshot',          healthSnapshot);
  schedule('*/30 * * * *',   'batch-risk-scoring',       batchRiskScoring);
  schedule('0 * * * *',      'vip-expiry',               processVipExpiry);
  schedule('0 */6 * * *',    'purge-ip-blacklist',       purgeExpiredIpBlacklist);
  schedule('0 2 * * *',      'adaptive-limits',          adaptiveLimitsJob);
  schedule('0 3 * * *',      'clean-audit-logs',         cleanAuditLogs);
  schedule('0 4 * * *',      'clean-security-logs',      cleanSecurityLogs);
  schedule('0 0 * * *',      'reset-daily-flags',        resetDailyFlags);
  // 6-part expression (node-cron ≥ 3): seconds-level scheduling
  schedule('*/30 * * * * *', 'trade-price-feed',         syncTradePrices);
  schedule('* * * * *',      'sports-live-scores',       syncSportsLiveScores);
  schedule('*/30 * * * * *', 'trade-liquidation',        tradeLiquidationCheck);
  schedule('5 0 * * *',      'trade-profit-distribution', tradeProfitDistribution);
  schedule('0 1 * * *',      'trade-mining-distribution', tradeMiningDistribution);
  schedule('0 2 * * *',      'trade-yuebao-settlement',   tradeYuebaoSettlement);
  // Game rebate (learned from BoYue RebateService)
  schedule('55 23 * * *',    'game-rebate-calculate',    gameRebateCalculate);
  schedule('0 1 * * *',      'game-rebate-settle',       gameRebateSettle);
  schedule('30 2 * * *',     'game-vip-check',           gameVipLevelCheck);
  logger.info('All cron jobs registered (risk + price-feed + live-scores + trade + mining + yuebao + game-rebate + vip-check)');
}

module.exports = { register };
