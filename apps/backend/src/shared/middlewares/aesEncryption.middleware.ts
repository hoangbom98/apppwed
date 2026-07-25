/**
 * aesEncryption.middleware.ts
 * AES-256-GCM request payload decryption middleware.
 *
 * Replaces the previous AES-128-ECB implementation (ECB mode is semantically
 * insecure — identical plaintext blocks produce identical ciphertext, violating
 * OWASP A04:2025 Cryptographic Failures).
 *
 * Wire format (base64-encoded JSON string in req.body.params):
 *   { iv: "<24-char base64>", tag: "<24-char base64>", data: "<base64-ciphertext>" }
 *
 * KEY: 32-byte (256-bit) key from API_AES_KEY env var (hex or raw).
 * IV:  12-byte random per request (96-bit, GCM standard).
 * TAG: 16-byte authentication tag — validates ciphertext integrity.
 */
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const AES_KEY_RAW = process.env.API_AES_KEY || '';

/**
 * Derive a 32-byte Buffer key from the environment variable.
 * Accepts hex (64 chars) or raw string (padded/truncated to 32 bytes).
 */
function buildKey(): Buffer {
  if (AES_KEY_RAW.length === 64 && /^[0-9a-f]+$/i.test(AES_KEY_RAW)) {
    return Buffer.from(AES_KEY_RAW, 'hex');
  }
  // Fallback: SHA-256 the raw string to always get a 32-byte key
  return crypto.createHash('sha256').update(AES_KEY_RAW || 'dev_only_aes_key_change_in_prod').digest();
}

export function aesMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST' || !req.body?.params) return next();

  try {
    const raw     = Buffer.from(req.body.params as string, 'base64').toString('utf8');
    const payload = JSON.parse(raw) as { iv: string; tag: string; data: string };

    if (!payload.iv || !payload.tag || !payload.data) {
      return res.status(400).json({ success: false, message: 'Invalid encrypted payload structure' });
    }

    const key      = buildKey();
    const iv       = Buffer.from(payload.iv,   'base64');
    const tag      = Buffer.from(payload.tag,  'base64');
    const cipher   = Buffer.from(payload.data, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted  = decipher.update(cipher);
    decrypted      = Buffer.concat([decrypted, decipher.final()]);

    req.body = JSON.parse(decrypted.toString('utf8'));
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Decryption failed' });
  }
}
