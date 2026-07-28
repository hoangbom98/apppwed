/**
 * game/src/theme/gameTheme.ts
 * BMW M–inspired dark theme tokens for LKVIP Game.
 * Imported by main.tsx for ConfigProvider (if antd is used), and as
 * a reference for CSS custom properties in index.css.
 */

/** CSS custom-property tokens — keep in sync with index.css :root */
export const GAME_TOKENS = {
  // ── Surfaces ────────────────────────────────────────────────────
  canvas:           '#000000',
  surfaceSoft:      '#0d0d0d',
  surfaceCard:      '#1a1a1a',
  surfaceElevated:  '#262626',
  carbonGray:       '#2b2b2b',
  hairline:         '#3c3c3c',

  // ── M‑Tricolor brand ────────────────────────────────────────────
  mBlueLight:       '#0066b1',
  mBlueDark:        '#1c69d4',
  mRed:             '#e22718',
  electricBlue:     '#0653b6',

  // ── Text ────────────────────────────────────────────────────────
  ink:              '#ffffff',
  bodyStrong:       '#e6e6e6',
  body:             '#bbbbbb',
  muted:            '#7e7e7e',

  // ── Radius ──────────────────────────────────────────────────────
  borderRadius:     0,
  borderRadiusIcon: 9999,
} as const;

/** Ant Design ThemeConfig (used only if antd is pulled into game app) */
export const gameAntdTheme = {
  token: {
    colorPrimary:   GAME_TOKENS.mBlueDark,
    colorBgBase:    GAME_TOKENS.canvas,
    colorTextBase:  GAME_TOKENS.ink,
    borderRadius:   GAME_TOKENS.borderRadius,
    fontFamily:     '"BMW Type Next Latin", "Inter", system-ui, sans-serif',
    fontSize:       14,
  },
  components: {
    Button: {
      borderRadius:        0,
      fontWeight:          700,
      colorPrimary:        GAME_TOKENS.mBlueDark,
      colorPrimaryHover:   GAME_TOKENS.mBlueLight,
    },
    Card: {
      borderRadius:        0,
      colorBgContainer:    GAME_TOKENS.surfaceCard,
    },
  },
};
