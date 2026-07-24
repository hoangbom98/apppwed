'use strict';
/**
 * @lkvip/utils — numbers.js
 * Backend number formatting and math helpers.
 */

/**
 * Format a number as VND currency string (server-side, for emails/logs).
 * @param {number} n
 * @returns {string}  e.g. "1.500.000 ₫"
 */
function formatVND(n) {
  return Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Round to `decimals` decimal places.
 * @param {number} n
 * @param {number} [decimals=2]
 * @returns {number}
 */
function round(n, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * Calculate percentage: (part / total) * 100, clamped to [0, 100].
 * Returns 0 if total is 0 to avoid division by zero.
 * @param {number} part
 * @param {number} total
 * @returns {number}
 */
function pct(part, total) {
  if (!total) return 0;
  return clamp((part / total) * 100, 0, 100);
}

/**
 * Safe parse int with fallback.
 * @param {*} val
 * @param {number} [fallback=0]
 * @returns {number}
 */
function safeInt(val, fallback = 0) {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

module.exports = { formatVND, clamp, round, pct, safeInt };
