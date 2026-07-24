// game/src/utils/index.ts
// ─────────────────────────────────────────────────────────────────────────
// Barrel export — all utility modules.
// English-named entries are preferred; Vietnamese names are legacy stubs.
// ─────────────────────────────────────────────────────────────────────────

// ── Formatters (from @ui — canonical) ────────────────────────────────────
export { formatVND, formatNumber, formatDate, formatDateTime, relativeTime, truncate, clamp } from './dinhDang';

// ── Constants ─────────────────────────────────────────────────────────────
export * from './constants';   // English alias for hangso.ts
export * from './hangso';      // Legacy Vietnamese alias kept for backward compat

// ── Assets / Resources ────────────────────────────────────────────────────
export * from './assets';      // English alias for tainguyen.ts
export * from './tainguyen';   // Legacy Vietnamese alias kept for backward compat

// ── Auth / Validation helpers ─────────────────────────────────────────────
export * from './xacThuc';     // loginSchema, registerSchema, etc.
