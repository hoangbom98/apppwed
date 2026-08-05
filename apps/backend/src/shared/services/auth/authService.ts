// @ts-nocheck
/* eslint-disable */

/**
 * shared/services/authService.ts — JWT generation, bcrypt, token verification,
 * password policy (NIST SP 800-63B), and optional HIBP breach check.
 *
 * IMPORTANT: generateTokens() REQUIRES a `project` field in the payload.
 * Every module login controller must pass { id, email, role, project: 'game' }.
 * The auth middleware enforces this binding at request time.
 *
 * Password policy (NIST SP 800-63B rev4):
 *  - Minimum 8 characters (recommended 12+)
 *  - No maximum length cap below 64 characters
 *  - Must not be in common/breached password lists (HIBP check when enabled)
 *  - No mandatory complexity rules (e.g. uppercase/symbol) per NIST
 *
 * Standards: OWASP A04:2025, NIST SP 800-63B, PCI DSS 4.0 req 8.3
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import https from 'https';

const JWT_SECRET         = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
  }
  // eslint-disable-next-line no-console
  console.warn('[authService] WARNING: JWT_SECRET/JWT_REFRESH_SECRET not set — using insecure dev defaults');
}

const _JWT_SECRET         = JWT_SECRET         || 'dev_only_secret_change_me_64chars';
const _JWT_REFRESH_SECRET = JWT_REFRESH_SECRET || 'dev_only_refresh_change_me_64chars';
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN         || '2h';
const JWT_REFRESH_EXP     = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const SALT_ROUNDS         = 12;

const { PROJECT_IDS: VALID_PROJECTS } = require('@lkvip/constants');
type ValidProject = string;

export interface TokenPayload {
  id:       number | string;
  email?:   string;
  role:     string;
  project:  string;
}

export interface TokenPair {
  access_token:  string;
  refresh_token: string;
}

// ── Password policy constants (NIST SP 800-63B) ──────────────────────────────

const PASSWORD_MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10);
const PASSWORD_MAX_LENGTH = 128; // PCI DSS 4.0: no upper limit < 128
const HIBP_ENABLED        = process.env.HIBP_ENABLED === 'true';

// 50 most-common passwords — offline blocklist (subset; HIBP covers the full list)
const COMMON_PASSWORDS = new Set([
  'password','password1','password123','12345678','123456789','1234567890',
  'qwerty123','qwertyui','iloveyou','sunshine','princess','welcome1',
  'monkey123','dragon123','baseball','football','superman','batman123',
  'abc12345','letmein1','admin123','master123','shadow123','123qwerty',
  'passw0rd','p@ssword','p@ssw0rd','password!','123456!@','qwerty!23',
  'hello123','test1234','user1234','login123','secret12','changeme1',
  'pass1234','111111111','000000000','1q2w3e4r','1q2w3e4r5t','qazwsxedc',
  'asdfghjkl','zxcvbnm12','truelove1','forever12','trustno11','matrix123',
]);

export interface PasswordStrengthResult {
  valid:    boolean;
  score:    number;   // 0–4
  feedback: string;
}

/**
 * Validate password against NIST SP 800-63B policy.
 * Returns { valid, score, feedback }.
 * Call before hashing during registration and password-change flows.
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, score: 0, feedback: 'Mật khẩu là bắt buộc' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid:    false,
      score:    0,
      feedback: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự (NIST SP 800-63B)`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      valid:    false,
      score:    0,
      feedback: `Mật khẩu không được vượt quá ${PASSWORD_MAX_LENGTH} ký tự`,
    };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      valid:    false,
      score:    0,
      feedback: 'Mật khẩu quá phổ biến — vui lòng chọn mật khẩu khác',
    };
  }

  // Entropy scoring (0–4)
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(4, score);

  const feedbackMap: Record<number, string> = {
    0: 'Mật khẩu rất yếu',
    1: 'Mật khẩu yếu — thêm ký tự đặc biệt hoặc số',
    2: 'Mật khẩu trung bình — nên dài hơn 12 ký tự',
    3: 'Mật khẩu khá mạnh',
    4: 'Mật khẩu rất mạnh',
  };

  return { valid: true, score, feedback: feedbackMap[score] };
}

/**
 * Check password against HaveIBeenPwned k-Anonymity API.
 * Uses SHA-1 prefix matching — password is NEVER sent in full.
 * Only called when HIBP_ENABLED=true (opt-in for latency reasons).
 * Returns true if breached, false otherwise (fails open on error).
 *
 * HIBP API: https://api.pwnedpasswords.com/range/{first5} — free, no auth.
 * Standard: NIST SP 800-63B §5.1.1 — "check against known breached values".
 */
export async function checkPwnedPassword(password: string): Promise<boolean> {
  if (!HIBP_ENABLED) return false;
  try {
    // SHA-1 of the password — HIBP uses SHA-1 for its dataset
    const sha1  = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await new Promise<string>((resolve, reject) => {
      const req = https.get(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        { headers: { 'User-Agent': 'LKVIP-SecurityCheck/1.0', 'Add-Padding': 'true' } },
        (res) => {
          let data = '';
          res.on('data', (c: string) => (data += c));
          res.on('end', () => resolve(data));
        },
      );
      req.on('error', reject);
      req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')); });
    });

    // Each line: "<SUFFIX>:<count>"
    return response.split('\n').some((line) => line.split(':')[0].trim() === suffix);
  } catch {
    // Fail open — never block registration on HIBP API unavailability
    return false;
  }
}

/**
 * Validate + optionally HIBP-check a password during registration/change.
 * Returns an error string or null if the password is acceptable.
 */
export async function checkNewPassword(password: string): Promise<string | null> {
  const strength = validatePasswordStrength(password);
  if (!strength.valid) return strength.feedback;

  const breached = await checkPwnedPassword(password);
  if (breached) {
    return 'Mật khẩu này đã xuất hiện trong dữ liệu bị rò rỉ (HIBP). Vui lòng chọn mật khẩu khác.';
  }
  return null; // null = valid
}

// ── Password helpers ──────────────────────────────────────────────────────────

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

export const comparePassword = (plain: string, hashed: string): Promise<boolean> =>
  bcrypt.compare(plain, hashed);

// ── Token generation ──────────────────────────────────────────────────────────

/**
 * Generate access + refresh token pair.
 * `project` is REQUIRED and must be a valid sub-project code.
 *
 * @throws Error if `project` is missing or invalid.
 */
export function generateTokens(payload: TokenPayload): TokenPair {
  if (!payload.project) {
    throw new Error('[AuthService] generateTokens: `project` claim is required in token payload');
  }
  if (!VALID_PROJECTS.includes(payload.project as ValidProject)) {
    throw new Error(
      `[AuthService] generateTokens: invalid project "${payload.project}". ` +
      `Must be one of: ${VALID_PROJECTS.join(', ')}`,
    );
  }

  // Cast expiresIn to `any` to satisfy strict @types/jsonwebtoken StringValue overload
  const access_token  = jwt.sign(payload as object, _JWT_SECRET,        { expiresIn: JWT_EXPIRES_IN as any });
  const refresh_token = jwt.sign(payload as object, _JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXP as any });
  return { access_token, refresh_token };
}

// ── Token verification ────────────────────────────────────────────────────────

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, _JWT_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, _JWT_REFRESH_SECRET) as TokenPayload;

// ── OTP helpers (CSPRNG — NIST SP 800-63B §5.1.3) ───────────────────────────

/**
 * Generate a cryptographically secure numeric OTP (default 6 digits).
 * Uses crypto.randomInt — CSPRNG, never Math.random (OWASP A04).
 */
export function generateOtp(length = 6): string {
  const max = Math.pow(10, length);
  return String(crypto.randomInt(0, max)).padStart(length, '0');
}

/**
 * Generate a random alphanumeric code (e.g. referral code, invite code).
 * Uses crypto.randomBytes — CSPRNG.
 */
export function generateCode(length = 8): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0,O,I,1)
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map((b) => CHARS[b % CHARS.length]).join('');
}

// ── Class-based variant (for dependency injection in services) ────────────────

export class AuthService {
  constructor(private readonly prisma: any) {}

  async register({ email, password, fullName, phone }: {
    email: string; password: string; fullName: string; phone?: string;
  }) {
    const pwError = await checkNewPassword(password);
    if (pwError) throw new Error(pwError);
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return this.prisma.user.create({ data: { email, password: hashed, fullName, phone } });
  }

  async login({ email, password, project }: { email: string; password: string; project: string }) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    if (user.status !== 'active') throw new Error('Tài khoản bị khóa');
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, project });
    return { user, ...tokens };
  }
}

export default AuthService;

// ── Device / Session utilities (migrated from landing server) ─────────────────

/**
 * Parse request headers to extract a human-readable device description and IP.
 * Falls back gracefully when ua-parser-js is not installed (optional dependency).
 *
 * @param req  Express Request object
 * @returns    { deviceName: string, ip: string, userAgent: string }
 */
export function getDeviceInfo(req: any): { deviceName: string; ip: string; userAgent: string } {
  const ua  = req.headers['user-agent'] || '';
  const ip  = (
    (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );

  let deviceName = 'Unknown Device';
  try {
    // ua-parser-js is optional — install separately if needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { UAParser } = require('ua-parser-js');
    const parser = new UAParser(ua);
    const { browser, os, device } = parser.getResult();
    const parts = [
      device.vendor, device.model,
      os.name, os.version,
      browser.name ? `(${browser.name})` : '',
    ].filter(Boolean);
    deviceName = parts.join(' ') || 'Unknown Device';
  } catch {
    // ua-parser-js not installed — use a simple raw UA excerpt
    deviceName = ua.slice(0, 80) || 'Unknown Device';
  }

  return { deviceName, ip, userAgent: ua };
}

/**
 * Check whether an account is locked due to too many failed login attempts.
 * Mirrors the lockout logic from landing server (5 attempts → 30-min lock).
 *
 * @param user  User object with `failedLoginAttempts` and `lockUntil` fields.
 *              These fields are optional — the function is a no-op if absent.
 * @returns     `{ locked: boolean, unlocksAt: Date | null }`
 */
export function getAccountLockStatus(user: any): { locked: boolean; unlocksAt: Date | null } {
  if (!user) return { locked: false, unlocksAt: null };

  // Support both admin_db field name (lockedUntil) and legacy alias (lockUntil)
  const rawLock = user.lockedUntil ?? user.lockUntil ?? null;
  const lockUntil = rawLock ? new Date(rawLock) : null;
  if (lockUntil && lockUntil > new Date()) {
    return { locked: true, unlocksAt: lockUntil };
  }
  return { locked: false, unlocksAt: null };
}

/**
 * Increment failedLoginAttempts on a prisma user record.
 * Locks the account for 30 minutes after `maxAttempts` (default 5).
 *
 * @param prisma        Prisma client instance
 * @param userId        User ID to update
 * @param maxAttempts   Max failures before lock (default 5)
 * @returns             Updated `{ failedLoginAttempts, lockUntil }` fields
 */
export async function recordFailedLogin(
  prisma: any,
  userId: string | number,
  maxAttempts = 5,
): Promise<{ loginAttempts: number; lockedUntil: Date | null }> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { loginAttempts: true },
  });

  const attempts    = ((user?.loginAttempts) || 0) + 1;
  const lockedUntil = attempts >= maxAttempts
    ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    : null;

  const updated = await prisma.user.update({
    where: { id: userId },
    data:  { loginAttempts: attempts, lockedUntil },
    select: { loginAttempts: true, lockedUntil: true },
  });

  return updated;
}

/**
 * Reset loginAttempts and lockedUntil after a successful login.
 * Matches admin_db User schema field names.
 *
 * @param prisma    Prisma client instance (admin project)
 * @param userId    User ID to reset
 */
export async function resetFailedLogin(prisma: any, userId: string | number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:  { loginAttempts: 0, lockedUntil: null },
  });
}
