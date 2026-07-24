'use strict';
/**
 * httpCache middleware — Redis-backed HTTP response cache for public GET routes.
 *
 * Usage:
 *   const { httpCache } = require('../middlewares/httpCache');
 *   router.get('/banners', httpCache(300), bannerCtrl.list);
 *
 * Cache key is built from the full request URL (path + query string), prefixed
 * with 'hc:'. Invalidation happens via cache.invalidate() in mutating controllers.
 *
 * Only caches 200 responses. Skips cache when:
 *   - Request has Authorization header (authenticated user)
 *   - Response status !== 200
 *   - TTL is 0
 */
const cache = require('../services/cacheService');

/**
 * @param {number} ttlSec  Cache TTL in seconds (default: 300 = 5 min)
 * @returns {import('express').RequestHandler}
 */
function httpCache(ttlSec = 300) {
  return async (req, res, next) => {
    // Skip cache for authenticated requests or non-GET
    if (req.method !== 'GET' || req.headers.authorization || ttlSec === 0) {
      return next();
    }

    const key = `hc:${req.originalUrl}`;

    // ── Try cache hit ──────────────────────────────────────────────
    try {
      const cached = await cache.get(key);
      if (cached !== null) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(cached);
      }
    } catch { /* cache unavailable — fall through */ }

    // ── Cache miss: intercept json() to store the response ─────────
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      // Only cache 200 OK responses
      if (res.statusCode === 200 && ttlSec > 0) {
        try { await cache.set(key, body, ttlSec); } catch { /* ignore */ }
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate all cache keys matching a prefix pattern.
 * Call after mutating operations (create/update/delete).
 *
 * @param {string[]} patterns  e.g. ['hc:/api/hub/banners*', 'hc:/api/hub/games*']
 */
async function invalidateCache(...patterns) {
  await Promise.all(patterns.map(p => cache.del(p)));
}

module.exports = { httpCache, invalidateCache };
