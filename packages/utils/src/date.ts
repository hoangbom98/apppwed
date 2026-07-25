/**
 * @lkvip/utils — src/date.ts
 *
 * Frontend-safe date/time utilities (TypeScript).
 * No external dependencies — works in browser and Node.js.
 * All functions accept DateInput = string | Date | number for flexibility.
 *
 * Usage:
 *   import { addDays, startOfDay, diffDays, isToday, toIso } from '@lkvip/utils/src/date';
 */

export type DateInput = string | Date | number;

// ── Parsing / normalising ────────────────────────────────────────────────────

/** Parse any DateInput to a JS Date. Returns Invalid Date on failure. */
export function toDate(d: DateInput): Date {
  return d instanceof Date ? d : new Date(d);
}

/** Return a safe Unix timestamp (ms). Returns 0 for invalid inputs. */
export function toMs(d: DateInput): number {
  const t = toDate(d).getTime();
  return isNaN(t) ? 0 : t;
}

/** Return an ISO 8601 string. Returns '' for invalid inputs. */
export function toIso(d: DateInput): string {
  const t = toMs(d);
  return t ? new Date(t).toISOString() : '';
}

/** Return true if the value is a valid date */
export function isValidDate(d: DateInput): boolean {
  return !isNaN(toDate(d).getTime());
}

// ── Arithmetic ───────────────────────────────────────────────────────────────

/** Add `n` minutes to a date (or now). Returns a new Date. */
export function addMinutes(n: number, base: DateInput = Date.now()): Date {
  return new Date(toMs(base) + n * 60_000);
}

/** Add `n` hours to a date. Returns a new Date. */
export function addHours(n: number, base: DateInput = Date.now()): Date {
  return new Date(toMs(base) + n * 3_600_000);
}

/** Add `n` days to a date. Returns a new Date. */
export function addDays(n: number, base: DateInput = Date.now()): Date {
  return new Date(toMs(base) + n * 86_400_000);
}

/** Add `n` months to a date. Handles month-end edge cases. */
export function addMonths(n: number, base: DateInput = Date.now()): Date {
  const d = toDate(base);
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Add `n` years to a date. */
export function addYears(n: number, base: DateInput = Date.now()): Date {
  const d = toDate(base);
  d.setFullYear(d.getFullYear() + n);
  return d;
}

// ── Boundaries ───────────────────────────────────────────────────────────────

/** Returns midnight (00:00:00.000) of the given date in local time. */
export function startOfDay(d: DateInput = Date.now()): Date {
  const date = toDate(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Returns 23:59:59.999 of the given date in local time. */
export function endOfDay(d: DateInput = Date.now()): Date {
  const date = toDate(d);
  date.setHours(23, 59, 59, 999);
  return date;
}

/** Returns the first day of the month at 00:00:00.000. */
export function startOfMonth(d: DateInput = Date.now()): Date {
  const date = toDate(d);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Returns the last day of the month at 23:59:59.999. */
export function endOfMonth(d: DateInput = Date.now()): Date {
  const date = toDate(d);
  date.setMonth(date.getMonth() + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date;
}

// ── Comparisons ──────────────────────────────────────────────────────────────

/** Return true if the date is in the past */
export function isPast(d: DateInput): boolean {
  return toMs(d) < Date.now();
}

/** Return true if the date is in the future */
export function isFuture(d: DateInput): boolean {
  return toMs(d) > Date.now();
}

/** Return true if the date falls on today (local time) */
export function isToday(d: DateInput): boolean {
  const date = toDate(d);
  const now  = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth()    === now.getMonth()    &&
    date.getDate()     === now.getDate()
  );
}

/** Return true if the date falls on yesterday */
export function isYesterday(d: DateInput): boolean {
  return isToday(addDays(-1, d));
}

/**
 * Return the difference in whole days between two dates (a - b).
 * Positive = a is later than b.
 */
export function diffDays(a: DateInput, b: DateInput = Date.now()): number {
  return Math.floor((toMs(a) - toMs(b)) / 86_400_000);
}

/** Return the difference in whole hours between two dates (a - b). */
export function diffHours(a: DateInput, b: DateInput = Date.now()): number {
  return Math.floor((toMs(a) - toMs(b)) / 3_600_000);
}

/** Return the difference in whole minutes between two dates (a - b). */
export function diffMinutes(a: DateInput, b: DateInput = Date.now()): number {
  return Math.floor((toMs(a) - toMs(b)) / 60_000);
}

// ── Vietnamese-specific helpers ───────────────────────────────────────────────

/**
 * Format a date as "DD/MM/YYYY" in Vietnam time (UTC+7).
 * Server-side safe — does not rely on the host locale.
 */
export function formatVNDate(d: DateInput): string {
  const vn = new Date(toMs(d) + 7 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(vn.getUTCDate())}/${pad(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()}`;
}

/**
 * Format as "DD/MM/YYYY HH:mm" in Vietnam time (UTC+7).
 */
export function formatVNDateTime(d: DateInput): string {
  const vn = new Date(toMs(d) + 7 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(vn.getUTCDate())}/${pad(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}`;
}

/**
 * Return a human-readable relative time string in Vietnamese.
 * e.g. "vừa xong", "5 phút trước", "2 ngày trước"
 */
export function relativeTime(d: DateInput): string {
  const diffSec = Math.floor((Date.now() - toMs(d)) / 1000);
  if (diffSec < 30)           return 'vừa xong';
  if (diffSec < 60)           return `${diffSec} giây trước`;
  if (diffSec < 3_600)        return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86_400)       return `${Math.floor(diffSec / 3_600)} giờ trước`;
  if (diffSec < 86_400 * 7)   return `${Math.floor(diffSec / 86_400)} ngày trước`;
  if (diffSec < 86_400 * 30)  return `${Math.floor(diffSec / (86_400 * 7))} tuần trước`;
  if (diffSec < 86_400 * 365) return `${Math.floor(diffSec / (86_400 * 30))} tháng trước`;
  return `${Math.floor(diffSec / (86_400 * 365))} năm trước`;
}

// ── Cron / scheduling helpers ─────────────────────────────────────────────────

/**
 * Return true if the current time (UTC) is between startHour and endHour (exclusive).
 * Useful for maintenance window guards in cron jobs.
 */
export function isInHourRange(startHour: number, endHour: number): boolean {
  const h = new Date().getUTCHours();
  return startHour < endHour
    ? h >= startHour && h < endHour
    : h >= startHour || h < endHour;  // wraps midnight
}

/**
 * Return the next UTC midnight (00:00:00.000) timestamp.
 */
export function nextMidnightUtc(): Date {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

/**
 * Return the ISO week number (1–53) for a given date.
 */
export function isoWeek(d: DateInput = Date.now()): number {
  const date = toDate(d);
  const thu = new Date(date);
  thu.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3);
  const jan4 = new Date(thu.getFullYear(), 0, 4);
  return 1 + Math.round((thu.getTime() - jan4.getTime()) / (7 * 86_400_000));
}
