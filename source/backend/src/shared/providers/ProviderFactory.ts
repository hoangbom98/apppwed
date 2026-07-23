// source/backend/src/shared/providers/ProviderFactory.js
/**
 * DEPRECATED — use shared/services/aggregators instead.
 *
 * This file is kept for backward compatibility with existing game module code
 * that calls ProviderFactory.getProvider('GSC', prisma).
 *
 * New code should use:
 *   const { getAggregator } = require('../services/aggregators');
 *
 * Migration note:
 *   Old: ProviderFactory.getProvider('GSC', prisma)
 *   New: getAggregator('GSC')  — then call .handleBalance(body, prisma)
 *
 * For backward compat, this factory falls back to reading from game_db.gameAggregator
 * first, and game_db.gameProvider (legacy) as fallback.
 */
const GSCService      = require('../services/aggregators/GSCService');
const GoldgateService = require('../services/aggregators/GoldgateService');
const TCGamingService = require('../services/aggregators/TCGamingService');
const { getPrismaClient } = require('../../config/databases');

class ProviderFactory {
  /**
   * @param {string}      providerCode  'GSC' | 'GOLDGATE' | 'TCGAMING'
   * @param {object}      prisma        Prisma client for the calling module's DB
   * @param {string|null} productType   Optional TC Gaming product type
   */
  static async getProvider(providerCode, prisma, _productType = null) {
    const code       = providerCode.toUpperCase();
    const gamePrisma = getPrismaClient('game');

    // Try new gameAggregator table first
    let config = await gamePrisma.gameAggregator.findFirst({
      where: { code, status: 'active' },
    }).catch(() => null);

    // Fallback to legacy gameProvider table
    if (!config) {
      config = await gamePrisma.gameProvider.findFirst({
        where: { code, status: 'active' },
      }).catch(() => null);
    }

    if (!config) {
      throw new Error(`Aggregator/Provider "${code}" not found or inactive`);
    }

    switch (code) {
      case 'GSC':
        return new GSCService(config);

      case 'GOLDGATE':
        return new GoldgateService(config);

      case 'TCGAMING': {
        // For TC Gaming seamless, the TCGamingService needs the calling module's prisma
        // attached differently — pass productType in the service call
        const svc = new TCGamingService(config);
        // Attach prisma reference for seamless callback handlers
        svc._callbackPrisma = prisma;
        return svc;
      }

      default:
        throw new Error(`Aggregator "${code}" is not supported`);
    }
  }
}

module.exports = ProviderFactory;
