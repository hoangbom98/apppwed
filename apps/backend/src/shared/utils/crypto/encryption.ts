/**
 * Encryption utilities — AES-256-GCM symmetric encryption
 * and general-purpose hashing / token helpers.
 *
 * Usage:
 *   import * as enc from './encryption';
 *   const cipher = enc.encrypt('sensitive data');  // { iv, tag, data }
 *   const plain  = enc.decrypt(cipher);            // 'sensitive data'
 *
 *   const hash  = await enc.hashPassword('myPass');
 *   const match = await enc.verifyPassword('myPass', hash);  // true
 *
 *   const token = enc.generateSecureToken(32);   // hex string
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ALGO    = 'aes-256-gcm';
const IV_LEN  = 12;  // 96-bit IV recommended for GCM
const TAG_LEN = 16;  // 128-bit authentication tag
export const KEY_LEN = 32;  // 256-bit key

/* ── Derive key from env ────────────────────────────────────── */

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default_dev_key_change_in_prod!';
  return crypto.createHash('sha256').update(secret).digest();
}

/* ── AES-256-GCM Encrypt / Decrypt ─────────────────────────── */

export interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

/**
 * Encrypt a string value.
 * @returns `{ iv, tag, data }` — all hex strings
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getKey();
  const iv  = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });

  let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    iv:   iv.toString('hex'),
    tag:  tag.toString('hex'),
    data: encrypted,
  };
}

/**
 * Encrypt to a compact string: `iv:tag:data`
 */
export function encryptToString(plaintext: string): string {
  const { iv, tag, data } = encrypt(plaintext);
  return `${iv}:${tag}:${data}`;
}

/**
 * Decrypt an `{ iv, tag, data }` object.
 */
export function decrypt(payload: EncryptedPayload): string {
  const key = getKey();
  const { iv, tag, data } = payload;
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, 'hex'), { authTagLength: TAG_LEN });
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Decrypt a compact `iv:tag:data` string.
 */
export function decryptFromString(str: string): string {
  const [iv, tag, data] = str.split(':');
  return decrypt({ iv, tag, data });
}

/* ── Password hashing (bcrypt) ──────────────────────────────── */

const SALT_ROUNDS = 12;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(String(plaintext), SALT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(String(plaintext), hash);
}

/* ── Token helpers ──────────────────────────────────────────── */

/**
 * Generate a cryptographically secure random hex token.
 * @param byteLength defaults to 32 → produces 64-char hex string
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Generate a numeric OTP of a given length.
 */
export function generateOtp(length = 6): string {
  const max = Math.pow(10, length);
  const otp = crypto.randomInt(0, max);
  return String(otp).padStart(length, '0');
}

/**
 * HMAC-SHA256 signature — for webhook verification.
 */
export function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Constant-time string comparison (prevents timing attacks).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Hash a value with SHA-256 (for non-reversible storage like email hashes).
 */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}
