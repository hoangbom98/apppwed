// @ts-nocheck
// source/backend/src/shared/services/aggregators/GoldgateService.js
'use strict';
/**
 * Goldgate Aggregator Service
 *
 * Goldgate is an API aggregator that connects to 150+ game vendors
 * (Evolution, PG Soft, JDB, SBO, JILI, CQ9, etc.).
 * Each vendor is identified by a unique `vendorCode` (e.g. "casino-evolution").
 *
 * Key API flows:
 *   POST /auth/createtoken           — obtain Bearer token
 *   POST /api/v2/games/list          — list games by vendorCode
 *   POST /game/launch-url            — get launch URL for a game
 *   POST /goldgate/api/balance       — seamless balance callback
 *   POST /goldgate/api/transaction   — seamless transaction callback (bet/win/refund)
 *
 * Wallet model: SEAMLESS (Goldgate calls our server for balance/bet/win)
 *
 * Used by: game module (game_db) and sports module (sports_db)
 * The `prisma` instance passed to balance/transaction handlers must be
 * the calling module's DB client.
 */
const axios  = require('axios');
const logger = require('../logger');

class GoldgateService {
  /**
   * @param {object} config  Aggregator config row from game_db.gameAggregator
   *   { baseUrl, clientId (apiKey), clientSecret (secretKey), config: { language, lobbyUrl } }
   */
  constructor(config) {
    this.config       = config;
    this.clientId     = config.apiKey;
    this.clientSecret = config.secretKey;
    this.baseUrl      = config.baseUrl;
    this.language     = config.config?.language || 'vi';
    this.lobbyUrl     = config.config?.lobbyUrl || '';
    this.token        = null;
    this.tokenExpiry  = 0;

    this.client = axios.create({ baseURL: this.baseUrl, timeout: 30000 });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Obtain / reuse a Bearer token from Goldgate.
   * Token is cached in memory until expiry.
   */
  async getToken() {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;

    const res = await this.client.post('/auth/createtoken', {
      clientId:     this.clientId,
      clientSecret: this.clientSecret,
    });

    if (!res.data?.token) throw new Error('Goldgate: failed to obtain auth token');

    this.token        = res.data.token;
    this.tokenExpiry  = (res.data.expiration || Math.floor(Date.now() / 1000) + 3600) * 1000;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    return this.token;
  }

  // ── Game / Product Catalog ────────────────────────────────────────────────

  /**
   * Fetch the game list for a vendor from Goldgate.
   *
   * @param {string} vendorCode  e.g. "casino-evolution", "pg-soft", "jdb"
   * @param {string} language    e.g. "en", "vi", "zh"
   * @returns {Promise<Array>}   Array of GameItem objects
   *
   * Response GameItem fields:
   *   provider, vendorCode, gameId, gameCode, gameName, slug,
   *   thumbnail, updatedAt, isNew, underMaintenance
   */
  async listGames(vendorCode, language = null) {
    await this.getToken();
    const res = await this.client.post('/api/v2/games/list', {
      vendorCode,
      language: language || this.language,
    });

    if (!res.data?.success) {
      throw new Error(`Goldgate listGames error [${res.data?.errorCode}]: ${res.data?.message}`);
    }
    return res.data.message || [];
  }

  /**
   * Get launch URL for a specific game.
   *
   * @param {string} userId      Our user ID (mapped to Goldgate userCode)
   * @param {string} vendorCode  e.g. "casino-evolution"
   * @param {string} gameCode    e.g. "lobby" or specific game code
   * @param {object} opts        { language, lobbyUrl }
   * @returns {Promise<string>}  Game launch URL
   */
  async getLaunchUrl(userId, vendorCode, gameCode, opts = {}) {
    await this.getToken();
    const res = await this.client.post('/game/launch-url', {
      vendorCode,
      gameCode,
      userCode:  String(userId),
      language:  opts.language  || this.language,
      lobbyUrl:  opts.lobbyUrl  || this.lobbyUrl,
      theme:     1,
    });

    const url = res.data?.message || res.data?.url;
    if (!url) throw new Error(`Goldgate getLaunchUrl: no URL returned for ${vendorCode}/${gameCode}`);
    return url;
  }

  // ── Seamless Wallet Callbacks ─────────────────────────────────────────────

  /**
   * Handle balance inquiry callback from Goldgate server.
   * Goldgate calls POST /goldgate/api/balance when it needs the player's wallet balance.
   *
   * @param {string} userCode    Maps to our user ID
   * @param {string} vendorCode  Vendor identifier (for logging)
   * @param {object} prisma      Calling module's Prisma client (game_db or sports_db)
   */
  async handleBalance(userCode, vendorCode, prisma) {
    const userId = userCode;
    const user   = await prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true },
    });
    if (!user) return { code: 1, message: 'Player not found', balance: 0 };

    logger.debug(`[Goldgate] balance userId=${userId} vendor=${vendorCode} balance=${user.balance}`);
    return { code: 0, balance: Number(user.balance) };
  }

  /**
   * Handle transaction callback from Goldgate.
   * Goldgate calls POST /goldgate/api/transaction for bet/win/refund/cancel.
   *
   * @param {object} payload  {
   *   userCode, vendorCode, transactionId, roundId,
   *   txType ('BET'|'WIN'|'REFUND'|'CANCEL'), amount, gameCode
   * }
   * @param {object} prisma   Calling module's Prisma client
   */
  async handleTransaction(payload, prisma) {
    const { userCode, vendorCode, transactionId, roundId, txType, amount, gameCode } = payload;
    const userId = userCode;
    const amt    = Math.abs(Number(amount));

    // Idempotency check
    const existing = await prisma.transaction.findFirst({
      where: { referenceId: String(transactionId), referenceType: 'gg_tx' },
    });
    if (existing) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
      return { code: 0, balance: Number(u?.balance ?? 0), message: 'already processed' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (!user) throw new Error('Player not found');

      const isBet = ['BET', 'DEBIT'].includes(txType?.toUpperCase());
      if (isBet && Number(user.balance) < amt) throw new Error('Insufficient balance');

      const updated = await tx.user.update({
        where:  { id: userId },
        data:   { balance: isBet ? { decrement: amt } : { increment: amt } },
        select: { balance: true },
      });

      await tx.transaction.create({
        data: {
          userId,
          type:          isBet ? 'bet' : txType.toLowerCase(),
          amount:        isBet ? -amt : amt,
          balanceAfter:  Number(updated.balance),
          referenceId:   String(transactionId),
          referenceType: 'gg_tx',
          note:          `Goldgate ${txType} vendor=${vendorCode} game=${gameCode} round=${roundId}`,
        },
      });

      return { balance: Number(updated.balance) };
    });

    logger.info(`[Goldgate] tx userId=${userId} vendor=${vendorCode} type=${txType} amt=${amt}`);
    return { code: 0, balance: result.balance };
  }
}

module.exports = GoldgateService;
