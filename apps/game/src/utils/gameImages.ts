/**
 * gameImages.ts — TCGaming image URL resolver
 * =============================================
 * Mirrors logic from /var/www/wap/src/views/game/SlotHall.vue (normalizeCover)
 * and /var/www/wap/src/views/game/components/CategorySection.vue (formatImageUrl).
 *
 * Two image sources:
 *
 * 1. TCGaming CDN (remote — official icons per provider+game_code):
 *    https://images.b728484.com:42666/TCG_GAME_ICONS/{PROVIDER}/{game_code}.png
 *    Vietnamese locale variants: …/TCG_GAME_ICONS/{PROVIDER}/VI/{game_code}.png
 *    Source: /var/www/wap/src/config/game/storages/rng|fish|chess/{provider}.json
 *
 * 2. Local avif thumbnails (static files served from /var/www/wap/public/):
 *    /game_pictures/p/280/L1/{tc_product_code}/{game_db_id}/custom_VND.avif
 *    tc_product_code = numeric TC-Gaming product code (from TC_PRODUCTS seed)
 *    game_db_id      = sequential database ID of the game row
 *    Source: /var/www/wap/public/game_pictures/p/280/L1/
 *
 * Usage:
 *   tcgIcon('PG', 'PG0129')             → CDN URL for PG game
 *   tcgIconVI('PG', 'PG0129')           → CDN URL with VI locale
 *   tcgLocalAvif(98, 3)                  → local avif for TC product 98 (PG), game id 3
 *   resolveGameImage(game)               → auto-resolve best URL with fallback
 */

// ── TCGaming CDN base ────────────────────────────────────────────────────────
const TCG_CDN = 'https://images.b728484.com:42666/TCG_GAME_ICONS';

/**
 * Build TCGaming CDN icon URL.
 * @param provider  Uppercase provider folder: 'PG' | 'CQ9' | 'JL' | 'JDB' | 'FC' | 'KA' | 'MGS' | 'PT'
 * @param gameCode  Provider game code string: 'PG0129', 'CQ0432', 'JL0050', etc.
 * @param locale    Optional locale sub-folder: 'VI' (Vietnamese). Not all providers have it.
 */
export function tcgIcon(
  provider: string,
  gameCode: string,
  locale?: 'VI',
): string {
  const p = provider.toUpperCase();
  if (locale) {
    return `${TCG_CDN}/${p}/${locale}/${gameCode}.png`;
  }
  return `${TCG_CDN}/${p}/${gameCode}.png`;
}

/** Shorthand: Vietnamese locale icon (PG, JDB support VI sub-folder) */
export const tcgIconVI = (provider: string, gameCode: string) =>
  tcgIcon(provider, gameCode, 'VI');

// ── TCGaming numeric product code map (TC_PRODUCTS seed) ────────────────────
// Used to build local avif paths: /game_pictures/p/280/L1/{code}/{id}/custom_VND.avif
// Matches numeric codes in apps/backend/prisma/seeds/gameProducts.seed.ts TC_PRODUCTS
export const TC_PRODUCT_CODES = {
  TCGL:   2,    // TCG LOTTO
  TTG:    9,    // Toptrend Gaming
  HB:     13,   // Habanero
  CQ9:    16,   // CQ9 Gaming
  DG:     27,   // DreamGaming
  PP:     39,   // Pragmatic Play
  BG:     41,   // BigGame
  MG:     43,   // Micro Gaming
  BTI:    47,   // BTI Sports
  JDB:    55,   // JDB
  LB:     64,   // LB-KENO
  BBIN:   79,   // BBIN
  SA:     93,   // SA Gaming
  PG:     98,   // PG Soft (Pocket Games Soft)
  SEX:    112,  // Sexy AWC
  WM:     118,  // WM Casino
  JL:     140,  // JILI (TCGaming code = 140, abbrev JL)
  FC:     141,  // Fachai Gaming
  SG:     144,  // Spade Gaming
  KA:     157,  // KA Gaming
  BNG:    161,  // Booongo
  R88:    162,  // Rich88
  EG4:    172,  // Evolution Casino (TC)
  EZ:     177,  // Ezugi
  SPB:    193,  // Spribe
  PGE:    194,  // PG Soft (E)
  YGD:    215,  // Yggdrasil
  FS:     216,  // Fastspin
  WOW:    218,  // WOW Gaming
  AVT:    276,  // Aviator
} as const;

/**
 * Build local avif thumbnail path (served from /var/www/wap/public/).
 * Matches: /game_pictures/p/280/L1/{tc_product_code}/{game_db_id}/custom_VND.avif
 *
 * @param tcProductCode  Numeric TC-Gaming product code (use TC_PRODUCT_CODES)
 * @param gameDbId       Sequential DB id of the game row (1-based integer)
 */
export function tcgLocalAvif(tcProductCode: number, gameDbId: number): string {
  return `/game_pictures/p/280/L1/${tcProductCode}/${gameDbId}/custom_VND.avif`;
}

// ── Provider logo icons (platform sidebar & badges) ─────────────────────────
// Mirrors getPlatformIcon() in /var/www/wap/src/views/game/SlotHall.vue
export const PROVIDER_LOGO_MAP: Record<string, string> = {
  // TC-Gaming lobby
  TCG:   '/game_pictures/p/280/L1/2/1/custom_VND.avif',
  // Slot providers — local avif (TC product codes)
  PG:    tcgLocalAvif(TC_PRODUCT_CODES.PG,  1),
  PGSOFT: tcgLocalAvif(TC_PRODUCT_CODES.PG, 1),
  FC:    tcgLocalAvif(TC_PRODUCT_CODES.FC,  1),
  PP:    tcgLocalAvif(TC_PRODUCT_CODES.PP,  1),
  JDB:   tcgLocalAvif(TC_PRODUCT_CODES.JDB, 1),
  CQ9:   tcgLocalAvif(TC_PRODUCT_CODES.CQ9, 1),
  KA:    tcgLocalAvif(TC_PRODUCT_CODES.KA,  1),
  MG:    tcgLocalAvif(TC_PRODUCT_CODES.MG,  1),
  HB:    tcgLocalAvif(TC_PRODUCT_CODES.HB,  1),
  // JILI — TCGaming code is 140 (abbrev JL)
  JL:    tcgLocalAvif(TC_PRODUCT_CODES.JL,  1),
  JILI:  tcgLocalAvif(TC_PRODUCT_CODES.JL,  1),
  // Live casino
  WM:    tcgLocalAvif(TC_PRODUCT_CODES.WM,  1),
  SA:    tcgLocalAvif(TC_PRODUCT_CODES.SA,  1),
  SEX:   tcgLocalAvif(TC_PRODUCT_CODES.SEX, 1),
  EVO:   tcgLocalAvif(TC_PRODUCT_CODES.EG4, 1),
  DG:    tcgLocalAvif(TC_PRODUCT_CODES.DG,  1),
  // Sports
  BTI:   tcgLocalAvif(TC_PRODUCT_CODES.BTI, 1),
  BBIN:  tcgLocalAvif(TC_PRODUCT_CODES.BBIN, 1),
  // Wap-style fallback images (still referenced by some existing code)
  AG:    '/wap/fs/game/wap/ag.webp',
  SBO:   '/wap/fs/game/wap/sbo.webp',
};

export function getProviderLogo(code: string): string {
  return (
    PROVIDER_LOGO_MAP[code?.toUpperCase()] ??
    PROVIDER_LOGO_MAP['PG']
  );
}

// ── Game item shape (used by GameGrid) ────────────────────────────────────────
export interface TCGameItem {
  id: string;
  name: string;
  /** Resolved image URL — CDN PNG or local avif */
  icon: string;
  gameCode?: string;  // provider game code, e.g. 'PG0129'
  tcProductCode?: number;
  gameDbId?: number;
  link?: string;
}

/**
 * Create a game item with TCGaming CDN icon.
 * Providers that have VI locale: PG, JDB.
 */
export function makeTCGGame(
  id: string,
  name: string,
  provider: string,
  gameCode: string,
  useVI = false,
): TCGameItem {
  return {
    id,
    name,
    icon: useVI ? tcgIconVI(provider, gameCode) : tcgIcon(provider, gameCode),
    gameCode,
  };
}

/**
 * Create a game item with a local avif thumbnail.
 * Falls back to CDN icon if avif is not available (handled by onError in GameGrid).
 */
export function makeTCGLocalGame(
  id: string,
  name: string,
  tcProductCode: number,
  gameDbId: number,
): TCGameItem {
  return {
    id,
    name,
    icon: tcgLocalAvif(tcProductCode, gameDbId),
    tcProductCode,
    gameDbId,
  };
}

/**
 * normalizeCover — mirrors SlotHall.vue normalizeCover()
 * Converts any raw game object from the API response to a resolved image URL.
 *
 * Priority:
 *   1. Already a /game_pictures/ path → use as-is
 *   2. Starts with https:// → use as-is (CDN URL)
 *   3. Old admin upload path /app/admin/upload/img/ → avif fallback
 *   4. No URL → build avif from product_type + game_code
 */
export function normalizeCover(game: {
  cover?: string;
  icon?: string;
  product_type?: string | number;
  gameId?: string | number;
  game_code?: string | number;
}): string {
  const url = game.cover || game.icon || '';

  if (url.startsWith('/game_pictures/')) return url;
  if (url.startsWith('https://') || url.startsWith('http://')) return url;
  if (url.includes('/app/admin/upload/img/') || url.includes('/upload/img/')) {
    // Legacy admin upload → rebuild avif path
    const pt   = game.product_type ?? 'default';
    const code = game.gameId ?? game.game_code ?? 'Lobby';
    return `/game_pictures/p/280/L1/${pt}/${code}/custom_VND.avif`;
  }
  // No valid URL — fallback to avif
  const pt   = game.product_type ?? 'default';
  const code = game.gameId ?? game.game_code ?? 'Lobby';
  return `/game_pictures/p/280/L1/${pt}/${code}/custom_VND.avif`;
}
