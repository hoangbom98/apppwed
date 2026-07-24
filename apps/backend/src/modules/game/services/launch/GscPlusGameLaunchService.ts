// @ts-nocheck
// backend/src/modules/game/services/launch/GscPlusGameLaunchService.js
'use strict';
/**
 * GscPlusGameLaunchService
 *
 * Orchestrates game launches for all platforms (SLOT, CASINO, FISHING, etc.).
 * Resolves: category + platform → aggregator + productCode → game URL.
 *
 * The frontend API surface (as per GAME_LAUNCH_API.md) never changes:
 *   GET /api/v1/game/launch?category=SLOT&platform=JILI&game_code=xxx
 *
 * Internally this maps to the correct aggregator service:
 *   JILI, PG, PP, JDB, CQ9, FC, SA, WM, etc.  → GSCService.getLaunchUrl()
 *   EVO, AG, NAGA, SA_BACCARAT, etc.           → GoldgateService.getLaunchUrl()
 *   V8, KY, CMD, BTI, LOTTERY_VN, etc.         → TCGamingService.getLaunchUrl()
 */
const { getAggregator }  = require('../../../../shared/services/aggregators');
const { getPlatformDef, getGameType } = require('./GameCategoryMapping');
const logger             = require('../../../../shared/services/logger');

// GSC gameType string mapping for the GSC API param
const GSC_GAME_TYPE_MAP = {
  SLOT:          'SLOT',
  LIVE_CASINO:   'LIVE',
  FISHING:       'FISHING',
  TABLE_GAME:    'TABLE',
  SPORTSBOOK:    'SPORTS',
  COCKFIGHTING:  'SPORTS',
  LOTTERY:       'LOTTERY',
  E_SPORTS:      'ESPORT',
  POKER:         'POKER',
};

class GscPlusGameLaunchService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Launch a game — the single entry point called by GameLaunchController.
   *
   * @param {string} userId
   * @param {object} opts
   *   category      Frontend category code (e.g. 'SLOT', 'CASINO', 'THE_THAO')
   *   platform      Platform code (e.g. 'JILI', 'EVO', 'SBO', 'BTI')
   *   gameCode      Specific game code within the platform (optional — omit for lobby)
   *   platformType  'WEB' | 'MOBILE' | 'DESKTOP'  (default 'WEB')
   *   ip            Player IP
   *
   * @returns {{ game_url, platform, game_type, game_code }}
   */
  async launch(userId, { category, platform, gameCode, platformType = 'WEB', ip = '127.0.0.1' }) {
    const platformUpper = platform?.toUpperCase();
    const categoryUpper = category?.toUpperCase();

    // 1. Lookup platform definition (aggregator + productCode)
    const def = getPlatformDef(platformUpper);
    if (!def) {
      const err = new Error(`Platform "${platform}" is not configured`);
      err.status = 400;
      throw err;
    }

    // 2. Game type
    const gameType = def.gameType || getGameType(categoryUpper);

    // 3. Get player credentials for this aggregator
    const player = await this._ensureGameAccount(userId, def.aggregator);

    // 4. Get aggregator service instance
    const svc = await getAggregator(def.aggregator);

    // 5. Call the correct launch method for each aggregator
    let gameUrl;

    if (def.aggregator === 'GSC') {
      gameUrl = await this._launchGSC(svc, player, {
        userId,
        productCode:  def.productCode,
        gameCode:     gameCode || '',
        gameType:     GSC_GAME_TYPE_MAP[gameType] || 'SLOT',
        platformType: _normPlatformType(platformType),
        ip,
      });
    } else if (def.aggregator === 'GOLDGATE') {
      gameUrl = await this._launchGoldgate(svc, userId, {
        vendorCode: def.productCode,  // productCode = vendorCode for Goldgate
        gameCode:   gameCode || 'lobby',
      });
    } else if (def.aggregator === 'TCGAMING') {
      gameUrl = await this._launchTCGaming(svc, player, {
        productCode:  def.productCode,
        gameCode:     gameCode || '',
        platformType: _normPlatformType(platformType),
        ip,
      });
    } else {
      throw new Error(`No launch handler for aggregator: ${def.aggregator}`);
    }

    logger.info(`[GameLaunch] userId=${userId} cat=${categoryUpper} platform=${platformUpper} agg=${def.aggregator} product=${def.productCode}`);

    return {
      game_url:  gameUrl,
      platform:  platformUpper,
      game_type: gameType,
      game_code: gameCode || null,
      content:   null,
    };
  }

  // ── GSC launch ────────────────────────────────────────────────────────────

  async _launchGSC(svc, player, { userId, productCode, gameCode, gameType, platformType, ip }) {
    // svc is a GSCProvider instance — getLaunchUrl() accepts an options object (v2.0.6)
    return svc.getLaunchUrl({
      memberAccount: String(userId),
      password:      player.password,
      nickname:      player.nickname,
      productCode:   Number(productCode),
      gameCode:      gameCode || null,
      gameType,
      platform:      platformType, // 'WEB' | 'MOBILE' | 'DESKTOP'
      ip,
      operatorLobbyUrl: process.env.OPERATOR_LOBBY_URL || '',
    });
  }

  // ── Goldgate launch ───────────────────────────────────────────────────────

  async _launchGoldgate(svc, userId, { vendorCode, gameCode }) {
    return svc.getLaunchUrl(userId, vendorCode, gameCode || 'lobby');
  }

  // ── TC Gaming launch ──────────────────────────────────────────────────────

  async _launchTCGaming(svc, player, { productCode, gameCode, platformType, ip }) {
    return svc.getLaunchUrl({
      username:    player.tcUsername,
      productCode,
      gameCode:    gameCode || '',
      platform:    platformType === 'WEB' ? 'web' : 'h5',
      ip,
      language:    'vi',
    });
  }

  // ── Game account helpers ─────────────────────────────────────────────────

  /**
   * Ensure the user has a game account entry for the given aggregator.
   * Returns { password, nickname, tcUsername }.
   */
  async _ensureGameAccount(userId, aggregatorCode) {
    // Try dedicated gameAccount table
    try {
      const acct = await this.prisma.gameAccount?.findFirst({
        where:  { userId, providerCode: aggregatorCode },
        select: { password: true, nickname: true, tcUsername: true },
      });
      if (acct) return acct;
    } catch { /* table may not exist */ }

    // Derive from user record
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { username: true, fullName: true },
    });

    const nickname   = user?.username || user?.fullName || `user_${userId}`;
    const password   = `Gp${userId.slice(-8)}!`;   // deterministic, never exposed
    const tcUsername = `tc_${userId}`;

    // Persist if table exists
    try {
      await this.prisma.gameAccount?.upsert({
        where:  { userId_providerCode: { userId, providerCode: aggregatorCode } },
        update: {},
        create: { userId, providerCode: aggregatorCode, password, nickname, tcUsername },
      });
    } catch { /* ignore */ }

    return { password, nickname, tcUsername };
  }

  // Legacy helper — kept for backward compat
  mapPlatformToProvider(platform) {
    return getPlatformDef(platform)?.aggregator || 'GSC';
  }
}

// Normalize platform_type from frontend to aggregator-specific format
function _normPlatformType(platformType) {
  const pt = (platformType || 'WEB').toUpperCase();
  if (pt === 'MOBILE' || pt === 'H5') return 'H5';
  return 'WEB';
}

module.exports = GscPlusGameLaunchService;
