/**
 * distributed-lock.ts
 * Redis-backed distributed lock via SET … NX EX.
 *
 * Falls back to an in-process Map when Redis is unavailable
 * (development / no REDIS_URL) so the server still boots cleanly.
 *
 * Usage:
 *   import { withLock } from '../../core/utils/distributed-lock';
 *   const result = await withLock('tcg:rv:ref123', 30, async () => { … });
 */
import IORedis from 'ioredis';

// ── Redis client (lazy, single instance) ─────────────────────────────────────
let _redis: IORedis | null = null;

function getRedis(): IORedis | null {
  if (_redis) return _redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    _redis = new IORedis(url, {
      lazyConnect:          true,
      maxRetriesPerRequest: 1,
      connectTimeout:       3_000,
      retryStrategy: (t) => (t > 2 ? null : t * 200),
    });
    _redis.on('error', () => { /* suppress — non-fatal */ });
    _redis.connect().catch(() => { _redis = null; });
    return _redis;
  } catch {
    return null;
  }
}

// ── In-process fallback lock (single-process only, no cross-node guarantee) ──
const _memLocks = new Map<string, NodeJS.Timeout>();

function memLock(key: string, ttlSec: number): boolean {
  if (_memLocks.has(key)) return false;
  const handle = setTimeout(() => _memLocks.delete(key), ttlSec * 1_000);
  _memLocks.set(key, handle);
  return true;
}
function memUnlock(key: string): void {
  const h = _memLocks.get(key);
  if (h) { clearTimeout(h); _memLocks.delete(key); }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Acquire a lock for `key` with `ttlSec` seconds expiry, run `callback`,
 * then release the lock. Throws if the resource is already locked.
 *
 * @throws `Error('Resource is locked')` when lock cannot be acquired.
 */
export async function withLock<T>(
  key:      string,
  ttlSec:   number,
  callback: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();

  if (redis) {
    const acquired = await redis.set(key, '1', 'EX', ttlSec, 'NX').catch(() => null);
    if (!acquired) throw new Error('Resource is locked');
    try {
      return await callback();
    } finally {
      await redis.del(key).catch(() => {/* ignore */});
    }
  }

  // Fallback: in-memory lock
  if (!memLock(key, ttlSec)) throw new Error('Resource is locked');
  try {
    return await callback();
  } finally {
    memUnlock(key);
  }
}

/**
 * Try to acquire the lock without throwing.
 * Returns `null` if locked, otherwise returns the callback result.
 */
export async function tryLock<T>(
  key:      string,
  ttlSec:   number,
  callback: () => Promise<T>,
): Promise<T | null> {
  try {
    return await withLock(key, ttlSec, callback);
  } catch (err: any) {
    if (err.message === 'Resource is locked') return null;
    throw err;
  }
}
