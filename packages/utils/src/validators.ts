/**
 * @lkvip/utils — validators.ts
 * Simple pure-function validators for backend use (no Joi dependency).
 * Mirrors the frontend Yup schema rules for consistency.
 */

/** Check a valid email format. */
export function isEmail(email: string): boolean {
  return typeof email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** At least 6 characters. */
export function isPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 6;
}

/** 3–30 alphanumeric/underscore characters. */
export function isUsername(username: string): boolean {
  return typeof username === 'string' &&
    /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

/** Vietnamese phone: 10–12 digits. */
export function isPhone(phone: string): boolean {
  return typeof phone === 'string' && /^[0-9]{10,12}$/.test(phone.trim());
}

/**
 * Validate deposit/withdrawal amount.
 */
export function isValidAmount(amount: unknown, min = 10_000, max = Infinity): boolean {
  const n = Number(amount);
  return !isNaN(n) && n >= min && n <= max;
}

/**
 * Check that an object has all required keys (non-null, non-empty-string).
 * @returns Array of missing key names (empty = all present)
 */
export function missingFields(
  obj:  Record<string, unknown>,
  keys: string[],
): string[] {
  return keys.filter(k => obj[k] == null || obj[k] === '');
}
