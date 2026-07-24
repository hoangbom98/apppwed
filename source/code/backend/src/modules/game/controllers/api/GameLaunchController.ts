// @ts-nocheck
/* eslint-disable */

// backend/src/modules/game/controllers/api/GameLaunchController.js
'use strict';
/**
 * GameLaunchController
 *
 * Implements the Game Launch API as documented in GAME_LAUNCH_API.md.
 * The response format is FIXED — frontend never changes.
 *
 * All responses use { code, message, data } envelope:
 *   200 → success
 *   400 → bad request / unsupported platform
 *   401 → unauthenticated
 *   404 → not found
 *   500 → server / aggregator error
 *
 * Endpoints:
 *   GET /api/v1/game/categories             — all categories + platform lists
 *   GET /api/v1/game/platforms?category=    — platforms for a category
 *   GET /api/v1/game/list?category=&platform= — game list from aggregator (Goldgate) or static
 *   GET /api/v1/game/launch?category=&platform=&game_code=&platform_type= — get launch URL
 */
const GscPlusGameLaunchService = require('../../services/launch/GscPlusGameLaunchService');
const { getAggregator }        = require('../../../../shared/services/aggregators');
const {
  getAllCategories,
  getPlatformList,
  getSupportedPlatforms,
  getPlatformDef,
  getGameType,
}                              = require('../../services/launch/GameCategoryMapping');

// ── Uniform response helpers ──────────────────────────────────────────────────

function apiOk(res, data, message = 'Success') {
  return res.json({ code: 200, message, data });
}

function apiErr(res, message, code = 500, extra = {}) {
  return res.status(code).json({ code, message, data: null, ...extra });
}

// ── GET /api/v1/game/categories ───────────────────────────────────────────────

exports.getCategories = (_req, res) => {
  try {
    const data = getAllCategories();
    return apiOk(res, data);
  } catch (err) {
    return apiErr(res, err.message);
  }
};

// ── GET /api/v1/game/platforms?category= ─────────────────────────────────────

exports.getPlatforms = (req, res) => {
  try {
    const { category } = req.query;

    if (category) {
      const gameType  = getGameType(category);
      const platforms = getPlatformList(category);
      return apiOk(res, { category, game_type: gameType, platforms });
    }

    // No category → return all
    const all = getAllCategories().map(c => ({
      category:   c.code,
      game_type:  c.game_type,
      platforms:  c.platforms,
    }));
    return apiOk(res, all);
  } catch (err) {
    return apiErr(res, err.message);
  }
};

// ── GET /api/v1/game/list?category=&platform= ─────────────────────────────────

exports.getGameList = async (req, res) => {
  try {
    const { category, platform, size = 100, offset = 0 } = req.query;

    if (!category || !platform) {
      return apiErr(res, 'category and platform are required', 400);
    }

    const platformUpper = platform.toUpperCase();
    const supported = getSupportedPlatforms(category);
    if (!supported.includes(platformUpper)) {
      return apiErr(res, `Platform ${platform} not supported for category ${category}`, 400, {
        supported_platforms: supported,
      });
    }

    const def = getPlatformDef(platformUpper);

    // Goldgate provides a live game list API
    if (def.aggregator === 'GOLDGATE') {
      try {
        const gg    = await getAggregator('GOLDGATE');
        const games = await gg.listGames(def.productCode);
        const slice = games.slice(Number(offset), Number(offset) + Number(size));
        return apiOk(res, {
          provider_games: slice.map(g => ({
            game_code:         g.gameCode,
            game_name:         g.gameName,
            game_type:         getGameType(category),
            image_url:         g.thumbnail || '',
            product_code:      def.productCode,
            support_currency:  'VND',
            status:            g.underMaintenance ? 'MAINTENANCE' : 'ACTIVATED',
            is_new:            g.isNew || false,
            external_id:       g.gameId || '',
          })),
          pagination: { size: Number(size), offset: Number(offset), total: games.length },
        });
      } catch (ggErr) {
        // Fall through to DB lookup on Goldgate failure
      }
    }

    // For GSC and TCGaming (and Goldgate fallback): return games from game_db
    const where = { status: 'active' };
    if (req.prisma) {
      // Try to fetch from Game table filtered by productCode
      try {
        const dbGames = await req.prisma.game.findMany({
          where: {
            ...where,
            product: { productCode: def.productCode },
          },
          take:    Number(size),
          skip:    Number(offset),
          orderBy: { sortOrder: 'asc' },
          include: { product: { select: { productCode: true, abbrev: true } } },
        });
        const total = await req.prisma.game.count({
          where: { ...where, product: { productCode: def.productCode } },
        });
        return apiOk(res, {
          provider_games: dbGames.map(g => ({
            game_code:        g.code,
            game_name:        g.name,
            game_type:        g.type,
            image_url:        g.thumbnail || '',
            product_code:     def.productCode,
            support_currency: 'VND',
            status:           g.underMaintenance ? 'MAINTENANCE' : 'ACTIVATED',
            is_new:           g.isNew || false,
            external_id:      g.externalId || '',
          })),
          pagination: { size: Number(size), offset: Number(offset), total },
        });
      } catch { /* prisma may not have Game model in all envs */ }
    }

    // Fallback: empty list (aggregator game sync not yet done)
    return apiOk(res, {
      provider_games: [],
      pagination: { size: 0, offset: 0, total: 0 },
    });
  } catch (err) {
    return apiErr(res, err.message);
  }
};

// ── GET /api/v1/game/launch ───────────────────────────────────────────────────

exports.launch = async (req, res) => {
  try {
    const { category, platform, game_code, platform_type } = req.query;

    if (!category || !platform) {
      return apiErr(res, 'Missing required parameters: category, platform', 400);
    }

    const platformUpper = platform.toUpperCase();
    const supported     = getSupportedPlatforms(category);

    if (!supported.includes(platformUpper)) {
      return apiErr(
        res,
        `Platform ${platform} not supported for category ${category}`,
        400,
        { supported_platforms: supported },
      );
    }

    if (!req.user) {
      return apiErr(res, 'Authentication required', 401);
    }

    const launchService = new GscPlusGameLaunchService(req.prisma);
    const result        = await launchService.launch(req.user.id, {
      category,
      platform,
      gameCode:     game_code  || null,
      platformType: platform_type || 'WEB',
      ip:           req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    return apiOk(res, result, 'Game launched successfully');
  } catch (err) {
    const code = err.status || 500;
    return apiErr(res, err.message, code);
  }
};
