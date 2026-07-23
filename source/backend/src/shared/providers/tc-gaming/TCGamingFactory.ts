// source/backend/src/shared/providers/tc-gaming/TCGamingFactory.js
/**
 * Shared TCGamingFactory
 * Returns the correct provider instance based on wallet_type config.
 */
const TransferTCGamingProvider  = require('./TransferTCGamingProvider');
const SeamlessTCGamingProvider  = require('./SeamlessTCGamingProvider');

class TCGamingFactory {
  /**
   * @param {object} config       Provider config record from DB
   * @param {object} prisma       Prisma client for the calling module's DB
   * @param {string} walletType   'transfer' | 'seamless'
   */
  static getProvider(config, prisma, walletType = 'transfer') {
    if (walletType === 'seamless') {
      return new SeamlessTCGamingProvider(config, prisma);
    }
    return new TransferTCGamingProvider(config, prisma);
  }
}

module.exports = TCGamingFactory;
