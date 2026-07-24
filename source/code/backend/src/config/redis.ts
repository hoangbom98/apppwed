// @ts-nocheck
/**
 * Redis client — ioredis with graceful fallback to in-memory Map
 * Usage:
 *   const redis = require('./redis');
 *   await redis.set('key', 'value', 'EX', 300);
 *   const v = await redis.get('key');
 *   await redis.del('key');
 */
const logger = require('../shared/services/logger');

let client = null;

/* ── Try to connect ioredis ─────────────────────────────────── */
try {
  const Redis = require('ioredis');
  const url   = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  client = new Redis(url, {
    lazyConnect:        true,
    enableReadyCheck:   false,
    maxRetriesPerRequest: 1,
    connectTimeout:     3000,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying
      return Math.min(times * 200, 2000);
    },
  });

  client.on('connect',   () => logger.info('[Redis] Connected'));
  client.on('error',     (err) => logger.warn(`[Redis] Error: ${err.message}`));
  client.on('reconnecting', () => logger.info('[Redis] Reconnecting…'));

  // Attempt connection — failure is non-fatal
  client.connect().catch((err) => {
    logger.warn(`[Redis] Could not connect: ${err.message} — using in-memory cache`);
    client = null;
  });
} catch {
  logger.warn('[Redis] ioredis not available — using in-memory cache');
  client = null;
}

/* ── In-memory fallback ─────────────────────────────────────── */
const mem = new Map();
const memSet = (k, v, exSec) =>
  mem.set(k, { v, exp: exSec ? Date.now() + exSec * 1000 : null });
const memGet = (k) => {
  const entry = mem.get(k);
  if (!entry) return null;
  if (entry.exp && Date.now() > entry.exp) { mem.delete(k); return null; }
  return entry.v;
};

/* ── Public interface (mirrors ioredis API) ─────────────────── */
const redis = {
  /** Get raw string value */
  async get(key) {
    if (client) return client.get(key).catch(() => memGet(key));
    return memGet(key);
  },

  /** Set with optional EX seconds: set(k, v, 'EX', 300) */
  async set(key, value, exArg, exSec) {
    if (client) {
      // ioredis set(key, value, 'EX', secs)
      return client.set(key, value, ...(exArg === 'EX' ? ['EX', exSec] : [])).catch(() => memSet(key, value, exSec));
    }
    memSet(key, value, exArg === 'EX' ? exSec : undefined);
  },

  /** setEx shorthand */
  async setEx(key, seconds, value) {
    if (client) return client.setex(key, seconds, value).catch(() => memSet(key, value, seconds));
    memSet(key, value, seconds);
  },

  /** Delete one or more keys */
  async del(...keys) {
    if (client) return client.del(...keys).catch(() => keys.forEach(k => mem.delete(k)));
    keys.forEach(k => mem.delete(k));
  },

  /** Check if key exists */
  async exists(key) {
    if (client) return client.exists(key).catch(() => (mem.has(key) ? 1 : 0));
    return mem.has(key) ? 1 : 0;
  },

  /** Keys matching pattern (in-mem is simplified) */
  async keys(pattern) {
    if (client) return client.keys(pattern).catch(() => []);
    const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return [...mem.keys()].filter(k => re.test(k));
  },

  /** Flush all */
  async flushDb() {
    if (client) return client.flushdb().catch(() => mem.clear());
    mem.clear();
  },

  /** Increment */
  async incr(key) {
    if (client) return client.incr(key).catch(() => {
      const n = (Number(memGet(key)) || 0) + 1;
      memSet(key, String(n));
      return n;
    });
    const n = (Number(memGet(key)) || 0) + 1;
    memSet(key, String(n));
    return n;
  },

  /** Raw client (ioredis or null) */
  get raw() { return client; },

  /** Is Redis connected? */
  get isConnected() { return !!client; },
};

module.exports = redis;
