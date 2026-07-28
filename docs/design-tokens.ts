/**
 * LKVIP GROUP — Design Token Reference
 * docs/design-tokens.ts (reference only — not imported at runtime)
 *
 * All 5 sub-app themes in one canonical file.
 * Implementations live in each app's src/index.css (:root variables).
 */

// ─────────────────────────────────────────────────────────────────────────────
// GAME — BMW M (dark, technical, minimal)
// ─────────────────────────────────────────────────────────────────────────────
export const GAME = {
  surfaces: {
    canvas:         '#000000',
    surfaceSoft:    '#0d0d0d',
    surfaceCard:    '#1a1a1a',
    surfaceElevated:'#262626',
    carbon:         '#2b2b2b',
    hairline:       '#3c3c3c',
  },
  brand: {
    mBlueLight:     '#0066b1',
    mBlueDark:      '#1c69d4',
    mRed:           '#e22718',
    electricBlue:   '#0653b6',
  },
  text: {
    ink:            '#ffffff',
    bodyStrong:     '#e6e6e6',
    body:           '#bbbbbb',
    muted:          '#7e7e7e',
  },
  radius: { default: 0, icon: 9999 },
  shadow: 'none', // depth via color contrast only
  font:   '"BMW Type Next Latin", "Inter", system-ui, sans-serif',
  spacing: [4, 8, 12, 16, 24, 40, 64, 96] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HUB — Meta (commerce, friendly, modern)
// ─────────────────────────────────────────────────────────────────────────────
export const HUB = {
  brand: {
    cobaltPrimary:  '#0064e0',
    deepCobalt:     '#0457cb',
    facebookBlue:   '#1876f2',
    metaLink:       '#385898',
    oculusPurple:   '#a121ce',
  },
  surfaces: {   // default dark-WAP
    canvas:         '#0e0e0e',
    card:           '#181818',
    secondary:      '#252525',
    elevated:       '#1e1e1e',
    border:         '#333333',
  },
  surfacesLight: { // .light class
    canvas:         '#ffffff',
    softCloud:      '#f1f4f7',
    hairline:       '#ced0d4',
    hairlineSoft:   '#dee3e9',
  },
  text: {
    deepInk:        '#0a1317',
    ink:            '#1c1e21',
    charcoal:       '#444950',
    steel:          '#5d6c7b',
    stone:          '#8595a4',
  },
  semantic: {
    success:        '#31a24c',
    attention:      '#f2a918',
    warning:        '#f7b928',
    critical:       '#e41e3f',
  },
  radius: { xs: 2, sm: 4, md: 8, lg: 16, xl: 24, xxl: 32, xxxl: 40, pill: 100 } as const,
  shadow: { subtle: '0 1px 4px rgba(0,0,0,0.08)', panel: '0 4px 24px rgba(0,0,0,0.12)' },
  font:   '"Optimistic VF", "Segoe UI", system-ui, sans-serif',
  spacing: [4, 8, 12, 16, 24, 32, 48, 64, 80, 120] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TRADE — Binance (finance, data, trading)
// ─────────────────────────────────────────────────────────────────────────────
export const TRADE = {
  brand: {
    primary:        '#FCD535',
    primaryActive:  '#f0b90b',
    primaryDisabled:'#3a3a1f',
    turquoise:      '#2dbdb6',
  },
  surfacesDark: {
    canvas:         '#0b0e11',
    card:           '#1e2329',
    elevated:       '#2b3139',
    hairline:       '#2b3139',
  },
  surfacesLight: {
    canvas:         '#ffffff',
    soft:           '#fafafa',
    strong:         '#f5f5f5',
    hairline:       '#eaecef',
  },
  text: {
    ink:            '#181a20',
    bodyOnDark:     '#eaecef',
    muted:          '#707a8a',
    mutedStrong:    '#929aa5',
  },
  trading: {
    up:             '#0ecb81',
    down:           '#f6465d',
    info:           '#3b82f6',
  },
  radius: { xs: 2, sm: 4, md: 6, lg: 8, xl: 12, pill: 9999 } as const,
  shadow: 'none',
  font:   '"BinanceNova", -apple-system, sans-serif',
  fontMono: '"BinancePlex Mono", "JetBrains Mono", monospace',
  spacing: [4, 8, 12, 16, 24, 32, 48, 80] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SPORTS — ESPN (dynamic, energetic, youthful)
// ─────────────────────────────────────────────────────────────────────────────
export const SPORTS = {
  brand: {
    green:          '#00A651',
    dark:           '#007A3D',
    light:          '#E8F5E9',
    orange:         '#FF6B00',
  },
  surfaces: {
    canvas:         '#FFFFFF',
    soft:           '#F5F7FA',
    card:           '#FFFFFF',
    border:         '#E5E7EB',
  },
  text: {
    ink:            '#1A1A2E',
    body:           '#333333',
    muted:          '#888888',
  },
  semantic: {
    liveRed:        '#FF2D2D',
    homeBlue:       '#1A73E8',
    awayRed:        '#E53935',
  },
  radius: { sm: 4, md: 8, lg: 12, xl: 16, pill: 9999 } as const,
  shadow: { sm: '0 2px 8px rgba(0,0,0,0.08)', md: '0 4px 16px rgba(0,0,0,0.10)' },
  font:   '"Inter", system-ui, sans-serif',
  spacing: [4, 8, 12, 16, 20, 24, 32, 48] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DATING — Tinder/Bumble (romantic, gentle, bright)
// ─────────────────────────────────────────────────────────────────────────────
export const DATING = {
  brand: {
    rose:           '#FF4D8A',
    roseDark:       '#D63A6E',
    roseLight:      '#FFE1EC',
    softPink:       '#FFF0F5',
  },
  surfaces: {
    canvas:         '#FFFFFF',
    soft:           '#FAFAFA',
    card:           '#FFFFFF',
    sheet:          '#F5F5F7',
    border:         '#F3F4F6',
    borderMedium:   '#E5E7EB',
  },
  text: {
    ink:            '#2D1B2E',
    body:           '#4A3B4A',
    muted:          '#B8A5B8',
  },
  semantic: {
    success:        '#43B581',
    online:         '#43B581',
    like:           '#FF3B5C',
    pass:           '#A8A8A8',
    vipGold:        '#eab308',
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const,
  shadow: { sm: '0 4px 12px rgba(0,0,0,0.08)', card: '0 2px 16px rgba(255,77,138,0.10)' },
  fontDisplay: '"Playfair Display", "Georgia", serif',
  fontBody:    '"Inter", system-ui, sans-serif',
  spacing: [4, 8, 12, 16, 20, 24, 32, 48] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Responsive breakpoints (shared)
// ─────────────────────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
  mobile:  480,
  tablet:  768,
  desktop: 1024,
  wide:    1360,
  max:     1440,
} as const;
