/**
 * @lkvip/utils — strings.ts
 * Backend string helpers.
 */

/**
 * Truncate a string to `maxLen` chars, appending `suffix` if truncated.
 */
export function truncate(str: string, maxLen = 80, suffix = '…'): string {
  if (typeof str !== 'string') return '';
  return str.length > maxLen ? str.slice(0, maxLen) + suffix : str;
}

/**
 * Pad a number with leading zeros.
 */
export function zeroPad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/**
 * Mask a string for display (e.g. phone, email, account number).
 * Keeps first `show` chars and last `show` chars, replaces the rest with `*`.
 *
 * @example
 *   mask('0987654321', 3) // → '098****321'
 *   mask('user@mail.com', 3) // → 'use*****com'
 */
export function mask(str: string, show = 4): string {
  if (typeof str !== 'string' || str.length <= show * 2) return str;
  return str.slice(0, show) + '*'.repeat(str.length - show * 2) + str.slice(-show);
}

/**
 * Generate a random alphanumeric code (omits 0/O/I/1 for readability).
 */
export function randomCode(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Normalize a phone number to digits only, removing +84 prefix.
 *
 * @example
 *   normalizePhone('+84987654321') // → '0987654321'
 *   normalizePhone('84987654321')  // → '0987654321'
 */
export function normalizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) return '0' + digits.slice(2);
  return digits;
}

/**
 * Convert camelCase or PascalCase to snake_case.
 *
 * @example
 *   toSnakeCase('getUserById')  // → 'get_user_by_id'
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase();
}
