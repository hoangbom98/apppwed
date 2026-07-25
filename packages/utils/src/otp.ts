/**
 * @lkvip/utils — otp.ts
 * OTP (One-Time Password) and secure token generation.
 * Uses Node.js crypto — no external dependencies.
 *
 * @example
 *   const otp   = generateOTP(6);          // → '847291'
 *   const token = generateSecureToken(32); // → '3a7b9c...' (64 hex chars)
 */

import { randomBytes, randomInt } from 'crypto';

/**
 * Generate a numeric OTP of `length` digits.
 * Uses crypto.randomInt for cryptographically-secure randomness.
 *
 * @example
 *   generateOTP(6) // → '084729'
 *   generateOTP(4) // → '0391'
 */
export function generateOTP(length = 6): string {
  if (length < 1 || length > 10) throw new RangeError('OTP length must be 1–10');
  const max = Math.pow(10, length);
  const n   = randomInt(0, max);
  return String(n).padStart(length, '0');
}

/**
 * Generate a cryptographically-secure random hex token.
 * Suitable for password reset tokens, email verification links, etc.
 *
 * @example
 *   generateSecureToken(32) // → '3a7b9c1d...' (64 hex chars)
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Generate a URL-safe base64 token (shorter than hex for same entropy).
 */
export function generateUrlToken(bytes = 24): string {
  return randomBytes(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
