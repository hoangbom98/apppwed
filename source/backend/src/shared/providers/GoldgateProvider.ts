// source/backend/src/shared/providers/GoldgateProvider.js
/**
 * Shared Goldgate Provider
 *
 * Supports game launch (POST /game/launch-url) and seamless wallet callbacks.
 * Used by both: game module (game_db) and sports module (sports_db).
 */
const BaseProvider = require('./BaseProvider');
const logger       = require('../services/logger');

class GoldgateProvider extends BaseProvider {
  constructor(providerConfig) {
    super(providerConfig);
    this.clientId     = providerConfig.apiKey;
    this.clientSecret = providerConfig.secretKey;
    this.token        = null;
    this.tokenExpiry  = 0;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async getAuthToken() {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;

    const res = await this.client.post('/auth/createtoken', {
      clientId:     this.clientId,
      clientSecret: this.clientSecret,
    });

    if (!res.data?.token) throw new Error('Goldgate: failed to obtain auth token');
    this.token       = res.data.token;
    this.tokenExpiry = (res.data.expiration || Math.floor(Date.now() / 1000) + 3600) * 1000;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    return this.token;
  }

  // ── Game / Sports Launch ───────────────────────────────────────────────────

  /**
   * Launch a game (or sports betting page) and return the URL.
   * @param {string|number} userId
   * @param {string}        gameCode    Goldgate game code (for sports: product code)
   * @param {number}        betAmount
   * @param {string}        vendorCode  e.g. 'JILI', 'PG', 'SPORTS'
   */
  async createSession(userId, gameCode, _betAmount = 0, vendorCode = '') {
    await this.getAuthToken();

    const res = await this.client.post('/game/launch-url', {
      vendorCode: vendorCode || gameCode.split('_')[0],
      gameCode,
      userCode:  String(userId),
      language:  this.config.config?.language  || 'vi',
      lobbyUrl:  this.config.config?.lobbyUrl  || '',
      theme:     1,
    });

    return {
      sessionId: `gg_${Date.now()}`,
      gameUrl:   res.data.message || res.data.url,
      expiresAt: new Date(Date.now() + 3_600_000),
    };
  }

  // ── Seamless Wallet Callbacks ─────────────────────────────────────────────

  /**
   * Balance inquiry callback.
   * @param {string} userCode  maps to our userId
   * @param {string} vendorCode
   * @param {object} prisma    Caller's Prisma client (game or sports)
   */
  async handleBalance(userCode, vendorCode, prisma) {
    const userId = parseInt(userCode) || userCode;
    const user   = await prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true },
    });
    if (!user) return { code: 1, message: 'Player not found', balance: 0 };
    return { code: 0, balance: Number(user.balance) };
  }

  /**
   * Transaction callback (bet / win / refund / cancel).
   * txType: 'BET' | 'WIN' | 'REFUND' | 'CANCEL'
   * @param {object} payload  { userCode, vendorCode, transactionId, roundId, txType, amount, gameCode }
   * @param {object} prisma   Caller's Prisma client (game or sports)
   */
  async handleTransaction(payload, prisma) {
    const { userCode, transactionId, roundId, txType, amount, gameCode } = payload;
    const userId = parseInt(userCode) || userCode;
    const amt    = Math.abs(Number(amount));

    // Idempotency
    const existing = await prisma.transaction.findFirst({
      where: { referenceId: String(transactionId), referenceType: 'gg_tx' },
    });
    if (existing) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
      return { code: 0, balance: Number(user?.balance ?? 0), message: 'already processed' };
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
          note:          `Goldgate ${txType} gameCode=${gameCode} round=${roundId}`,
        },
      });

      return { balance: Number(updated.balance) };
    });

    logger.info(`[Goldgate] handleTransaction userId=${userId} type=${txType} amount=${amt}`);
    return { code: 0, balance: result.balance };
  }

  async getGameResult(sessionId) {
    return { sessionId, status: 'unknown' };
  }

  async handleWebhook(_payload) {
    return { received: true };
  }
}

module.exports = GoldgateProvider;
