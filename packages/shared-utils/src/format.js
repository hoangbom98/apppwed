'use strict';
/**
 * @lkvip/utils — src/format.js
 *
 * Frontend-compatible number/currency formatting utilities.
 * Uses Intl.NumberFormat — available in Node.js >= 13 and all modern browsers.
 */

/**
 * Format a number as Vietnamese Đồng currency.
 * @param {number} amount
 * @param {boolean} [compact=false]  — use short notation (e.g. 1.5 tỷ)
 * @returns {string}
 */
function formatVND(amount, compact = false) {
  return new Intl.NumberFormat('vi-VN', {
    style:    'currency',
    currency: 'VND',
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a plain number with locale-aware thousand separators.
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Format a number in compact form (K / M / B / T).
 * @param {number} num
 * @returns {string}
 */
function formatCompact(num) {
  return new Intl.NumberFormat('vi-VN', {
    notation:      'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * Format a percentage (0–100 or 0–1 based on `fractional`).
 * @param {number} value
 * @param {number} [decimals=1]
 * @param {boolean} [fractional=false] — if true, multiply by 100 first
 * @returns {string}
 */
function formatPercent(value, decimals = 1, fractional = false) {
  const v = fractional ? value * 100 : value;
  return `${v.toFixed(decimals)}%`;
}

/**
 * Format file size in human-readable form (B → KB → MB → GB).
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 ** 2)      return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)      return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

module.exports = { formatVND, formatNumber, formatCompact, formatPercent, formatFileSize };
