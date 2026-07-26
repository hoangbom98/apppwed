/**
 * @lkvip/constants — assets.ts
 *
 * Single source-of-truth for image dimensions, aspect ratios, and Tailwind
 * classes used across all LKVIP apps (Hub, Game, Dating, Sports, Trade, Admin).
 *
 * Matches the official Image Standards document:
 *   .bob/skills/lkvip-group/reference/image-standards.md
 */

// ─────────────────────────────────────────────────────────────────────────────
// TAILWIND ASPECT-RATIO CLASSES
// ─────────────────────────────────────────────────────────────────────────────

export const ASPECT = {
  SQUARE:     'aspect-square',          // 1:1
  VIDEO:      'aspect-video',           // 16:9
  BANNER:     'aspect-[3/2]',           // 3:2
  ARTICLE:    'aspect-[4/3]',           // 4:3
  HERO_MOBILE:'aspect-[2/1]',           // 2:1
  HERO_DESK:  'aspect-[3/1]',           // 3:1
  SPORTS:     'aspect-[16/10]',         // 16:10
  OG:         'aspect-[19/10]',         // ~1.9:1 (OG image)
} as const;

export type AspectKey = keyof typeof ASPECT;

// ─────────────────────────────────────────────────────────────────────────────
// PIXEL DIMENSIONS (source / storage size)
// Used by backend Sharp validator and upload UI hints.
// ─────────────────────────────────────────────────────────────────────────────

export const IMAGE_DIMS = {
  /** SVG-preferred. Used in all app headers. */
  LOGO: { w: 400, h: 120, ratio: '3.3:1', display: { desktop: '200×60', mobile: '120×36' } },

  /** Multi-size: 64, 32, 16 — export all. */
  FAVICON: { w: 64, h: 64, ratio: '1:1' },

  /** Circular crop. Store 400×400, display at 64 desktop / 48 mobile. */
  AVATAR_USER: { w: 400, h: 400, ratio: '1:1', display: { desktop: '64×64', mobile: '48×48' } },

  /** Game grid icon, sports team badge. */
  AVATAR_GAME: { w: 200, h: 200, ratio: '1:1', display: { desktop: '128×128', mobile: '74×74' } },

  /** Full-width hero slider — two separate files. */
  BANNER_HERO_DESKTOP: { w: 1920, h: 640, ratio: '3:1' },
  BANNER_HERO_MOBILE:  { w: 640,  h: 320, ratio: '2:1' },

  /** Promotional card banner (3:2). */
  BANNER_CARD: { w: 800, h: 533, ratio: '3:2', display: { desktop: '600×400', mobile: '300×200' } },

  /** Centred popup overlay (3:2). */
  BANNER_POPUP: { w: 600, h: 400, ratio: '3:2', display: { desktop: '600×400', mobile: '340×227' } },

  /** Game/product grid lists. */
  THUMBNAIL_GAME: { w: 400, h: 400, ratio: '1:1', display: { desktop: '200×200', mobile: '150×150' } },

  /** Zoom-preview gallery image. */
  PRODUCT_DETAIL: { w: 800, h: 800, ratio: '1:1', display: { desktop: '800×800', mobile: '400×400' } },

  /** OG/Twitter card image for news and articles. */
  ARTICLE_OG: { w: 1200, h: 630, ratio: '1.9:1', display: { desktop: '1200×630', mobile: '600×315' } },

  /** List-view card illustration. */
  ARTICLE_THUMB: { w: 400, h: 300, ratio: '4:3', display: { desktop: '400×300', mobile: '300×225' } },

  /** Full-page background with `background-size: cover`. */
  BACKGROUND: { w: 1920, h: 1080, ratio: '16:9', display: { desktop: '1920×1080', mobile: '640×360' } },

  /** Must not scale below 200×200 to remain scannable. */
  QR_CODE: { w: 300, h: 300, ratio: '1:1' },

  /** Lucide SVG preferred; raster source for fallback. */
  ICON_FUNC: { w: 64, h: 64, ratio: '1:1', display: { desktop: '32×32', mobile: '24×24' } },

  /** Tutorial and help-centre illustrations. */
  SUPPORT_GUIDE: { w: 600, h: 400, ratio: '3:2', display: { desktop: '600×400', mobile: '300×200' } },

  /** VIP card / tier badge display. */
  BADGE_VIP: { w: 400, h: 400, ratio: '1:1', display: { desktop: '400×400', mobile: '200×200' } },

  /** Sports match preview, league banner. */
  SPORTS_EVENT: { w: 800, h: 500, ratio: '16:10', display: { desktop: '800×500', mobile: '400×250' } },

  /** Trading market overview header. */
  TRADE_MARKET: { w: 1200, h: 800, ratio: '3:2', display: { desktop: '1200×800', mobile: '600×400' } },

  /** Dating profile photo gallery. */
  DATING_PROFILE: { w: 800, h: 800, ratio: '1:1', display: { desktop: '800×800', mobile: '400×400' } },
} as const;

export type ImageDimKey = keyof typeof IMAGE_DIMS;

// ─────────────────────────────────────────────────────────────────────────────
// MAX FILE SIZES (bytes) — enforced on upload
// ─────────────────────────────────────────────────────────────────────────────

export const IMAGE_MAX_BYTES = {
  BANNER:    200 * 1024,   // 200 KB
  THUMBNAIL:  50 * 1024,   //  50 KB
  AVATAR:     30 * 1024,   //  30 KB
  ICON:       10 * 1024,   //  10 KB
  UPLOAD_RAW:  2 * 1024 * 1024,  // 2 MB (pre-compression source)
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND SHARP SPEC KEYS — used by image-validator.ts
// ─────────────────────────────────────────────────────────────────────────────

export const IMAGE_SPEC_KEY = {
  BANNER_HERO:   'banner-hero',
  BANNER_CARD:   'banner-card',
  BANNER_POPUP:  'banner-popup',
  THUMBNAIL:     'thumbnail-game',
  AVATAR_USER:   'avatar-user',
  ARTICLE_OG:    'article-og',
  BACKGROUND:    'background',
  SPORTS_EVENT:  'sports-event',
  DATING_PROFILE:'dating-profile',
  TRADE_MARKET:  'trade-market',
} as const;

export type ImageSpecKey = (typeof IMAGE_SPEC_KEY)[keyof typeof IMAGE_SPEC_KEY];

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — kept for backwards compatibility with existing AssetComponents.tsx
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use IMAGE_DIMS and ASPECT instead. */
export const ASSET_STANDARDS = {
  logo: {
    main:    { height: 'h-[60px]',  width: 'w-[200px]' },
    partner: { width:  'w-[180px]', height: 'h-[60px]' },
    icon:    { size: 'w-8 h-8' },
  },
  banner: {
    main: `${ASPECT.HERO_DESK} object-cover`,
    card: `${ASPECT.BANNER} object-cover rounded-lg`,
  },
  avatar: {
    user: 'w-16 h-16 rounded-full object-cover',
    game: 'w-32 h-32 object-contain',
    sm:   'w-12 h-12 rounded-full object-cover',
  },
  thumbnail: {
    game:    `${ASPECT.SQUARE} object-cover`,
    article: `${ASPECT.ARTICLE} object-cover`,
    sports:  `${ASPECT.SPORTS} object-cover`,
  },
  qrCode:   'w-[300px] h-[300px]',
  background: `${ASPECT.VIDEO} object-cover`,
} as const;
