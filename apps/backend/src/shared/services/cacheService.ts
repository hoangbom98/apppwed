// @ts-nocheck
/* eslint-disable */

'use strict';
/**
 * Cache Service — Redis-first, in-memory Map fallback.
 * Supports both local Redis and TLS cloud Redis (Upstash, Redis Cloud).
 * Connection priority:
 *   1. REDIS_URL env var (supports redis:// and rediss:// for TLS)
 *   2. REDIS_HOST / REDIS_PORT / REDIS_PASSWORD individual vars
 *   3. In-memory Map fallback (no Redis available)
 */

const logger = require('./logger');

let ioredis = null;
let client  = null;

try {
  ioredis = require('ioredis');

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    // URL-based connection — handles both redis:// (local) and rediss:// (TLS/cloud)
    const isTls = redisUrl.startsWith('rediss://');
    client = new ioredis(redisUrl, {
      lazyConnect:          true,
      maxRetriesPerRequest: 3,
      retryStrategy:        (times) => (times > 5 ? null : Math.min(times * 200, 3000)),
      ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
  } else {
    // Individual host/port/password vars — local development
    client = new ioredis({
      host:                 process.env.REDIS_HOST || '127.0.0.1',
      port:                 Number(process.env.REDIS_PORT) || 6379,
      password:             process.env.REDIS_PASSWORD || undefined,
      lazyConnect:          true,
      maxRetriesPerRequest: 3,
      retryStrategy:        (times) => (times > 5 ? null : Math.min(times * 200, 3000)),
    });
  }

  client.on('error', (err) => logger.warn(`[Cache Redis] Connection error: ${err.message}`));
  client.on('connect', () => logger.info('[Cache Redis] Connected'));
  client.connect().catch((err) => {
    logger.warn(`[Cache] Could not connect to Redis: ${err.message} — using in-memory fallback`);
    client = null;
  });
} catch (err) {
  logger.warn('[Cache] ioredis not available — using in-memory fallback');
  client = null;
}

// ── In-memory fallback ────────────────────────────────────────────────────────
const memCache = new Map();

// ── Hit/miss counters (exposed via getMetrics()) ──────────────────────────────
let _hits   = 0;
let _misses = 0;
let _errors = 0;

// ── Core ops ──────────────────────────────────────────────────────────────────

async function get(key) {
  if (client) {
    try {
      const v = await client.get(key);
      if (v !== null) { _hits++; return JSON.parse(v); }
      _misses++;
      return null;
    } catch (err) {
      _errors++;
      logger.warn(`[Cache] Redis get error for key "${key}": ${err.message}`);
      /* fall through to memCache */
    }
  }
  const item = memCache.get(key);
  if (!item) { _misses++; return null; }
  if (item.exp && Date.now() > item.exp) { memCache.delete(key); _misses++; return null; }
  _hits++;
  return item.val;
}

async function set(key, value, ttlSec = 300) {
  if (client) {
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttlSec);
      return;
    } catch (err) {
      _errors++;
      logger.warn(`[Cache] Redis set error for key "${key}": ${err.message}`);
      /* fall through */
    }
  }
  memCache.set(key, { val: value, exp: Date.now() + ttlSec * 1000 });
}

async function del(key) {
  if (client) {
    try {
      // Support pattern with wildcard e.g. 'daily:*'
      if (key.includes('*')) {
        const keys = await client.keys(key);
        if (keys.length) await client.del(...keys);
        return;
      }
      await client.del(key);
      return;
    } catch (err) {
      _errors++;
      logger.warn(`[Cache] Redis del error for key "${key}": ${err.message}`);
      /* fall through */
    }
  }
  // Memory cache — support simple wildcard
  if (key.includes('*')) {
    const prefix = key.replace('*', '');
    for (const k of memCache.keys()) {
      if (k.startsWith(prefix)) memCache.delete(k);
    }
  } else {
    memCache.delete(key);
  }
}

async function flush(mode = 'all') {
  if (mode === 'all') {
    if (client) {
      try { await client.flushdb(); } catch (err) {
        logger.warn(`[Cache] Redis flushdb error: ${err.message}`);
      }
    }
    memCache.clear();
  }
  // 'expired' mode: just clear memCache expired entries
  if (mode === 'expired') {
    const now = Date.now();
    for (const [k, v] of memCache.entries()) {
      if (v.exp && now > v.exp) memCache.delete(k);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cache-aside: get from cache or run fn() and cache the result */
async function remember(key, ttlSec, fn) {
  const cached = await get(key);
  if (cached !== null) return cached;
  const fresh = await fn();
  await set(key, fresh, ttlSec);
  return fresh;
}

/** Invalidate cache on data mutation — call after write operations */
async function invalidate(...keys) {
  await Promise.all(keys.map(k => del(k)));
}

/** Health check */
async function ping() {
  if (!client) return false;
  try { await client.ping(); return true; } catch { return false; }
}

/** Graceful disconnect */
async function disconnect() {
  if (client) {
    try { await client.quit(); } catch { /* ignore disconnect error */ }
    client = null;
  }
}

/**
 * Cache metrics — call from health-snapshot cron to log hit rate.
 * Resets counters after read.
 */
function getMetrics() {
  const total  = _hits + _misses;
  const hitRate = total > 0 ? Math.round((_hits / total) * 100) : 0;
  const metrics = {
    hits:    _hits,
    misses:  _misses,
    errors:  _errors,
    total,
    hitRate: `${hitRate}%`,
    backend: client ? 'redis' : 'memory',
  };
  // Reset counters after each read so health-snapshot shows per-interval stats
  _hits = 0; _misses = 0; _errors = 0;
  return metrics;
}

module.exports = { get, set, del, flush, remember, invalidate, ping, disconnect, getMetrics };
