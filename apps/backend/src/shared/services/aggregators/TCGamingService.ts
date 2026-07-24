// @ts-nocheck
// code/backend/src/shared/services/aggregators/TCGamingService.js
'use strict';
/**
 * TC Gaming Aggregator Service
 *
 * TC Gaming is an API aggregator connecting to 200+ game products.
 * Each product is identified by a numeric `productCode` (called "Code" in TC docs).
 * Products support either TRANSFER wallet, SEAMLESS wallet, or both.
 *
 * TC Gaming Product Reference (partial):
 *   2   → TCG LOTTO          (TRANSFER / SEAMLESS) [LOTT]
 *   16  → CQ9                (TRANSFER / SEAMLESS) [RNG, FISH]
 *   39  → PP (Pragmatic Play)(TRANSFER) [LIVE, RNG]
 *   47  → BTI Sports         (TRANSFER / SEAMLESS) [SPORT]
 *   54  → SBO Sports         (TRANSFER) [LIVE, SPORT]
 *   55  → JDB                (TRANSFER / SEAMLESS) [RNG, FISH, PVP]
 *   68  → IMSB Sports        (TRANSFER / SEAMLESS) [SPORT]
 *   98  → PG Soft            (TRANSFER / SEAMLESS) [RNG]
 *  104  → CMD368 Sports      (TRANSFER) [SPORT]
 *  131  → PANDA SPORTS        (TRANSFER / SEAMLESS) [SPORT]
 *  140  → JILI               (TRANSFER) [RNG, FISH, PVP]
 *  151  → United Gaming (UG2)(TRANSFER) [SPORT] ← primary sports product
 *  172  → Evolution           (TRANSFER) [LIVE]
 *  384  → TCG SEA LOTTO       (TRANSFER / SEAMLESS) [ELOTT]
 *  420  → TCG LOTTO VN        (TRANSFER / SEAMLESS) [LOTT]
 *
 * Wallet models:
 *   TRANSFER  — we push funds to TC Gaming before game, pull back after
 *   SEAMLESS  — TC Gaming calls back to our wallet server for balance/debit/credit
 *
 * TC Gaming API uses DES-ECB encryption + SHA-256 signing:
 *   body = { merchant_code, params: DES_Base64(JSON), sign: SHA256(params+hashKey) }
 *
 * Used by: game module (game_db) and sports module (sports_db)
 */
const crypto = require('crypto');
const axios  = require('axios');
const logger = require('../logger');

class TCGamingService {
  /**
   * @param {object} config  Aggregator config from game_db.gameAggregator
   *   { baseUrl, apiKey (merchant_code), secretKey (des_key 8-byte), config: { hashKey, currency } }
   */
  constructor(config) {
    this.config       = config;
    this.merchantCode = config.apiKey;             // merchant_code
    this.desKey       = config.secretKey;          // DES key (8 ASCII bytes)
    this.hashKey      = config.config?.hashKey || config.hashKey; // SHA256 hash key
    this.apiUrl       = config.baseUrl;
    this.currency     = config.config?.currency || 'VND2';
  }

  // ── Encryption / Signing ─────────────────────────────────────────────────

  /** DES-ECB encrypt JSON → Base64 */
  encrypt(params) {
    const cipher = crypto.createCipheriv('des-ecb', Buffer.from(this.desKey, 'utf8'), null);
    cipher.setAutoPadding(true);
    let enc = cipher.update(JSON.stringify(params), 'utf8', 'base64');
    enc += cipher.final('base64');
    return enc;
  }

  /** SHA-256(Base64Params + hashKey) */
  sign(encryptedParams) {
    return crypto.createHash('sha256').update(encryptedParams + this.hashKey).digest('hex');
  }

  /** DES-ECB decrypt Base64 → JSON */
  decrypt(encrypted) {
    const decipher = crypto.createDecipheriv('des-ecb', Buffer.from(this.desKey, 'utf8'), null);
    decipher.setAutoPadding(true);
    let dec = decipher.update(encrypted, 'base64', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
  }

  /** Verify inbound callback signature */
  verifySign(encryptedParams, sign) {
    return this.sign(encryptedParams) === sign;
  }

  // ── Low-level API call ────────────────────────────────────────────────────

  /** POST to TC Gaming API (form-urlencoded, encrypted params) */
  async call(params) {
    const enc  = this.encrypt(params);
    const sig  = this.sign(enc);
    const data = new URLSearchParams({
      merchant_code: this.merchantCode,
      params:        enc,
      sign:          sig,
    });

    const res = await axios.post(this.apiUrl, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
    });
    return res.data;
  }

  // ── Player Management ─────────────────────────────────────────────────────

  /**
   * Create a player account in TC Gaming.
   * @param {string} username  Our user ID or username
   * @param {string} password
   */
  async createPlayer(username, password) {
    return this.call({ method: 'cm', username, password, currency: this.currency });
  }

  // ── Transfer Wallet Operations ────────────────────────────────────────────

  /**
   * Get player balance in a TC Gaming product wallet.
   * @param {string} username
   * @param {number|string} productCode  TC Gaming product code (e.g. 151 for UG Sports)
   */
  async getProductBalance(username, productCode) {
    return this.call({ method: 'gb', username, product_type: String(productCode) });
  }

  /**
   * Transfer funds to TC Gaming product wallet (deposit from main wallet).
   * @param {string}  username
   * @param {number|string} productCode
   * @param {number}  amount
   * @param {string}  referenceNo  Unique order reference
   */
  async transferIn(username, productCode, amount, referenceNo) {
    return this.call({
      method:       'ft',
      username,
      product_type: String(productCode),
      fund_type:    '1',    // 1 = deposit to product wallet
      amount:       String(amount),
      reference_no: referenceNo,
    });
  }

  /**
   * Transfer funds back from TC Gaming product wallet (withdraw to main wallet).
   * @param {string}  username
   * @param {number|string} productCode
   * @param {number}  amount
   * @param {string}  referenceNo
   */
  async transferOut(username, productCode, amount, referenceNo) {
    return this.call({
      method:       'ft',
      username,
      product_type: String(productCode),
      fund_type:    '2',    // 2 = withdraw from product wallet
      amount:       String(amount),
      reference_no: referenceNo,
    });
  }

  /**
   * Transfer ALL funds back from TC Gaming product wallet (one-shot withdraw).
   * @param {string} username
   * @param {number|string} productCode
   * @param {string} referenceNo
   */
  async transferOutAll(username, productCode, referenceNo) {
    return this.call({
      method:       'ftoa',
      username,
      product_type: String(productCode),
      reference_no: referenceNo,
    });
  }

  // ── Game Launch ───────────────────────────────────────────────────────────

  /**
   * Get launch URL for a TC Gaming product (game or sports lobby).
   *
   * @param {object} opts
   *   username      Our user ID
   *   productCode   TC Gaming product code (e.g. 151=UG Sports, 16=CQ9, 98=PG Soft)
   *   gameCode      Game code within product (empty string = lobby)
   *   platform      'web' | 'h5'
   *   ip            Player IP
   *   language      'vi' | 'en' | 'zh'
   *   lotteryBetMode (optional, for lottery products)
   *   series        (optional, lottery series config)
   */
  async getLaunchUrl({ username, productCode, gameCode = '', platform = 'h5', ip = '127.0.0.1', language = 'vi', lotteryBetMode, series }) {
    const params = {
      method:       'lg',
      username,
      product_type: String(productCode),
      game_mode:    '1',     // 1 = real money
      game_code:    gameCode || '',
      platform,
      ip_address:   ip,
      language,
    };
    if (lotteryBetMode) params.lottery_bet_mode = lotteryBetMode;
    if (series)         params.series           = series;

    const result = await this.call(params);
    const url    = result?.game_url || result?.url;
    if (!url) throw new Error(`TCGaming getLaunchUrl: no URL returned for product=${productCode}`);
    return url;
  }

  // ── Seamless Wallet Callbacks ─────────────────────────────────────────────

  /**
   * Entry point for inbound seamless callbacks from TC Gaming.
   * TC Gaming POSTs encrypted { merchant_code, params, sign } to our callback URL.
   *
   * The caller (controller) must first verify the signature and decrypt params,
   * then call this method with the decrypted data object.
   *
   * Supported methods:
   *   sgb — get balance
   *   db  — debit (bet)
   *   cr  — credit (win/refund)
   *
   * @param {object} data    Decrypted callback data (already JSON-parsed)
   * @param {object} prisma  Calling module's Prisma client (game_db or sports_db)
   */
  async handleSeamlessCallback(data, prisma) {
    const { method } = data;
    switch (method) {
      case 'sgb': return this._handleGetBalance(data, prisma);
      case 'db':  return this._handleDebit(data, prisma);
      case 'cr':  return this._handleCredit(data, prisma);
      default:
        logger.warn(`[TCGaming] Unsupported seamless method: ${method}`);
        throw new Error(`TCGaming seamless: method "${method}" not supported`);
    }
  }

  // sgb — get balance
  async _handleGetBalance({ username }, prisma) {
    const user = await prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) {
      logger.warn(`[TCGaming] sgb: user ${username} not found`);
      return { status: 1000, error_desc: 'User not found' };
    }
    return { status: 0, balance: Number(user.balance) };
  }

  // db — debit (bet placed)
  async _handleDebit({ username, product_type, transactions = [] }, prisma) {
    const user = await prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) return { status: 1000, error_desc: 'User not found' };

    const balanceInfo = [];
    for (const txn of transactions) {
      const txId  = String(txn.txn_id || txn.transaction_id || '');
      const amt   = Math.abs(Number(txn.amount));
      const round = String(txn.round_id || txn.game_id || '');

      // Idempotency
      const exists = await prisma.transaction.findFirst({
        where: { referenceId: txId, referenceType: 'tc_debit' },
      });
      if (exists) { balanceInfo.push({ txn_id: txId, balance: Number(user.balance) }); continue; }

      if (Number(user.balance) < amt) return { status: 3001, error_desc: 'Insufficient balance' };

      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where:  { id: user.id },
          data:   { balance: { decrement: amt } },
          select: { balance: true },
        });
        await tx.transaction.create({
          data: {
            userId:        user.id,
            type:          'bet',
            amount:        -amt,
            balanceAfter:  Number(u.balance),
            referenceId:   txId,
            referenceType: 'tc_debit',
            note:          `TCGaming DB product=${product_type} round=${round}`,
          },
        });
        return u;
      });

      user.balance = updated.balance;
      balanceInfo.push({ txn_id: txId, balance: Number(updated.balance) });
      logger.info(`[TCGaming] debit userId=${user.id} product=${product_type} amt=${amt} txId=${txId}`);
    }

    return { status: 0, balance_info: balanceInfo };
  }

  // cr — credit (win / refund)
  async _handleCredit({ username, product_type, transactions = [] }, prisma) {
    const user = await prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) return { status: 1000, error_desc: 'User not found' };

    const balanceInfo = [];
    for (const txn of transactions) {
      const txId  = String(txn.txn_id || txn.transaction_id || '');
      const amt   = Math.abs(Number(txn.amount));
      const round = String(txn.round_id || txn.game_id || '');
      const type  = txn.type === 'REFUND' ? 'refund' : 'win';

      // Idempotency
      const exists = await prisma.transaction.findFirst({
        where: { referenceId: txId, referenceType: 'tc_credit' },
      });
      if (exists) {
        const u = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });
        balanceInfo.push({ txn_id: txId, balance: Number(u?.balance ?? 0) });
        continue;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where:  { id: user.id },
          data:   { balance: { increment: amt } },
          select: { balance: true },
        });
        await tx.transaction.create({
          data: {
            userId:        user.id,
            type,
            amount:        amt,
            balanceAfter:  Number(u.balance),
            referenceId:   txId,
            referenceType: 'tc_credit',
            note:          `TCGaming CR product=${product_type} round=${round}`,
          },
        });
        return u;
      });

      user.balance = updated.balance;
      balanceInfo.push({ txn_id: txId, balance: Number(updated.balance) });
      logger.info(`[TCGaming] credit userId=${user.id} product=${product_type} amt=${amt} txId=${txId}`);
    }

    return { status: 0, balance_info: balanceInfo };
  }
}

module.exports = TCGamingService;
