// @ts-nocheck
// source/backend/src/shared/providers/tc-gaming/TransferTCGamingProvider.js
/**
 * Shared TC Gaming Transfer Wallet Provider
 * Transfer model: deposit/withdraw funds before/after gaming sessions.
 * Shared between game module and sports module.
 */
const BaseTCGamingProvider = require('./BaseTCGamingProvider');

class TransferTCGamingProvider extends BaseTCGamingProvider {
  constructor(config, prisma) {
    super(config);
    this.prisma = prisma;
  }

  async createPlayer(username, password) {
    return this.callTCGaming({
      method:   'cm',
      username,
      password,
      currency: this.currency,
    });
  }

  async getBalance(username, productType) {
    return this.callTCGaming({
      method:       'gb',
      username,
      product_type: productType,
    });
  }

  /**
   * Transfer funds between main wallet and provider wallet.
   * @param {string} username
   * @param {string} productType   TC Gaming product type (e.g. '151' for sports)
   * @param {string} fundType      '1' = deposit, '2' = withdraw
   * @param {number} amount
   * @param {string} referenceNo   Unique reference (e.g. order ID)
   */
  async fundTransfer(username, productType, fundType, amount, referenceNo) {
    return this.callTCGaming({
      method:       'ft',
      username,
      product_type: productType,
      fund_type:    fundType,
      amount,
      reference_no: referenceNo,
    });
  }

  async transferOutAll(username, productType, referenceNo) {
    return this.callTCGaming({
      method:       'ftoa',
      username,
      product_type: productType,
      reference_no: referenceNo,
    });
  }

  /**
   * Launch a game/sports betting page.
   * @param {string} username
   * @param {string} productType   e.g. '151' (Sports), '131' (Casino)
   * @param {string} gameCode      Game code ('' for sports lobby)
   * @param {string} platform      'web' | 'h5'
   * @param {string} ip
   * @param {string} language      'vi' | 'en' | 'zh'
   * @param {string} lotteryBetMode
   * @param {Array}  series
   */
  async launchGame(username, productType, gameCode, platform, ip, language, lotteryBetMode, series) {
    const params = {
      method:            'lg',
      username,
      product_type:      productType,
      game_mode:         '1', // real
      game_code:         gameCode || '',
      platform:          platform || 'h5',
      ip_address:        ip || '127.0.0.1',
      language:          language || 'vi',
      lottery_bet_mode:  lotteryBetMode,
    };
    if (series) params.series = series;

    const result = await this.callTCGaming(params);
    return result.game_url || result.url;
  }
}

module.exports = TransferTCGamingProvider;
