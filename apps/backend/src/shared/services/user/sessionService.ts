// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';
/**
 * sessionService.ts — Redis-backed user session management.
 *
 * Sessions are stored in Redis with automatic TTL expiry.
 * Each session key is scoped to a specific project to maintain isolation.
 *
 * KEY FORMAT:
 *   session:{project}:{userId}          — active session data
 *   sessions:online:{project}           — sorted set of online users (score = last seen ts)
 *   session:refresh:{project}:{userId}  — refresh token binding
 *
 * USAGE
 * ─────
 *   const sessionService = require('./sessionService');
 *
 *   // On login — store session
 *   await sessionService.create('game', userId, { ip, ua, role });
 *
 *   // On each request — refresh session TTL
 *   await sessionService.touch('game', userId);
 *
 *   // On logout — destroy session
 *   await sessionService.destroy('game', userId);
 *
 *   // Get all online users in a project (sorted by last seen)
 *   const online = await sessionService.getOnlineUsers('game', 100);
 *
 *   // Check if user is currently online
 *   const isOnline = await sessionService.isOnline('game', userId);
 *
 * NOTE: CommonJS exports — backend package.json "type": "commonjs".
 */

const redis  = require('../../../config/redis');
const logger = require('../logger');

// ── TTLs (seconds) ────────────────────────────────────────────────────────────
const SESSION_TTL  = 2 * 60 * 60;   // 2 hours  — matches JWT_EXPIRES_IN
const ONLINE_TTL   = 5 * 60;        // 5 minutes — considered "online" window
const REFRESH_TTL  = 30 * 24 * 60 * 60; // 30 days — matches JWT_REFRESH_EXPIRES_IN

// ── Helpers ───────────────────────────────────────────────────────────────────

const sessionKey  = (project: string, userId: string | number) => `session:${project}:${userId}`;
const onlineKey   = (project: string)                          => `sessions:online:${project}`;
const refreshKey  = (project: string, userId: string | number) => `session:refresh:${project}:${userId}`;

// ── Session CRUD ──────────────────────────────────────────────────────────────

/**
 * Create (or overwrite) a session for a user in a project.
 * Call this immediately after successful login.
 *
 * @param project  Project key: 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin'
 * @param userId   User ID (string or number)
 * @param data     Session metadata: { ip, userAgent, role, email, ... }
 * @param ttl      Session lifetime in seconds (default: SESSION_TTL = 2h)
 */
async function create(
  project: string,
  userId: string | number,
  data: Record<string, unknown>,
  ttl = SESSION_TTL,
): Promise<void> {
  try {
    const sessionData = JSON.stringify({
      ...data,
      project,
      userId,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    });
    await redis.set(sessionKey(project, userId), sessionData, 'EX', ttl);
    // Add to online sorted set (score = unix timestamp for TTL-based cleanup)
    if (redis.raw) {
      await redis.raw.zadd(onlineKey(project), Date.now(), String(userId));
    }
    logger.debug(`[Session] Created session for user=${userId} project=${project} ttl=${ttl}s`);
  } catch (err: any) {
    logger.warn(`[Session] create failed for user=${userId}: ${err.message}`);
  }
}

/**
 * Refresh the TTL of an existing session (call on every authenticated request).
 * Also updates the last-seen timestamp in the online sorted set.
 *
 * @param project  Project key
 * @param userId   User ID
 */
async function touch(project: string, userId: string | number): Promise<void> {
  try {
    const key  = sessionKey(project, userId);
    const raw  = await redis.get(key);
    if (!raw) return; // session already expired — do nothing

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    data.lastSeenAt = Date.now();
    await redis.set(key, JSON.stringify(data), 'EX', SESSION_TTL);
    if (redis.raw) {
      await redis.raw.zadd(onlineKey(project), Date.now(), String(userId));
    }
  } catch (err: any) {
    logger.warn(`[Session] touch failed for user=${userId}: ${err.message}`);
  }
}

/**
 * Retrieve session data for a user.
 *
 * @returns Session object, or null if not found / expired.
 */
async function get(project: string, userId: string | number): Promise<Record<string, unknown> | null> {
  try {
    const raw = await redis.get(sessionKey(project, userId));
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err: any) {
    logger.warn(`[Session] get failed for user=${userId}: ${err.message}`);
    return null;
  }
}

/**
 * Destroy a session (on logout or ban).
 * Also removes from the online sorted set.
 *
 * @param project  Project key
 * @param userId   User ID
 */
async function destroy(project: string, userId: string | number): Promise<void> {
  try {
    await redis.del(sessionKey(project, userId));
    if (redis.raw) {
      await redis.raw.zrem(onlineKey(project), String(userId));
    }
    logger.debug(`[Session] Destroyed session for user=${userId} project=${project}`);
  } catch (err: any) {
    logger.warn(`[Session] destroy failed for user=${userId}: ${err.message}`);
  }
}

// ── Refresh token binding ─────────────────────────────────────────────────────

/**
 * Bind a refresh token to a user session.
 * Prevents token reuse after logout.
 */
async function bindRefreshToken(
  project: string,
  userId: string | number,
  refreshToken: string,
): Promise<void> {
  try {
    // Store hash of token (not raw) to prevent exposure in Redis dumps
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await redis.set(refreshKey(project, userId), tokenHash, 'EX', REFRESH_TTL);
  } catch (err: any) {
    logger.warn(`[Session] bindRefreshToken failed: ${err.message}`);
  }
}

/**
 * Verify a refresh token is still bound to the user (not revoked).
 * Returns false if the token has been revoked or the session expired.
 */
async function verifyRefreshToken(
  project: string,
  userId: string | number,
  refreshToken: string,
): Promise<boolean> {
  try {
    const stored = await redis.get(refreshKey(project, userId));
    if (!stored) return false;
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    return stored === tokenHash;
  } catch (err: any) {
    logger.warn(`[Session] verifyRefreshToken failed: ${err.message}`);
    return true; // fail-open to avoid locking out users on Redis downtime
  }
}

/**
 * Revoke a refresh token (call on logout or password change).
 */
async function revokeRefreshToken(project: string, userId: string | number): Promise<void> {
  try {
    await redis.del(refreshKey(project, userId));
  } catch (err: any) {
    logger.warn(`[Session] revokeRefreshToken failed: ${err.message}`);
  }
}

// ── Online presence ───────────────────────────────────────────────────────────

/**
 * Check whether a user is currently considered online.
 * A user is "online" if they were last seen within ONLINE_TTL seconds.
 */
async function isOnline(project: string, userId: string | number): Promise<boolean> {
  try {
    if (redis.raw) {
      const score = await redis.raw.zscore(onlineKey(project), String(userId));
      if (!score) return false;
      return Date.now() - Number(score) < ONLINE_TTL * 1000;
    }
    // Fallback: check session key exists
    const raw = await redis.get(sessionKey(project, userId));
    return !!raw;
  } catch {
    return false;
  }
}

/**
 * Get IDs of users currently online in a project, sorted by most recent activity.
 *
 * @param project  Project key
 * @param limit    Max number of results (default: 100)
 * @returns        Array of user ID strings, most recently active first.
 */
async function getOnlineUsers(project: string, limit = 100): Promise<string[]> {
  try {
    if (!redis.raw) return [];
    const cutoff = Date.now() - ONLINE_TTL * 1000;
    // Remove stale entries first
    await redis.raw.zremrangebyscore(onlineKey(project), '-inf', cutoff);
    // Return remaining, highest score (most recent) first
    const ids = await redis.raw.zrevrange(onlineKey(project), 0, limit - 1);
    return ids;
  } catch (err: any) {
    logger.warn(`[Session] getOnlineUsers failed: ${err.message}`);
    return [];
  }
}

/**
 * Count online users in a project.
 */
async function countOnline(project: string): Promise<number> {
  try {
    if (!redis.raw) return 0;
    const cutoff = Date.now() - ONLINE_TTL * 1000;
    await redis.raw.zremrangebyscore(onlineKey(project), '-inf', cutoff);
    return redis.raw.zcard(onlineKey(project));
  } catch {
    return 0;
  }
}

module.exports = {
  create,
  touch,
  get,
  destroy,
  bindRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  isOnline,
  getOnlineUsers,
  countOnline,
  SESSION_TTL,
  ONLINE_TTL,
};
