// backend/src/modules/game/services/providerFactory.js
/**
 * Game module ProviderFactory
 *
 * Thin wrapper that delegates to the shared ProviderFactory.
 * The shared factory reads provider configs from game_db and
 * accepts the calling module's Prisma client for wallet callbacks.
 *
 * All provider logic has been moved to src/shared/providers/ so that
 * both game and sports modules share the same GSC / Goldgate / TCGaming code.
 */
module.exports = require('../../../shared/Third-PartyService/ProviderFactory');
