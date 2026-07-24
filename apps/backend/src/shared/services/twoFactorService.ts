/**
 * Two-Factor Authentication Service — TOTP (RFC 6238)
 * Uses speakeasy for TOTP generation/verification.
 * Falls back to a console stub if speakeasy is not installed.
 *
 * Usage:
 *   const twoFA = require('./twoFactorService');
 *
 *   // 1. Generate secret during setup
 *   const secret = twoFA.generateSecret('MyApp', user.email);
 *   // secret.base32 — store encrypted in DB
 *   // secret.otpauth_url — encode as QR code
 *
 *   // 2. Verify user-provided OTP token
 *   const valid = twoFA.verifyToken(secret.base32, userToken);
 *
 *   // 3. Generate backup codes
 *   const codes = twoFA.generateBackupCodes();
 */
const crypto = require('crypto');
const enc    = require('../utils/encryption');

let speakeasy = null;
try { speakeasy = require('speakeasy'); } catch { /* optional */ }

/* ── Secret generation ──────────────────────────────────────── */

/**
 * Generate a new TOTP secret.
 * @param {string} issuer   – app name shown in authenticator apps
 * @param {string} label    – usually user email
 * @returns {{ base32, otpauth_url, ascii, hex }}
 */
function generateSecret(issuer = 'MultiProject', label = 'user') {
  if (speakeasy) {
    return speakeasy.generateSecret({
      name:   `${issuer}:${label}`,
      issuer,
      length: 20,
    });
  }
  // Fallback: generate a random base32-like secret
  const bytes  = crypto.randomBytes(20);
  const base32 = bytes.toString('base64').replace(/[^A-Z2-7]/gi, '').toUpperCase().slice(0, 32);
  return {
    base32,
    otpauth_url: `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${base32}&issuer=${encodeURIComponent(issuer)}`,
    ascii:       bytes.toString('ascii'),
    hex:         bytes.toString('hex'),
  };
}

/**
 * Verify a 6-digit TOTP token against the stored secret.
 * @param {string} base32Secret  – stored secret (encrypted then decrypted before passing here)
 * @param {string} token         – 6-digit string from authenticator app
 * @param {number} window        – allowed clock drift windows (default 1 = ±30s)
 */
function verifyToken(base32Secret, token, window = 1) {
  if (speakeasy) {
    return speakeasy.totp.verify({
      secret:   base32Secret,
      encoding: 'base32',
      token:    String(token),
      window,
    });
  }
  // Stub: in dev without speakeasy, accept '000000' for testing
  if (process.env.NODE_ENV !== 'production') {
    return token === '000000';
  }
  return false;
}

/**
 * Generate one-time backup codes (hashed for storage).
 * @param {number} count – number of codes to generate (default 10)
 * @returns {{ plain: string[], hashed: string[] }}
 */
function generateBackupCodes(count = 10) {
  const plain  = [];
  const hashed = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    plain.push(code);
    hashed.push(enc.sha256(code));
  }
  return { plain, hashed };
}

/**
 * Verify and consume a backup code.
 * Returns the index of the used code (to mark it consumed) or -1 if invalid.
 * @param {string}   inputCode  – plain code entered by user
 * @param {string[]} storedHashes – array of hashed backup codes from DB
 */
function verifyBackupCode(inputCode, storedHashes) {
  const hash = enc.sha256(inputCode.toUpperCase().trim());
  return storedHashes.findIndex(h => enc.timingSafeEqual(h, hash));
}

/**
 * Encrypt a 2FA secret for storage in DB.
 */
function encryptSecret(base32Secret) {
  return enc.encryptToString(base32Secret);
}

/**
 * Decrypt a stored 2FA secret.
 */
function decryptSecret(encrypted) {
  return enc.decryptFromString(encrypted);
}

module.exports = {
  generateSecret,
  verifyToken,
  generateBackupCodes,
  verifyBackupCode,
  encryptSecret,
  decryptSecret,
};
