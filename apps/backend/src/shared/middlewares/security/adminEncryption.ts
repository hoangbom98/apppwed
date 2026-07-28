// @ts-nocheck
/**
 * adminEncryption.ts — AES-256-GCM encrypt/decrypt for Admin API
 * 
 * Learned from BoYue EncryptionMiddleware:
 * - Admin panel → Backend: request body encrypted, server decrypts
 * - Backend → Admin panel: response body encrypted before sending
 * 
 * Only activates when:
 *   1. Request has header "X-Encrypted: 1"
 *   2. ADMIN_ENCRYPTION_KEY env var is set (32+ chars)
 * 
 * Key must be the same on the admin frontend (stored in env/config).
 * 
 * Cipher: AES-256-GCM (authenticated encryption — prevents tampering)
 * Format: JSON { iv, tag, data } → Base64-encoded in request/response body
 * 
 * Usage in admin routes:
 *   import { decryptAdminRequest, encryptAdminResponse } from '../../shared/middlewares/adminEncryption';
 *   router.use(decryptAdminRequest);
 *   router.use(encryptAdminResponse);
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const logger = require('../../services/logger');

const ALGO      = 'aes-256-gcm';
const KEY_ENV   = 'ADMIN_ENCRYPTION_KEY';
const IV_LEN    = 12;   // 96-bit IV for GCM (NIST recommended)
const TAG_LEN   = 16;   // 128-bit auth tag

function getKey(): Buffer | null {
  const raw = process.env[KEY_ENV];
  if (!raw || raw.length < 32) return null;
  // Derive a 32-byte key using SHA-256 so any length input works
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(key: Buffer, plaintext: string): string {
  const iv  = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.from(JSON.stringify({
    iv:   iv.toString('hex'),
    tag:  tag.toString('hex'),
    data: encrypted.toString('hex'),
  })).toString('base64');
}

function decrypt(key: Buffer, payload: string): string {
  const { iv, tag, data } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, 'hex'), { authTagLength: TAG_LEN });
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Middleware: decrypt incoming admin request body.
 * Only processes requests with header "X-Encrypted: 1".
 * Skips gracefully when ADMIN_ENCRYPTION_KEY is not set.
 */
export function decryptAdminRequest(req: Request, _res: Response, next: NextFunction): void {
  const key = getKey();
  if (!key) return next(); // encryption key not configured — skip silently

  const header = req.headers['x-encrypted'];
  if (!header || header !== '1') return next(); // not an encrypted request

  try {
    const payload = typeof req.body === 'string' ? req.body : (req.body?.payload ?? '');
    if (!payload) return next();
    const decrypted = decrypt(key, payload);
    req.body = JSON.parse(decrypted);
    logger.debug(`[AdminEncryption] Request decrypted: ${req.method} ${req.path}`);
  } catch (err: any) {
    logger.warn(`[AdminEncryption] Decrypt failed: ${err.message}`);
    _res.status(400).json({ success: false, message: 'Invalid encrypted payload' });
    return;
  }
  next();
}

/**
 * Middleware: encrypt outgoing admin response body.
 * Only activates when ADMIN_ENCRYPTION_KEY is set AND the request had "X-Encrypted: 1".
 * Wraps res.json() transparently.
 */
export function encryptAdminResponse(req: Request, res: Response, next: NextFunction): void {
  const key = getKey();
  if (!key) return next(); // key not configured — skip

  const header = req.headers['x-encrypted'];
  if (!header || header !== '1') return next(); // client doesn't want encrypted responses

  // Wrap res.json to intercept the response
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    try {
      const plaintext = JSON.stringify(body);
      const encrypted = encrypt(key, plaintext);
      res.setHeader('X-Encrypted', '1');
      return originalJson({ payload: encrypted });
    } catch (err: any) {
      logger.warn(`[AdminEncryption] Encrypt response failed: ${err.message}`);
      return originalJson(body); // fallback: send plaintext
    }
  };
  next();
}
