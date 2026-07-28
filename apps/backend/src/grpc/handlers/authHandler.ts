// @ts-nocheck
'use strict';
/**
 * apps/backend/src/grpc/handlers/authHandler.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * gRPC service implementation for AuthService (proto/auth.proto).
 *
 * Login    — Unary. Mirrors /api/{project}/auth/login across all 5 projects.
 * Register — Unary. Mirrors /api/{project}/auth/register.
 * Refresh  — Unary. Issues new token pair from refresh token.
 * Logout   — Unary. Invalidates refresh token in DB.
 * Me       — Unary. Returns authenticated user profile.
 *
 * All project token isolation (decoded.project === req.project) is enforced
 * by the authInterceptor — handlers only run after auth passes.
 */
const grpc = require('@grpc/grpc-js');
const {
  comparePassword,
  hashPassword,
  generateTokens,
  verifyToken,
  verifyRefreshToken,
} = require('../../shared/services/auth/authService');
const { getUserFromCall, extractUser } = require('../interceptors/authInterceptor');
const { getPrismaClient } = require('../../config/databases');
const logger = require('../../shared/services/core/logger');

const VALID_PROJECTS = new Set(['hub', 'game', 'trade', 'dating', 'sports']);

// ── Login — Unary ─────────────────────────────────────────────────────────────

async function login(call, callback) {
  const { username_or_email, password, project } = call.request;
  if (!username_or_email || !password || !project) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'username_or_email, password, project required' });
  }
  if (!VALID_PROJECTS.has(project)) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: `Invalid project: ${project}` });
  }

  try {
    const prisma = getPrismaClient(project);
    const isEmail = username_or_email.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: username_or_email.toLowerCase() }
        : { OR: [{ username: username_or_email }, { phone: username_or_email }] },
    });

    if (!user) return callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
    if (user.status !== 'active') return callback({ code: grpc.status.PERMISSION_DENIED, message: 'Account inactive' });

    const valid = await comparePassword(password, user.password);
    if (!valid) return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Invalid credentials' });

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role || 'user', project });

    // Store refresh token in DB if the model exists
    try {
      await prisma.refreshToken.create({
        data: { userId: user.id, token: tokens.refresh_token, expiresAt: new Date(Date.now() + 30 * 86400_000) },
      });
    } catch { /* model may not exist in all projects */ }

    callback(null, {
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id:       String(user.id),
        email:    user.email || '',
        role:     user.role  || 'user',
        project,
        username: user.username || '',
        avatar:   user.avatar   || '',
      },
    });
  } catch (err) {
    logger.error('[gRPC Auth] login error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ── Register — Unary ──────────────────────────────────────────────────────────

async function register(call, callback) {
  const { username, email, password, project, referral_code } = call.request;
  if (!username || !email || !password || !project) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'username, email, password, project required' });
  }
  if (!VALID_PROJECTS.has(project)) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: `Invalid project: ${project}` });
  }

  try {
    const prisma = getPrismaClient(project);
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username }] },
    });
    if (exists) return callback({ code: grpc.status.ALREADY_EXISTS, message: 'Email or username already registered' });

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, email: email.toLowerCase(), password: hashed, role: 'user', status: 'active' },
    });

    const tokens = generateTokens({ id: user.id, email: user.email, role: 'user', project });
    callback(null, {
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: { id: String(user.id), email: user.email, role: 'user', project, username, avatar: '' },
    });
  } catch (err) {
    logger.error('[gRPC Auth] register error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ── Refresh — Unary ───────────────────────────────────────────────────────────

async function refresh(call, callback) {
  const { refresh_token, project } = call.request;
  if (!refresh_token || !project) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'refresh_token and project required' });
  }
  try {
    const decoded = verifyRefreshToken(refresh_token);
    const tokens  = generateTokens({ id: decoded.id, email: decoded.email, role: decoded.role, project });
    callback(null, { access_token: tokens.access_token, refresh_token: tokens.refresh_token });
  } catch (err) {
    callback({ code: grpc.status.UNAUTHENTICATED, message: 'Invalid or expired refresh token' });
  }
}

// ── Logout — Unary ────────────────────────────────────────────────────────────

async function logout(call, callback) {
  const { access_token, project } = call.request;
  try {
    if (access_token && project && VALID_PROJECTS.has(project)) {
      const decoded = verifyToken(access_token);
      const prisma  = getPrismaClient(project);
      // Delete refresh token if model exists
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.id } }).catch(() => {});
    }
  } catch { /* ignore invalid token on logout */ }
  callback(null, { success: true });
}

// ── Me — Unary ────────────────────────────────────────────────────────────────

async function me(call, callback) {
  const user = getUserFromCall(call);
  if (!user) return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });

  try {
    const prisma  = getPrismaClient(user.project || 'hub');
    const userRec = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { id: true, email: true, username: true, role: true, avatar: true, status: true },
    });
    if (!userRec) return callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });

    callback(null, {
      id:       String(userRec.id),
      email:    userRec.email    || '',
      role:     userRec.role     || 'user',
      project:  user.project,
      username: userRec.username || '',
      avatar:   userRec.avatar   || '',
    });
  } catch (err) {
    logger.error('[gRPC Auth] me error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

module.exports = { login, register, refresh, logout, me };
