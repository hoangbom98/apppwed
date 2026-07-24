// backend/src/modules/game/services/launch/GameCategoryMapping.js
/**
 * Game Category & Platform Mapping
 *
 * Defines the exact frontend-facing categories and platforms as documented
 * in GAME_LAUNCH_API.md.  The frontend NEVER changes — only this file
 * maps each platform to an aggregator + product code.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Frontend category (categoryCode)                                    │
 * │      └─ gameType (e.g. SLOT, LIVE_CASINO, SPORTSBOOK)               │
 * │              └─ platforms (e.g. PG, JILI, SBO)                      │
 * │                      └─ aggregator + productCode per platform        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Platform → Aggregator routing:
 *   GSC:      uses productCode (numeric string), launches via launchGame()
 *   GOLDGATE: uses vendorCode (string), launches via getLaunchUrl()
 *   TCGAMING: uses productCode (numeric string), launches via getLaunchUrl()
 */
'use strict';

// ── Category → gameType ───────────────────────────────────────────────────────
const CATEGORY_TO_GAME_TYPE = {
  SLOT:      'SLOT',         // Default / Nổ Hũ
  CASINO:    'LIVE_CASINO',  // Casino Trực Tuyến
  BAN_CA:    'FISHING',      // Bắn Cá
  GAME_BAI:  'TABLE_GAME',   // Game Bài / Poker
  THE_THAO:  'SPORTSBOOK',   // Thể Thao
  DA_GA:     'COCKFIGHTING', // Đá Gà
  XO_SO:     'LOTTERY',      // Xổ Số
  E_SPORTS:  'E_SPORTS',     // E-Sports
  POKER:     'POKER',        // Poker
};

// ── Platform definitions ──────────────────────────────────────────────────────
// Each platform entry: { name, aggregator, productCode, gameType (override if different from category) }
// productCode:
//   GSC      → numeric string matching game_db product catalog
//   GOLDGATE → vendorCode string (e.g. 'pg-soft')
//   TCGAMING → numeric string matching TC Gaming product table

const PLATFORM_DEFS = {
  // ── SLOT ─────────────────────────────────────────────────────────────────
  PG:        { name: 'PG Soft',         aggregator: 'GSC',      productCode: '1007', gameType: 'SLOT' },
  JILI:      { name: 'JILI',            aggregator: 'GSC',      productCode: '1091', gameType: 'SLOT' },
  JDB:       { name: 'JDB',             aggregator: 'GSC',      productCode: '1085', gameType: 'SLOT' },
  PP:        { name: 'Pragmatic Play',  aggregator: 'GSC',      productCode: '1006', gameType: 'SLOT' },
  FC:        { name: 'FaChai',          aggregator: 'GSC',      productCode: '1079', gameType: 'SLOT' },
  CQ9:       { name: 'CQ9',             aggregator: 'GSC',      productCode: '1009', gameType: 'SLOT' },
  SPADE:     { name: 'Spade Gaming',    aggregator: 'GSC',      productCode: '1221', gameType: 'SLOT' },
  JOKER:     { name: 'Joker',           aggregator: 'GSC',      productCode: '1225', gameType: 'SLOT' },
  HABANERO:  { name: 'Habanero',        aggregator: 'GSC',      productCode: '1197', gameType: 'SLOT' },
  KA:        { name: 'KA Gaming',       aggregator: 'GSC',      productCode: '1238', gameType: 'SLOT' },
  NAGA:      { name: 'Naga Games',      aggregator: 'GOLDGATE', productCode: 'naga', gameType: 'SLOT' },
  MG:        { name: 'Micro Gaming',    aggregator: 'GSC',      productCode: '1251', gameType: 'SLOT' },
  SPRIBE:    { name: 'Spribe',          aggregator: 'GSC',      productCode: '1138', gameType: 'SLOT' },
  BOOONGO:   { name: 'Booongo',         aggregator: 'GSC',      productCode: '1070', gameType: 'SLOT' },
  NLC:       { name: 'No Limit City',   aggregator: 'GSC',      productCode: '1166', gameType: 'SLOT' },
  BTG:       { name: 'Big Time Gaming', aggregator: 'GSC',      productCode: '1167', gameType: 'SLOT' },
  HS:        { name: 'Hacksaw Gaming',  aggregator: 'GSC',      productCode: '1153', gameType: 'SLOT' },

  // ── LIVE_CASINO ──────────────────────────────────────────────────────────
  DG:        { name: 'Dream Gaming',    aggregator: 'GSC',      productCode: '1052', gameType: 'LIVE_CASINO' },
  SEXY:      { name: 'Sexy Baccarat',   aggregator: 'GSC',      productCode: '1022', gameType: 'LIVE_CASINO' },
  AG:        { name: 'Asia Gaming',     aggregator: 'GOLDGATE', productCode: 'ag',   gameType: 'LIVE_CASINO' },
  BB:        { name: 'Big Gaming',      aggregator: 'GSC',      productCode: '1004', gameType: 'LIVE_CASINO' },
  SA:        { name: 'SA Gaming',       aggregator: 'GSC',      productCode: '1185', gameType: 'LIVE_CASINO' },
  WM:        { name: 'WM Casino',       aggregator: 'GSC',      productCode: '1020', gameType: 'LIVE_CASINO' },
  EVO:       { name: 'Evolution Gaming',aggregator: 'GOLDGATE', productCode: 'casino-evolution', gameType: 'LIVE_CASINO' },
  PRETTY:    { name: 'Pretty Gaming',   aggregator: 'GSC',      productCode: '1194', gameType: 'LIVE_CASINO' },
  SA_BACCARAT:{ name: 'SA Baccarat',    aggregator: 'GOLDGATE', productCode: 'sa-gaming', gameType: 'LIVE_CASINO' },

  // ── FISHING ──────────────────────────────────────────────────────────────
  // (JILI, JDB, CQ9, SPADE reuse same aggregator+productCode but gameType overrides)
  // Note: same platform code resolves same aggregator — gameType passed separately

  // ── TABLE_GAME ───────────────────────────────────────────────────────────
  V8:        { name: 'V8 Poker',        aggregator: 'TCGAMING', productCode: '102',  gameType: 'TABLE_GAME' },
  KY:        { name: 'KaiYuan Gaming',  aggregator: 'TCGAMING', productCode: '38',   gameType: 'TABLE_GAME' },
  LEG:       { name: 'LE Gaming',       aggregator: 'TCGAMING', productCode: '143',  gameType: 'TABLE_GAME' },

  // ── SPORTSBOOK ───────────────────────────────────────────────────────────
  SABA:      { name: 'SABA Sports',     aggregator: 'GSC',      productCode: '1046', gameType: 'SPORTSBOOK' },
  CMD:       { name: 'CMD368',          aggregator: 'TCGAMING', productCode: '104',  gameType: 'SPORTSBOOK' },
  SBO:       { name: 'SBO Sports',      aggregator: 'GSC',      productCode: '1012', gameType: 'SPORTSBOOK' },
  BTI:       { name: 'BTI Sports',      aggregator: 'TCGAMING', productCode: '47',   gameType: 'SPORTSBOOK' },
  IM:        { name: 'IM Sports',       aggregator: 'GSC',      productCode: '1235', gameType: 'SPORTSBOOK' },
  PANDA:     { name: 'Panda Sports',    aggregator: 'TCGAMING', productCode: '131',  gameType: 'SPORTSBOOK' },
  UG:        { name: 'United Gaming',   aggregator: 'TCGAMING', productCode: '151',  gameType: 'SPORTSBOOK' },
  FB:        { name: 'FB Sport',        aggregator: 'GSC',      productCode: '1183', gameType: 'SPORTSBOOK' },

  // ── COCKFIGHTING ─────────────────────────────────────────────────────────
  SV388:     { name: 'SV388',           aggregator: 'GSC',      productCode: '1033', gameType: 'COCKFIGHTING' },
  WS168:     { name: 'WS168',           aggregator: 'TCGAMING', productCode: '202',  gameType: 'COCKFIGHTING' },

  // ── LOTTERY ──────────────────────────────────────────────────────────────
  LOTTERY_VN:{ name: 'TCG Lotto VN',    aggregator: 'TCGAMING', productCode: '420',  gameType: 'LOTTERY' },
  TCG_SEA:   { name: 'TCG SEA Lotto',   aggregator: 'TCGAMING', productCode: '384',  gameType: 'LOTTERY' },
  TCG_LOTTO: { name: 'TCG Lotto',       aggregator: 'TCGAMING', productCode: '2',    gameType: 'LOTTERY' },
  KENO:      { name: 'LB Keno',         aggregator: 'TCGAMING', productCode: '64',   gameType: 'LOTTERY' },
  QQKENO:    { name: 'QQ Keno',         aggregator: 'GSC',      productCode: '1232', gameType: 'LOTTERY' },

  // ── E_SPORTS ─────────────────────────────────────────────────────────────
  IMES:      { name: 'IM Esports',      aggregator: 'GSC',      productCode: '1236', gameType: 'E_SPORTS' },
  TF:        { name: 'TF Gaming',       aggregator: 'TCGAMING', productCode: '99',   gameType: 'E_SPORTS' },

  // ── POKER ────────────────────────────────────────────────────────────────
  AMBPOKER:  { name: 'Ambpoker',        aggregator: 'GSC',      productCode: '1205', gameType: 'POKER' },
  KP:        { name: 'Kings Poker',     aggregator: 'TCGAMING', productCode: '123',  gameType: 'POKER' },
};

// ── Platform lists per game type ──────────────────────────────────────────────
// Build from PLATFORM_DEFS — single source of truth
const GAME_TYPE_PLATFORMS = {};
for (const [code, def] of Object.entries(PLATFORM_DEFS)) {
  const gt = def.gameType;
  if (!GAME_TYPE_PLATFORMS[gt]) GAME_TYPE_PLATFORMS[gt] = [];
  if (!GAME_TYPE_PLATFORMS[gt].find(p => p.code === code)) {
    GAME_TYPE_PLATFORMS[gt].push({ code, name: def.name });
  }
}

// FISHING platforms reuse the SLOT platforms that support fishing
GAME_TYPE_PLATFORMS['FISHING'] = [
  { code: 'JILI',  name: 'JILI Fishing' },
  { code: 'JDB',   name: 'JDB Fishing'  },
  { code: 'CQ9',   name: 'CQ9 Fishing'  },
  { code: 'SPADE', name: 'Spade Gaming Fishing' },
];

// ── Exports ────────────────────────────────────────────────────────────────────

/**
 * Get the internal game type for a frontend category code.
 * @param {string} categoryCode  e.g. 'CASINO', 'THE_THAO', 'SLOT'
 * @returns {string}             e.g. 'LIVE_CASINO', 'SPORTSBOOK', 'SLOT'
 */
function getGameType(categoryCode) {
  return CATEGORY_TO_GAME_TYPE[categoryCode?.toUpperCase()] || 'SLOT';
}

/**
 * Get the platform codes supported for a given category.
 * @param {string} categoryCode
 * @returns {string[]}
 */
function getSupportedPlatforms(categoryCode) {
  const gameType = getGameType(categoryCode);
  return (GAME_TYPE_PLATFORMS[gameType] || []).map(p => p.code);
}

/**
 * Get platform objects {code, name} for a given category.
 * @param {string} categoryCode
 * @returns {{ code:string, name:string }[]}
 */
function getPlatformList(categoryCode) {
  const gameType = getGameType(categoryCode);
  return GAME_TYPE_PLATFORMS[gameType] || [];
}

/**
 * Get full definition for a platform code.
 * @param {string} platformCode  e.g. 'JILI', 'EVO', 'SBO'
 * @returns {{ name, aggregator, productCode, gameType } | undefined}
 */
function getPlatformDef(platformCode) {
  return PLATFORM_DEFS[platformCode?.toUpperCase()];
}

/**
 * Get all categories with their platform count.
 * @returns {{ code, game_type, platform_count, platforms }[]}
 */
function getAllCategories() {
  return Object.entries(CATEGORY_TO_GAME_TYPE).map(([code, gameType]) => ({
    code,
    game_type:      gameType,
    platform_count: (GAME_TYPE_PLATFORMS[gameType] || []).length,
    platforms:      (GAME_TYPE_PLATFORMS[gameType] || []),
  }));
}

module.exports = {
  getGameType,
  getSupportedPlatforms,
  getPlatformList,
  getPlatformDef,
  getAllCategories,
  PLATFORM_DEFS,
  CATEGORY_TO_GAME_TYPE,
};
