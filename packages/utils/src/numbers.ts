/**
 * @lkvip/utils — numbers.ts
 * Number formatting and math helpers.
 */

/**
 * Format a number as VND currency string (server-side, for emails/logs).
 * @example formatVND(1500000) → "1.500.000 ₫"
 */
export function formatVND(n: number): string {
  return Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

/**
 * Clamp a value between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Round to `decimals` decimal places.
 */
export function round(n: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * Calculate percentage: (part / total) * 100, clamped to [0, 100].
 * Returns 0 if total is 0 to avoid division by zero.
 */
export function pct(part: number, total: number): number {
  if (!total) return 0;
  return clamp((part / total) * 100, 0, 100);
}

/**
 * Safe parse int with fallback.
 */
export function safeInt(val: unknown, fallback = 0): number {
  const n = parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}
