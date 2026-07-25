/**
 * @lkvip/utils — dates.ts
 * Backend date/time helpers (no external dependencies).
 */

/**
 * Format a Date as "DD/MM/YYYY HH:mm:ss" (UTC+7 / Vietnam time).
 */
export function formatVNDateTime(d: Date | string | number): string {
  const date = new Date(d);
  const vn   = new Date(date.getTime() + 7 * 3600 * 1000);
  const pad  = (n: number) => String(n).padStart(2, '0');
  return `${pad(vn.getUTCDate())}/${pad(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}:${pad(vn.getUTCSeconds())}`;
}

/**
 * Return a Date `n` minutes from now.
 */
export function addMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

/**
 * Return a Date `n` days from now.
 */
export function addDays(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

/**
 * Check if a date (or ISO string) is in the past.
 */
export function isPast(d: Date | string): boolean {
  return new Date(d).getTime() < Date.now();
}

/**
 * Get start-of-day (00:00:00.000) for a given date (local time).
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a duration (seconds) as HH:MM:SS or MM:SS.
 */
export function formatDuration(seconds: number): string {
  const s   = Math.floor(seconds);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(sec)}`
    : `${pad(m)}:${pad(sec)}`;
}
