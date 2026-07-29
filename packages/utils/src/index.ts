/**
 * @lkvip/utils — Entry point
 * Barrel re-export for all shared backend utility modules.
 *
 * Usage:
 *   import { slugify, formatVND, isEmail, addDays, parsePaginationQuery,
 *            generateOTP, formatCompact, pick, groupBy } from '@lkvip/utils';
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

// ── Validation ────────────────────────────────────────────────────────────────
// Exports: isEmail, isViPhone, isPhone, isPassword, isStrongPassword,
//          scorePassword, isUsername, isValidAmount, isPositiveInt,
//          isNonEmpty, isLength, isUrl, isSlug, missingFields, firstError,
//          isOtp, isViNationalId, isPassport, isViBankAccount,
//          isEthAddress, isTronAddress
export * from './validation';

// ── Object utilities ─────────────────────────────────────────────────────────
export * from './object';
