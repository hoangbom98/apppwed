// @ts-nocheck
'use strict';
/**
 * source/backend/src/shared/providers/GSCProvider.js
 *
 * GSC+ API v2.0.6 — Full implementation.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  OPERATOR (outbound — we call GSC)                                   │
 * │    POST /api/operators/launch-game          → launchGame()           │
 * │    POST /superlobby/launch                  → launchSuperLobby()     │
 * │    GET  /api/operators/provider-games       → getGameList()          │
 * │    GET  /api/operators/available-products   → getProductList()       │
 * │    GET  /api/operators/wagers               → getWagerList()         │
 * │    GET  /api/operators/wagers/:id           → getWager()             │
 * │    GET  /api/operators/:code/game-history   → getGameHistory()       │
 * │    GET  /api/operators/wallet-balance       → getWalletBalance()     │
 * │    POST /api/operators/create-free-round    → createFreeRound()      │
 * │    POST /api/operators/cancel-free-round    → cancelFreeRound()      │
 * │    GET  /api/operators/get-player-frb       → getPlayerFRB()         │
 * │    GET  /api/operators/get-bet-scales       → getBetScales()         │
 * │    POST /api/operators/recharge/order       → autoDeposit()          │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  SEAMLESS WALLET (inbound — GSC calls us)                           │
 * │  Handled by gscSeamlessController.js, not this file.               │
 * │    POST /v1/api/seamless/balance                                    │
 * │    POST /v1/api/seamless/withdraw                                   │
 * │    POST /v1/api/seamless/deposit                                    │
 * │    POST /v1/api/seamless/pushbetdata                                │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Signature formulas (all MD5, all lowercase hex):
 *   launchGame:    MD5( request_time + secret_key + "launchgame"      + operator_code )
 *   superLobby:    MD5( request_time + secret_key + "launchsuperlobby"+ operator_code )
 *   gameList:      MD5( request_time + secret_key + "gamelist"        + operator_code )
 *   productList:   MD5( request_time + secret_key + "productlist"     + operator_code )
 *   getWagers:     MD5( request_time + secret_key + "getwagers"       + operator_code )
 *   getWager:      MD5( request_time + secret_key + "getwager"        + operator_code )
 *   gameHistory:   MD5( request_time + secret_key + "gamehistory"     + operator_code )
 *   walletBalance: MD5( request_time + secret_key + "getwalletcurrencies" + operator_code )
 *   createFR:      MD5( request_time + secret_key + "createfreeround" + operator_code )
 *   cancelFR:      MD5( request_time + secret_key + "cancelfreeround" + operator_code )
 *   getPlayerFRB:  MD5( request_time + secret_key + "getplayersfrb"   + operator_code )
 *   getBetScales:  MD5( request_time + secret_key + "getbetscales"    + operator_code )
 *   autoDeposit:   MD5( request_time + secret_key + "autodeposit"     + operator_code )
 */

const crypto = require('crypto');
const axios  = require('axios');
const logger = require('../services/logger');

// ── Seamless wallet response codes ────────────────────────────────────────────
const SEAMLESS_CODE = {
  SUCCESS:             0,
  INTERNAL_ERROR:    999,
  MEMBER_NOT_FOUND: 1000,
  INSUFFICIENT:     1001,
  PROXY_KEY_ERROR:  1002,
  DUPLICATE_TX:     1003,
  INVALID_SIGN:     1004,
  NO_GAME_LIST:     1005,
  BET_NOT_FOUND:    1006,
  MAINTENANCE:      2000,
};

// ── Operator response codes ───────────────────────────────────────────────────
const OPERATOR_CODE = {
  SUCCESS:         200,
  INTERNAL_ERROR:  999,
  INVALID_PARAM: 10002,
};

class GSCProvider {
  /**
   * @param {object} cfg
   * @param {string} cfg.baseUrl       e.g. "https://staging.gsimw.com"
   * @param {string} cfg.operatorCode  4-char alphanumeric, e.g. "ABCD"
   * @param {string} cfg.secretKey     signing secret
   * @param {string} [cfg.currency]    default currency, e.g. "VND"
   * @param {string} [cfg.channelCode] default channel, e.g. "gscp"
   * @param {number} [cfg.timeout]     axios timeout ms (default 15000)
   */
  constructor(cfg) {
    this.baseUrl       = (cfg.baseUrl || cfg.apiUrl || '').replace(/\/$/, '');
    this.operatorCode  = cfg.operatorCode || cfg.apiKey || '';
    this.secretKey     = cfg.secretKey || '';
    this.currency      = cfg.currency || 'VND';
    this.channelCode   = cfg.channelCode || 'gscp';
    this.lobbyUrl      = cfg.lobbyUrl || '';

    this._http = axios.create({
      baseURL: this.baseUrl,
      timeout: cfg.timeout || 15_000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    });
  }

  // ── Signature helpers ──────────────────────────────────────────────────────

  /**
   * Build an MD5 signature.
   * @param {number|string} requestTime  Unix timestamp (seconds)
   * @param {string}        action       e.g. "launchgame"
   * @returns {string}  32-char lowercase hex
   */
  _sign(requestTime, action) {
    const raw = `${requestTime}${this.secretKey}${action}${this.operatorCode}`;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /** Current Unix timestamp in seconds. */
  _ts() { return Math.floor(Date.now() / 1000); }

  /** Build common query/body params for operator API calls. */
  _base(action) {
    const request_time = this._ts();
    return {
      operator_code: this.operatorCode,
      request_time,
      sign: this._sign(request_time, action),
    };
  }

  /** Convenience: GET with query params. */
  async _get(path, params) {
    try {
      const res = await this._http.get(path, { params });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`GSC GET ${path}: ${msg}`);
    }
  }

  /** Convenience: POST with JSON body. */
  async _post(path, body) {
    try {
      const res = await this._http.post(path, body);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`GSC POST ${path}: ${msg}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.1  Launch Game
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Launch a game for a member.
   *
   * @param {object} opts
   * @param {string}  opts.memberAccount    Member unique ID in operator (max 50 chars)
   * @param {string}  opts.password         Member's password (MD5 hash recommended)
   * @param {string}  opts.nickname         Display name in game
   * @param {string}  [opts.currency]       Override default currency
   * @param {string}  [opts.gameCode]       Required for direct-game providers (null for lobby)
   * @param {number}  opts.productCode      GSC+ product code (e.g. 1007 for PG Soft)
   * @param {string}  opts.gameType         e.g. "SLOT", "LIVE_CASINO", "SPORT_BOOK"
   * @param {number}  [opts.languageCode]   Language code (default 0 = English)
   * @param {string}  [opts.ip]             Player IP
   * @param {string}  [opts.platform]       "WEB"|"DESKTOP"|"MOBILE"|"Widget"|"Streaming"
   * @param {string}  [opts.widgetId]       SABA Sports widget ID
   * @param {boolean} [opts.isWidgetLogin]  SABA widget login mode
   * @param {string}  [opts.eventId]        SABA live match ID
   * @param {boolean} [opts.isStreamingLogin] SABA live streaming login mode
   * @param {string}  [opts.operatorLobbyUrl] Operator site URL (required)
   *
   * @returns {{ url: string, content: string|null }}
   */
  async launchGame(opts) {
    const request_time = this._ts();
    const body = {
      operator_code:       this.operatorCode,
      member_account:      opts.memberAccount,
      password:            opts.password,
      nickname:            opts.nickname,
      currency:            opts.currency || this.currency,
      game_code:           opts.gameCode  || null,
      product_code:        opts.productCode,
      game_type:           opts.gameType,
      language_code:       opts.languageCode ?? 0,
      ip:                  opts.ip         || '127.0.0.1',
      platform:            opts.platform   || 'WEB',
      operator_lobby_url:  opts.operatorLobbyUrl || this.lobbyUrl || '',
      sign:                this._sign(request_time, 'launchgame'),
      request_time,
    };

    // Optional SABA-specific params
    if (opts.widgetId)          body.widget_id           = opts.widgetId;
    if (opts.isWidgetLogin != null) body.is_widget_login = opts.isWidgetLogin;
    if (opts.eventId)           body.event_id            = opts.eventId;
    if (opts.isStreamingLogin != null) body.is_streaming_login = opts.isStreamingLogin;

    const data = await this._post('/api/operators/launch-game', body);

    if (data.code !== OPERATOR_CODE.SUCCESS) {
      throw new Error(`GSC launchGame [${data.code}]: ${data.message}`);
    }
    return { url: data.url || null, content: data.content || null };
  }

  /**
   * Convenience wrapper used by GscPlusGameLaunchService._launchGSC().
   * Returns just the URL string (backward-compatible).
   */
  async getLaunchUrl(opts) {
    const result = await this.launchGame(opts);
    return result.url;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.7  Super Lobby
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Launch the Super Lobby or Aurora LIVE.
   *
   * @param {object} opts
   * @param {string}  opts.memberAccount
   * @param {string}  opts.nickname
   * @param {string}  [opts.currency]
   * @param {number}  [opts.languageCode]   default 0
   * @param {string}  [opts.platform]       "WEB"|"DESKTOP"|"MOBILE"
   * @param {number}  [opts.type]           0=SuperLobby, 1=Aurora LIVE (default 0)
   * @param {string}  [opts.operatorLobbyUrl]
   *
   * @returns {string}  lobby URL
   */
  async launchSuperLobby(opts) {
    const request_time = this._ts();
    const body = {
      operator_code:      this.operatorCode,
      member_account:     opts.memberAccount,
      nickname:           opts.nickname,
      currency:           opts.currency || this.currency,
      language_code:      opts.languageCode ?? 0,
      platform:           opts.platform  || 'WEB',
      type:               opts.type      ?? 0,
      operator_lobby_url: opts.operatorLobbyUrl || this.lobbyUrl || '',
      sign:               this._sign(request_time, 'launchsuperlobby'),
      request_time,
    };

    const data = await this._post('/superlobby/launch', body);
    if (!data.url) throw new Error(`GSC superlobby: ${data.message || 'no URL returned'}`);
    return data.url;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.2  Wager List
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Query settled wagers within a time range (max 5 minutes).
   *
   * @param {number} startMs   Start timestamp (milliseconds)
   * @param {number} endMs     End timestamp (milliseconds, ≤ startMs + 5 min)
   * @param {number} [offset]  Starting record number (default 0)
   * @param {number} [size]    Records per page (default 5000, max 5000)
   *
   * @returns {{ wagers: Wager[], pagination: { size, total } }}
   */
  async getWagerList(startMs, endMs, offset = 0, size = 5000) {
    const base = this._base('getwagers');
    const params = {
      ...base,
      start:  startMs,
      end:    endMs,
      offset,
      size,
    };
    return this._get('/api/operators/wagers', params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.3  Wager (single)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get a single wager by ID or wager_code.
   *
   * @param {string|number} idOrCode
   * @returns {{ wager: Wager }}
   */
  async getWager(idOrCode) {
    const base = this._base('getwager');
    return this._get(`/api/operators/wagers/${idOrCode}`, base);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.4  Game List
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all games the operator has contracted with GSC+.
   *
   * @param {object} opts
   * @param {number}  opts.productCode   Required — product unique ID
   * @param {string}  [opts.gameType]    Filter by game type (e.g. "SLOT")
   * @param {number}  [opts.offset]
   * @param {number}  [opts.size]        Omit for all
   *
   * @returns {{ code, provider_games: Game[], pagination }}
   */
  async getGameList(opts) {
    const base = this._base('gamelist');
    const params = {
      ...base,
      product_code: opts.productCode,
    };
    if (opts.gameType) params.game_type = opts.gameType;
    if (opts.offset != null) params.offset = opts.offset;
    if (opts.size   != null) params.size   = opts.size;

    return this._get('/api/operators/provider-games', params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.5  Game History
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get game history URL for a specific wager_code.
   *
   * @param {string} wagerCode
   * @returns {{ content: string }}  URL or HTML (PG Soft = HTML)
   */
  async getGameHistory(wagerCode) {
    const base = this._base('gamehistory');
    return this._get(`/api/operators/${wagerCode}/game-history`, base);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.6  Product List
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * List all products the operator has access to.
   *
   * @param {number} [offset]
   * @param {number} [size]    Omit for all
   *
   * @returns {Array<{ provider, currency, status, provider_id, product_id, product_code, game_type, product_name, entry_type }>}
   */
  async getProductList(offset, size) {
    const base = this._base('productlist');
    const params = { ...base };
    if (offset != null) params.offset = offset;
    if (size   != null) params.size   = size;
    return this._get('/api/operators/available-products', params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.12 Wallet Balance Inquiry
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get operator wallet balance for all contracted currencies.
   * Note: request_time must be milliseconds for this endpoint.
   *
   * @returns {{ code, data: { operator_code, is_credit, currencies[] } }}
   */
  async getWalletBalance() {
    const request_time = Date.now(); // milliseconds for this endpoint
    const params = {
      operator_code: this.operatorCode,
      request_time,
      sign: this._sign(request_time, 'getwalletcurrencies'),
    };
    return this._get('/api/operators/wallet-balance', params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.8  Create Free Round
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a Free Round campaign for a player.
   *
   * @param {object} opts
   * @param {string}  opts.memberAccount
   * @param {string}  [opts.currency]
   * @param {number}  opts.productCode
   * @param {string}  opts.gameType
   * @param {number}  opts.startAt        Unix timestamp (seconds)
   * @param {number}  opts.endAt          Unix timestamp (seconds)
   * @param {number}  opts.rounds
   * @param {string}  [opts.channelCode]  default "gscp"
   * @param {Array}   opts.gameList       [{ gameId, betValues: [{ betPerLine?, totalBetAmount?, currency }] }]
   *
   * @returns {{ bonus_code: string }}
   */
  async createFreeRound(opts) {
    const request_time = this._ts();
    const body = {
      operator_code:  this.operatorCode,
      member_account: opts.memberAccount,
      currency:       opts.currency    || this.currency,
      product_code:   opts.productCode,
      game_type:      opts.gameType,
      start_at:       opts.startAt,
      end_at:         opts.endAt,
      rounds:         opts.rounds,
      game_list:      opts.gameList,
      channel_code:   opts.channelCode || this.channelCode,
      sign:           this._sign(request_time, 'createfreeround'),
      request_time,
    };

    const data = await this._post('/api/operators/create-free-round', body);
    if (!data.bonus_code) throw new Error(`GSC createFreeRound: ${data.message || 'no bonus_code'}`);
    return { bonus_code: data.bonus_code };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.9  Cancel Free Round
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cancel a previously created Free Round by bonus_code.
   *
   * @param {object} opts
   * @param {string}  opts.bonusCode
   * @param {number}  opts.productCode
   * @param {string}  [opts.currency]
   * @param {string}  [opts.gameType]
   * @param {string}  [opts.channelCode]
   *
   * @returns {{ bonus_code: string }}
   */
  async cancelFreeRound(opts) {
    const request_time = this._ts();
    const body = {
      operator_code: this.operatorCode,
      currency:      opts.currency    || this.currency,
      product_code:  opts.productCode,
      bonus_code:    opts.bonusCode,
      channel_code:  opts.channelCode || this.channelCode,
      sign:          this._sign(request_time, 'cancelfreeround'),
      request_time,
    };
    if (opts.gameType) body.game_type = opts.gameType;

    return this._post('/api/operators/cancel-free-round', body);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.10 Get Player Free Round Bonus
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get a player's active Free Round bonuses.
   *
   * @param {object} opts
   * @param {string}  opts.memberAccount
   * @param {string}  [opts.currency]
   * @param {number}  opts.productCode
   * @param {string}  opts.gameType
   * @param {string}  [opts.channelCode]
   *
   * @returns {{ code, bonuses: FRBonus[] }}
   */
  async getPlayerFRB(opts) {
    const base = this._base('getplayersfrb');
    const params = {
      ...base,
      member_account: opts.memberAccount,
      currency:       opts.currency    || this.currency,
      product_code:   opts.productCode,
      game_type:      opts.gameType,
      channel_code:   opts.channelCode || this.channelCode,
    };
    return this._get('/api/operators/get-player-frb', params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.11 Get Game Bet Scales
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Query supported bet configurations for a list of games.
   *
   * @param {object} opts
   * @param {string}  [opts.currency]
   * @param {number}  opts.productCode
   * @param {string}  opts.gameType
   * @param {string[]} opts.gameIds      Array of game IDs (max 50)
   * @param {string}  [opts.channelCode]
   *
   * @returns {{ code, betScales: BetScale[] }}
   */
  async getBetScales(opts) {
    const base = this._base('getbetscales');
    // Commas must be URL-encoded per spec — axios handles this automatically
    const params = {
      ...base,
      currency:       opts.currency    || this.currency,
      product_code:   opts.productCode,
      game_type:      opts.gameType,
      bet_game_list:  Array.isArray(opts.gameIds) ? opts.gameIds.join(',') : opts.gameIds,
      channel_code:   opts.channelCode || this.channelCode,
    };
    return this._get('/api/operators/get-bet-scales', params);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.13 Auto Deposit
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a deposit URL for USDT auto top-up.
   *
   * @param {object} opts
   * @param {string}  opts.paymentCurrency  Currently only "USDT"
   * @param {string}  opts.depositCurrency  e.g. "BRL"
   * @param {number}  opts.amount
   *
   * @returns {{ url: string }}
   */
  async autoDeposit(opts) {
    const request_time = this._ts();
    const body = {
      operator_code:     this.operatorCode,
      payment_currency:  opts.paymentCurrency,
      deposit_currency:  opts.depositCurrency,
      amount:            opts.amount,
      sign:              this._sign(request_time, 'autodeposit'),
      request_time:      String(request_time),
    };

    const data = await this._post('/api/operators/recharge/order', body);
    if (data.code !== 0) throw new Error(`GSC autoDeposit [${data.code}]: ${data.message}`);
    return { url: data.url };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Seamless Wallet — signature verification (inbound callbacks)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verify the signature on an inbound seamless callback.
   *
   * Seamless balance/withdraw/deposit formula:
   *   MD5( operator_code + request_time + action_keyword + secret_key )
   *   action_keyword: "getbalance" | "withdraw" | "deposit" | "pushbetdata"
   *
   * @param {string} operatorCode
   * @param {string} requestTime
   * @param {string} actionKeyword
   * @param {string} incomingSign
   * @returns {boolean}
   */
  verifySeamlessSign(operatorCode, requestTime, actionKeyword, incomingSign) {
    const expected = crypto
      .createHash('md5')
      .update(`${operatorCode}${requestTime}${actionKeyword}${this.secretKey}`)
      .digest('hex');
    return expected === incomingSign?.toLowerCase();
  }

  // ── Kept for backward-compatibility with old providerCallbackController ───

  /** @deprecated Use gscSeamlessController.js instead */
  async handleBalance(body, prisma) {
    const { playerCode } = body;
    const user = await prisma.user.findUnique({
      where:  { id: Number(playerCode) || playerCode },
      select: { balance: true },
    });
    if (!user) return { code: SEAMLESS_CODE.MEMBER_NOT_FOUND, message: 'Member not found' };
    return { code: SEAMLESS_CODE.SUCCESS, balance: Number(user.balance) };
  }

  /** @deprecated Use gscSeamlessController.js instead */
  async handleTransaction(body, prisma) {
    const { playerCode, txType, amount, roundId, gameCode } = body;
    const userId = Number(playerCode) || playerCode;
    const type   = txType === 'BET' ? 'bet' : txType === 'WIN' ? 'win' : 'refund';
    const amt    = Math.abs(Number(amount));

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (!user) throw Object.assign(new Error('Player not found'), { gscCode: SEAMLESS_CODE.MEMBER_NOT_FOUND });

      const before = Number(user.balance);
      if (type === 'bet' && before < amt) {
        throw Object.assign(new Error('Insufficient balance'), { gscCode: SEAMLESS_CODE.INSUFFICIENT });
      }

      const delta   = type === 'bet' ? -amt : amt;
      const updated = await tx.user.update({
        where: { id: userId },
        data:  { balance: { increment: delta } },
        select: { balance: true },
      });
      const after = Number(updated.balance);

      await tx.transaction.create({
        data: {
          userId, type,
          amount:        delta,
          balanceAfter:  after,
          referenceId:   String(roundId),
          referenceType: 'gsc_round',
          note:          `GSC ${txType} gameCode=${gameCode} round=${roundId}`,
        },
      });
      return { before, after };
    });

    logger.info(`[GSC] handleTransaction userId=${userId} type=${type} amount=${amt} roundId=${roundId}`);
    return { code: SEAMLESS_CODE.SUCCESS, before_balance: result.before, balance: result.after };
  }
}

GSCProvider.SEAMLESS_CODE  = SEAMLESS_CODE;
GSCProvider.OPERATOR_CODE  = OPERATOR_CODE;

module.exports = GSCProvider;
