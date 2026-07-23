// source/backend/src/shared/services/aggregators/index.js
'use strict';
/**
 * Aggregator Factory
 *
 * Resolves and returns a configured aggregator service instance.
 * Aggregators (GSC, Goldgate, TC Gaming) are API gateways that connect to
 * many underlying game vendors/products (CQ9, JILI, PG Soft, SBO, etc.).
 *
 * Architecture:
 *   Aggregator (GSC / Goldgate / TCGaming)
 *     └─ Products/Vendors (CQ9, JILI, PG Soft, SBO, Evolution, ...)
 *           └─ Games (individual game titles)
 *
 * Aggregator configs are stored in game_db → gameAggregator table.
 * The `prisma` argument for wallet callbacks must be the calling module's client:
 *   – game module  → game_db prisma client
 *   – sports module → sports_db prisma client
 *
 * Usage:
 *   const { getAggregator } = require('../../../shared/services/aggregators');
 *   const gsc  = await getAggregator('GSC');
 *   const gg   = await getAggregator('GOLDGATE');
 *   const tc   = await getAggregator('TCGAMING');
 */
const GSCService      = require('./GSCService');      // delegates to shared/providers/GSCProvider
const GoldgateService = require('./GoldgateService');
const TCGamingService = require('./TCGamingService');
const { getPrismaClient } = require('../../config/databases');

// In-memory cache: aggregatorCode → service instance
const _cache = {};

/**
 * Get (or create & cache) an aggregator service instance.
 *
 * @param {string} aggregatorCode  'GSC' | 'GOLDGATE' | 'TCGAMING'
 * @returns {Promise<GSCService|GoldgateService|TCGamingService>}
 */
async function getAggregator(aggregatorCode) {
  const code = aggregatorCode.toUpperCase();

  if (_cache[code]) return _cache[code];

  // Aggregator configs stored in game_db.gameAggregator
  const gamePrisma = getPrismaClient('game');
  const config     = await gamePrisma.gameAggregator.findFirst({
    where: { code, status: 'active' },
  });

  if (!config) {
    throw new Error(`Aggregator "${code}" not found or inactive in game_db.gameAggregator`);
  }

  let service;
  switch (code) {
    case 'GSC':      service = new GSCService(config);      break;
    case 'GOLDGATE': service = new GoldgateService(config); break;
    case 'TCGAMING': service = new TCGamingService(config); break;
    default:
      throw new Error(`Aggregator "${code}" is not supported`);
  }

  // Cache with a 5-minute TTL (re-create after 5 min to pick up config changes)
  _cache[code] = service;
  setTimeout(() => { delete _cache[code]; }, 5 * 60 * 1000);

  return service;
}

/**
 * Clear the aggregator cache (useful after config update in admin panel).
 * @param {string} [code]  Specific aggregator code, or omit to clear all
 */
function clearCache(code) {
  if (code) delete _cache[code.toUpperCase()];
  else Object.keys(_cache).forEach((k) => delete _cache[k]);
}

// GSCService is an alias of GSCProvider — export both names for convenience
const GSCProvider = GSCService;
module.exports = { getAggregator, clearCache, GSCService, GSCProvider, GoldgateService, TCGamingService };
