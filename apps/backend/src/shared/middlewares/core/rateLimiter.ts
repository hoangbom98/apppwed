'use strict';
/**
 * Tiered rate limiters — Redis-backed (rate-limiter-flexible) with in-memory fallback.
 *
 * Using Redis ensures consistent counters across ALL PM2 cluster workers.
 * Fallback to express-rate-limit (in-memory) when Redis is unavailable.
 *
 * REDIS SINGLETON
 * ───────────────
 * Uses the shared ioredis client from src/config/redis (NOT a new connection).
 * This ensures the entire process maintains exactly ONE Redis connection pool.
 *
 * publicLimiter     – 100 req / min  (unauthenticated endpoints)
 * authLimiter       – 20  req / min  (login / register / OTP)
 * apiLimiter        – 300 req / min  (authenticated API calls)
 * uploadLimiter     – 10  req / min  (file uploads)
 * heavyLimiter      – 5   req / min  (AI / export / bulk ops)
 * otpLimiter        – 5   req / 10 min (OTP brute-force guard)
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

const rateLimit = require('express-rate-limit');
const logger    = require('../services/logger');

// ── Use shared Redis singleton (single connection for the entire process) ─────
// config/redis.ts is already connected and handles reconnect/fallback.
// We get the raw ioredis client (or null if Redis is unavailable).
const redisStore = require('../../config/redis');

// ── Redis-backed limiter setup ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RateLimiterRedisClass: (new (opts: Record<string, unknown>) => any) | null = null;

try {
  const { RateLimiterRedis } = require('rate-limiter-flexible');
  RateLimiterRedisClass = RateLimiterRedis;
} catch {
  logger.warn('[RateLimit] rate-limiter-flexible not available — using in-memory rate limit');
}

// ── Violation logger ──────────────────────────────────────────────────────────
const onLimitReached = (req: Request, _res: Response, opts: { max: number; windowMs: number }) => {
  logger.security('rate_limit_exceeded', {
    ip:     req.ip,
    path:   req.path,
    limit:  opts.max,
    window: opts.windowMs,
    user:   (req as Request & { user?: { id: number } }).user?.id,
  });
};

// ── In-memory fallback (express-rate-limit) ───────────────────────────────────
const makeMemoryLimit = (max: number, windowMs = 60_000, message = 'Too many requests'): RequestHandler =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    message:         { success: false, message },
    handler: (req: Request, res: Response, _next: NextFunction, opts: { message: object }) => {
      onLimitReached(req, res, { max, windowMs });
      res.status(429).json(opts.message);
    },
  });

// ── Redis-backed limiter factory (uses shared singleton) ─────────────────────
function makeRedisLimit(
  keyPrefix: string,
  points: number,
  durationSec: number,
  message = 'Too many requests',
): RequestHandler {
  // Lazily create the rate-limiter on first request.
  // By then, the shared Redis client will have had time to connect.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let limiter: any = null;

  const buildLimiter = () => {
    // redisStore.raw is the raw ioredis client (or null when unavailable)
    const rawClient = redisStore.raw;
    if (!RateLimiterRedisClass || !rawClient) return null;
    try {
      return new RateLimiterRedisClass({
        storeClient:   rawClient,
        keyPrefix:     `rl:${keyPrefix}`,
        points,
        duration:      durationSec,
        blockDuration: Math.min(durationSec * 2, 300),
        // insuranceLimiter falls back to memory when Redis is momentarily unavailable
        insuranceLimiter: {
          points:   points * 2, // more lenient when falling back
          duration: durationSec,
        },
      });
    } catch { return null; }
  };

  const redisMiddleware: RequestHandler = async (req, res, next) => {
    if (!limiter) limiter = buildLimiter();
    if (!limiter) return next(); // Redis not available — pass through

    try {
      await limiter.consume(req.ip ?? 'unknown');
      next();
    } catch (rejRes: unknown) {
      const rej = rejRes as { msBeforeNext?: number };
      logger.security('rate_limit_exceeded', {
        ip:         req.ip,
        path:       req.path,
        limit:      points,
        window:     durationSec,
        retryAfter: rej.msBeforeNext ? Math.round(rej.msBeforeNext / 1000) : null,
      });
      res.set('Retry-After', String(Math.ceil((rej.msBeforeNext ?? durationSec * 1000) / 1000)));
      res.status(429).json({ success: false, message });
    }
  };

  const memoryFallback = makeMemoryLimit(points, durationSec * 1000, message);

  return (req: Request, res: Response, next: NextFunction) => {
    // Use Redis limiter if the shared client is connected, otherwise fall back to memory
    if (redisStore.isConnected) return redisMiddleware(req, res, next);
    return memoryFallback(req, res, next);
  };
}

// ── Export named limiters ─────────────────────────────────────────────────────
module.exports = {
  /** 100 req / 60s — unauthenticated API endpoints */
  publicLimiter:  makeRedisLimit('public',  100, 60,  'Rate limit exceeded — please slow down'),

  /** 20 req / 60s — login / register / email verification */
  authLimiter:    makeRedisLimit('auth',    20,  60,  'Too many auth attempts — wait 1 minute'),

  /** 300 req / 60s — authenticated API calls */
  apiLimiter:     makeRedisLimit('api',     300, 60,  'API rate limit exceeded'),

  /** 10 req / 60s — file uploads */
  uploadLimiter:  makeRedisLimit('upload',  10,  60,  'Upload rate limit exceeded'),

  /** 5 req / 60s — AI / export / heavy bulk operations */
  heavyLimiter:   makeRedisLimit('heavy',   5,   60,  'Heavy operation rate limit exceeded'),

  /** 5 req / 600s — OTP requests (prevent brute-force) */
  otpLimiter:     makeRedisLimit('otp',     5,   600, 'Too many OTP requests — try again in 10 minutes'),
};
