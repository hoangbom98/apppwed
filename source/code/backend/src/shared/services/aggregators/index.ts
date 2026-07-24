// source/backend/src/shared/services/aggregators/index.js
'use strict';
/**
 * Aggregator Factory — thin bridge to the new ThirdParty ServiceRegistry.
 *
 * ARCHITECTURE
 * ─────────────────────────────────────────────────────────────────────────────
 * The canonical implementation now lives in:
 *   src/third-parties/core/ServiceRegistry.ts
 *
 * Credentials are stored once (game_db.gameAggregator) and shared across ALL
 * sub-projects. The `prisma` argument injected at call-time (not at construction)
 * determines which project DB is used for balance/bet/win callbacks.
 *
 * Aggregator (GSC / Goldgate / TCGaming / Binance / …)
 *   └─ Products/Vendors (CQ9, JILI, PG Soft, SBO, Evolution, …)
 *         └─ Games (individual titles)
 *
 * USAGE (new style — preferred):
 *   const { ServiceRegistry, ServiceType } = require('../../third-parties');
 *   const registry = ServiceRegistry.getInstance();
 *   const svc = registry.getService('GOLDGATE', ServiceType.GAME_API);
 *   await svc.call({ userId, gameCode }, req.prisma);   // req.prisma = game_db or sports_db
 *
 * USAGE (legacy bridge — backward compatible):
 *   const { getAggregator } = require('../../../shared/services/aggregators');
 *   const gg = await getAggregator('GOLDGATE');
 *   await gg.launchGame(userId, gameCode, vendorCode);
 *
 * New code SHOULD use the ServiceRegistry directly.
 * Existing game/sports module code using getAggregator() keeps working unchanged.
 */

const { ServiceRegistry }   = require('../../third-parties/core/ServiceRegistry');
const GSCService             = require('./GSCService');      // legacy class (still used by old game routes)
const GoldgateService        = require('./GoldgateService');
const TCGamingService        = require('./TCGamingService');
const { getPrismaClient }    = require('../../config/databases');

// ── Legacy cache (backward compat) ────────────────────────────────────────────
const _cache = {};

/**
 * Get (or create & cache) an aggregator service instance.
 *
 * Tries the new ServiceRegistry first (O(1) lookup, no DB call).
 * Falls back to the old direct-DB path if the registry is not yet loaded
 * or the code is not in it (e.g. a custom legacy provider).
 *
 * @param {string} aggregatorCode  'GSC' | 'GOLDGATE' | 'TCGAMING' | …
 * @returns {Promise<object>} provider / service instance
 */
async function getAggregator(aggregatorCode) {
  const code = aggregatorCode.toUpperCase();

  // ── Fast path: ServiceRegistry already loaded ────────────────────────────
  const registry = ServiceRegistry.getInstance();
  const provider = registry.getProvider(code);
  if (provider) return provider;

  // ── Slow path: legacy direct-DB bootstrap (for old code still using this) ─
  if (_cache[code]) return _cache[code];

  const gamePrisma = getPrismaClient('game');
  const config     = await gamePrisma.gameAggregator.findFirst({
    where: { code, status: 'active' },
  });

  if (!config) throw new Error(`Aggregator "${code}" not found or inactive in game_db.gameAggregator`);

  let service;
  switch (code) {
    case 'GSC':      service = new GSCService(config);      break;
    case 'GOLDGATE': service = new GoldgateService(config); break;
    case 'TCGAMING': service = new TCGamingService(config); break;
    default: throw new Error(`Aggregator "${code}" is not supported`);
  }

  _cache[code] = service;
  setTimeout(() => { delete _cache[code]; }, 5 * 60 * 1000);
  return service;
}

/**
 * Clear the aggregator cache and the ServiceRegistry provider cache.
 * Call this after an admin updates aggregator credentials.
 * @param {string} [code]  Specific code to clear, or omit for all.
 */
async function clearCache(code) {
  if (code) {
    delete _cache[code.toUpperCase()];
    const registry = ServiceRegistry.getInstance();
    try { await registry.reloadProvider(code); } catch { /* provider may not be in registry yet */ }
  } else {
    Object.keys(_cache).forEach((k) => delete _cache[k]);
  }
}

// Keep named class exports for legacy callers that use e.g. new GoldgateService(config)
const GSCProvider = GSCService;
module.exports = { getAggregator, clearCache, GSCService, GSCProvider, GoldgateService, TCGamingService };
