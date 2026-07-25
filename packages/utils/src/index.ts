/**
 * @lkvip/utils — Entry point
 * Barrel re-export for all shared backend utility modules.
 *
 * Usage:
 *   import { slugify, formatVND, isEmail, addDays, parsePaginationQuery,
 *            generateOTP, formatCompact, pick, groupBy } from '@lkvip/utils';
 *
 * Note: `dates.ts` exports simple backend helpers (no base param).
 *       `date.ts` exports full-featured frontend-safe helpers with base param.
 *       Prefer `date.ts` exports for new code — they supersede `dates.ts`.
 */

// ── Formatting ────────────────────────────────────────────────────────────────
// format.ts re-exports formatVND (Intl-based) — preferred over numbers.ts version
export {
  formatVND,
  formatNumber,
  formatCompact,
  formatPercent,
  formatFileSize,
} from './format';

// ── Numbers ───────────────────────────────────────────────────────────────────
export { clamp, round, pct, safeInt } from './numbers';

// ── Strings ───────────────────────────────────────────────────────────────────
export * from './strings';

// ── Slugify ───────────────────────────────────────────────────────────────────
export * from './slugify';

// ── Pagination ────────────────────────────────────────────────────────────────
export * from './pagination';

// ── OTP / tokens ─────────────────────────────────────────────────────────────
export * from './otp';

// ── Crypto helpers ────────────────────────────────────────────────────────────
export * from './crypto';
export * from './encryption';

// ── Money ─────────────────────────────────────────────────────────────────────
export * from './money';

// ── Date/time — full-featured (preferred) ────────────────────────────────────
// Exports: DateInput, toDate, toMs, toIso, isValidDate,
//          addMinutes, addHours, addDays, addMonths, addYears,
//          startOfDay, endOfDay, startOfMonth, endOfMonth,
//          isPast, isFuture, isToday, isYesterday,
//          diffDays, diffHours, diffMinutes,
//          formatVNDate, formatVNDateTime, relativeTime,
//          isInHourRange, nextMidnightUtc, isoWeek
export * from './date';

// ── Date helpers — simple backend helpers (non-conflicting names only) ────────
export { formatDuration } from './dates';

// ── Validation — full-featured (preferred) ───────────────────────────────────
// Exports: isEmail, isViPhone, isPhone, isPassword, isStrongPassword,
//          scorePassword, isUsername, isValidAmount, isPositiveInt,
//          isNonEmpty, isLength, isUrl, isSlug, missingFields, firstError,
//          isOtp, isViNationalId, isPassport, isViBankAccount,
//          isEthAddress, isTronAddress
export * from './validation';

// ── Validators — simple backend helpers (non-conflicting names only) ──────────
// (isEmail, isPassword, isUsername, isPhone, isValidAmount, missingFields
//  are already provided by validation.ts above — only export new ones)

// ── Object utilities ─────────────────────────────────────────────────────────
export * from './object';
