// @ts-nocheck
/* eslint-disable */

﻿/**
 * shared/services/authService.ts — JWT generation, bcrypt, token verification.
 *
 * IMPORTANT: generateTokens() REQUIRES a `project` field in the payload.
 * Every module login controller must pass { id, email, role, project: 'game' }.
 * The auth middleware enforces this binding at request time.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

// ── Class-based variant (for dependency injection in services) ────────────────

export class AuthService {
  constructor(private readonly prisma: any) {}

  async register({ email, password, fullName, phone }: {
    email: string; password: string; fullName: string; phone?: string;
  }) {
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
