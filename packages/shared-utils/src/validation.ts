/**
 * @lkvip/utils — src/validation.ts
 *
 * Frontend-safe validation utilities (TypeScript).
 * Pure functions — no framework dependency, usable in any SPA or Node context.
 * Mirrors the Joi backend validators and Yup frontend schema rules.
 *
 * Usage:
 *   import { isEmail, isViPhone, validatePassword, isValidAmount } from '@lkvip/utils/src/validation';
 */

// ── Email ────────────────────────────────────────────────────────────────────

/** Standard email format check */
export function isEmail(email: string): boolean {
  return typeof email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ── Phone ─────────────────────────────────────────────────────────────────────

/** Vietnamese mobile phone: starts with 03/05/07/08/09 followed by 8 digits */
export function isViPhone(phone: string): boolean {
  return typeof phone === 'string' &&
    /^(03|05|07|08|09)[0-9]{8}$/.test(phone.replace(/\s/g, ''));
}

/** Generic phone: 10–15 digits (international) */
export function isPhone(phone: string): boolean {
  return typeof phone === 'string' && /^[0-9]{10,15}$/.test(phone.replace(/[\s+\-()]/g, ''));
}

// ── Password ─────────────────────────────────────────────────────────────────

export interface PasswordStrength {
  score:    0 | 1 | 2 | 3 | 4;   // 0 = very weak → 4 = very strong
  label:    'Rất yếu' | 'Yếu' | 'Trung bình' | 'Mạnh' | 'Rất mạnh';
  color:    'red' | 'orange' | 'yellow' | 'blue' | 'green';
  issues:   string[];
}

/** Minimum length for any password (6 chars) */
export function isPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 6;
}

/** Strong password check: min 8 chars, upper + lower + digit + special */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/** Score a password 0–4 with Vietnamese labels */
export function scorePassword(password: string): PasswordStrength {
  if (!password) return { score: 0, label: 'Rất yếu', color: 'red', issues: ['Mật khẩu không được để trống'] };

  const issues: string[] = [];
  let score = 0;

  if (password.length >= 8)  score++; else issues.push('Ít nhất 8 ký tự');
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else issues.push('Cần chữ hoa và chữ thường');
  if (/[0-9]/.test(password)) score++;
  else issues.push('Cần ít nhất 1 chữ số');
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else issues.push('Cần ít nhất 1 ký tự đặc biệt (!@#...)');

  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels: PasswordStrength['label'][] = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  const colors: PasswordStrength['color'][] = ['red', 'orange', 'yellow', 'blue', 'green'];

  return { score: capped, label: labels[capped], color: colors[capped], issues };
}

// ── Username ─────────────────────────────────────────────────────────────────

/** 3–30 alphanumeric or underscore characters */
export function isUsername(username: string): boolean {
  return typeof username === 'string' && /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

// ── Financial ────────────────────────────────────────────────────────────────

/**
 * Check that an amount is a valid positive number within [min, max].
 * Default min = 10,000 VND (lowest deposit), max = Infinity.
 */
export function isValidAmount(amount: number | string, min = 10_000, max = Infinity): boolean {
  const n = Number(amount);
  return !isNaN(n) && isFinite(n) && n >= min && n <= max;
}

/** Check that a value is a positive integer */
export function isPositiveInt(val: unknown): boolean {
  return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

// ── String ───────────────────────────────────────────────────────────────────

/** Check that a string is non-empty after trimming */
export function isNonEmpty(str: unknown): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

/** Check string length is within [min, max] inclusive */
export function isLength(str: string, min: number, max: number): boolean {
  return typeof str === 'string' && str.length >= min && str.length <= max;
}

/** Check that a string is a valid URL (http or https) */
export function isUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

/** Check that a string is a valid slug (lowercase, alphanumeric, hyphens) */
export function isSlug(str: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str);
}

// ── Object ───────────────────────────────────────────────────────────────────

/**
 * Return an array of missing field names from an object.
 * A field is "missing" if it's null, undefined, or empty string.
 */
export function missingFields(obj: Record<string, unknown>, keys: string[]): string[] {
  return keys.filter(k => obj[k] == null || obj[k] === '');
}

/**
 * Return the first validation error message, or null if all pass.
 * Each rule is [condition_that_should_be_true, error_message].
 */
export function firstError(rules: Array<[boolean, string]>): string | null {
  for (const [ok, msg] of rules) {
    if (!ok) return msg;
  }
  return null;
}

// ── OTP / Codes ──────────────────────────────────────────────────────────────

/** Check that a string is exactly `len` digits (default: 6) */
export function isOtp(code: string, len = 6): boolean {
  return typeof code === 'string' && new RegExp(`^[0-9]{${len}}$`).test(code);
}

// ── Vietnamese ID / passport ─────────────────────────────────────────────────

/** Vietnamese CCCD/CMND: 9 or 12 digits */
export function isViNationalId(id: string): boolean {
  return /^[0-9]{9}$/.test(id) || /^[0-9]{12}$/.test(id);
}

/** Basic passport: 1 letter + 7–8 digits (international) */
export function isPassport(id: string): boolean {
  return /^[A-Z][0-9]{7,8}$/.test(id.toUpperCase());
}

// ── Bank account ─────────────────────────────────────────────────────────────

/** Vietnamese bank account: 6–20 digits */
export function isViBankAccount(account: string): boolean {
  return /^[0-9]{6,20}$/.test(account.replace(/\s/g, ''));
}

// ── Crypto ───────────────────────────────────────────────────────────────────

/** ERC-20 / BEP-20 address: 0x + 40 hex chars */
export function isEthAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/** TRC-20 (TRON) address: T + 33 base58 chars */
export function isTronAddress(address: string): boolean {
  return /^T[a-zA-Z0-9]{33}$/.test(address);
}
