// source/backend/src/shared/services/aggregators/GSCService.js
'use strict';
/**
 * GSCService — thin re-export of the canonical GSCProvider.
 *
 * GSCProvider (shared/providers/GSCProvider.js) is the authoritative, full
 * implementation of the GSC Plus API v2.0.6.  This file simply re-exports it
 * under the "Service" name so that the aggregator factory (aggregators/index.js)
 * and any code that imports GSCService receives the full-featured class without
 * duplication.
 *
 * Architecture:
 *   Aggregators (GSC / Goldgate / TCGaming)
 *     └─ Products/Vendors (CQ9, JILI, PG Soft, SBO, Evolution, ...)
 *           └─ Games (individual game titles)
 *
 * Used by: game module (game_db) and sports module (sports_db).
 * The `prisma` argument for wallet callbacks must be the calling module's client:
 *   – game module  → game_db prisma client
 *   – sports module → sports_db prisma client
 *
 * Aggregator config is read from game_db.gameAggregator by getAggregator().
 * Constructor accepts the same config shape as ProviderFactory / getAggregator:
 *   { baseUrl, apiKey (operatorCode), secretKey, config: { currency, language, lobbyUrl } }
 *
 * Note: GSCProvider constructor maps cfg.apiKey → this.operatorCode automatically.
 */

const GSCProvider = require('../../providers/GSCProvider');

// GSCProvider already maps cfg.apiKey → operatorCode and cfg.secretKey → secretKey,
// so the config shape from game_db.gameAggregator is directly compatible.
// Re-export as both names so callers using either import path get the same class.

module.exports = GSCProvider;
