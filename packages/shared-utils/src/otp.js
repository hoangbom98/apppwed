'use strict';
/**
 * @lkvip/utils — otp.js
 * OTP (One-Time Password) and secure token generation.
 * Uses Node.js crypto — no external dependencies.
 *
 * @example
 *   const { generateOTP, generateSecureToken } = require('@lkvip/utils');
 *
 *   const otp   = generateOTP(6);          // → '847291'
 *   const token = generateSecureToken(32); // → '3a7b9c...' (64 hex chars)
 */

const crypto = require('crypto');

/**
 * Generate a numeric OTP of `length` digits.
 * Uses crypto.randomInt for cryptographically-secure randomness.
 *
 * @param {number} [length=6]  — number of digits (4–8 recommended)
 * @returns {string}           — zero-padded string of digits
 *
 * @example
 *   generateOTP(6) // → '084729'
 *   generateOTP(4) // → '0391'
 */
function generateOTP(length = 6) {
  if (length < 1 || length > 10) throw new RangeError('OTP length must be 1–10');
  const max = Math.pow(10, length);
  const n   = crypto.randomInt(0, max);
  return String(n).padStart(length, '0');
}

/**
 * Generate a cryptographically-secure random hex token.
 * Suitable for password reset tokens, email verification links, etc.
 *
 * @param {number} [bytes=32]  — number of random bytes (output is 2× this length in hex)
 * @returns {string}           — lowercase hex string
 *
 * @example
 *   generateSecureToken(32) // → '3a7b9c1d...' (64 hex chars)
 *   generateSecureToken(16) // → 'f8a2b3...'   (32 hex chars)
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a URL-safe base64 token (shorter than hex for same entropy).
 *
 * @param {number} [bytes=24]  — number of random bytes
 * @returns {string}           — URL-safe base64 string (no +/= chars)
 */
function generateUrlToken(bytes = 24) {
  return crypto.randomBytes(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

module.exports = { generateOTP, generateSecureToken, generateUrlToken };
