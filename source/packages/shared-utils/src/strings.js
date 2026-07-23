'use strict';
/**
 * @lkvip/utils — strings.js
 * Backend string helpers.
 */

/**
 * Truncate a string to `maxLen` chars, appending `suffix` if truncated.
 * @param {string} str
 * @param {number} [maxLen=80]
 * @param {string} [suffix='…']
 * @returns {string}
 */
function truncate(str, maxLen = 80, suffix = '…') {
  if (typeof str !== 'string') return '';
  return str.length > maxLen ? str.slice(0, maxLen) + suffix : str;
}

/**
 * Pad a number with leading zeros.
 * @param {number} n
 * @param {number} [width=2]
 * @returns {string}
 */
function zeroPad(n, width = 2) {
  return String(n).padStart(width, '0');
}

/**
 * Mask a string for display (e.g. phone, email, account number).
 * Keeps first `show` chars and last `show` chars, replaces the rest with `*`.
 * @param {string} str
 * @param {number} [show=4]
 * @returns {string}
 *
 * @example
 *   mask('0987654321', 3) // → '098****321'
 *   mask('user@mail.com', 3) // → 'use*****com'
 */
function mask(str, show = 4) {
  if (typeof str !== 'string' || str.length <= show * 2) return str;
  return str.slice(0, show) + '*'.repeat(str.length - show * 2) + str.slice(-show);
}

/**
 * Generate a random alphanumeric code.
 * @param {number} [len=8]
 * @returns {string}
 */
function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit 0/O/I/1 for readability
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Normalize a phone number to digits only, removing +84 prefix.
 * @param {string} phone
 * @returns {string}
 *
 * @example
 *   normalizePhone('+84987654321') // → '0987654321'
 *   normalizePhone('84987654321')  // → '0987654321'
 */
function normalizePhone(phone) {
  if (typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) return '0' + digits.slice(2);
  return digits;
}

/**
 * Convert camelCase or PascalCase to snake_case.
 * @param {string} str
 * @returns {string}
 *
 * @example
 *   toSnakeCase('getUserById')  // → 'get_user_by_id'
 *   toSnakeCase('APIResponse')  // → 'a_p_i_response'
 */
function toSnakeCase(str) {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

module.exports = { truncate, zeroPad, mask, randomCode, normalizePhone, toSnakeCase };
