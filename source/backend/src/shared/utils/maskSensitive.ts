/**
 * maskSensitive.ts — Tầng 4: PII masking for logs
 *
 * Masks sensitive fields before they hit Winston logger or any log transport.
 *
 * Usage:
 *   import { maskSensitive } from '../utils/maskSensitive';
 *   logger.info('[Wallet] user data', maskSensitive({ phone: '0901234567', balance: 5000 }));
 *   // logs: { phone: '090*****67', balance: '***' }
 */

const PII_FIELDS = new Set([
  'phone', 'phoneNumber', 'mobile',
  'email',
  'password', 'passwordHash',
  'balance', 'frozen', 'totalDeposit',
  'bankAccount', 'bankNumber', 'cardNumber',
  'idCard', 'passport', 'nationalId',
  'twoFaSecret', 'twoFactorSecret',
  'token', 'accessToken', 'refreshToken',
  'encryptionKey', 'secret',
  'frontImage', 'backImage', 'selfieImage',
]);

function maskPhone(val: string): string {
  if (!val || val.length < 6) return '***';
  return val.slice(0, 3) + '*'.repeat(Math.max(val.length - 5, 3)) + val.slice(-2);
}

function maskEmail(val: string): string {
  const atIdx = val.indexOf('@');
  if (atIdx < 2) return '***@***';
  return val.slice(0, 2) + '***' + val.slice(atIdx);
}

function maskValue(key: string, val: unknown): unknown {
  if (val === null || val === undefined) return val;
  const k = key.toLowerCase();
  if (k.includes('phone') || k.includes('mobile')) return maskPhone(String(val));
  if (k.includes('email'))                          return maskEmail(String(val));
  if (k.includes('password') || k.includes('secret') || k.includes('token') || k.includes('key')) return '[REDACTED]';
  return '***';
}

/**
 * Deep-clone an object, masking any PII fields.
 * Non-object primitives are returned as-is.
 */
export function maskSensitive<T>(data: T, depth = 0): T {
  if (depth > 5) return data;       // prevent circular reference infinite loop
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitive(item, depth + 1)) as unknown as T;
  }
  if (typeof data !== 'object') return data;

  const masked: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (PII_FIELDS.has(key)) {
      masked[key] = maskValue(key, val);
    } else if (val !== null && typeof val === 'object') {
      masked[key] = maskSensitive(val, depth + 1);
    } else {
      masked[key] = val;
    }
  }
  return masked as unknown as T;
}
