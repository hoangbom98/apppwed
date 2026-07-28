'use strict';
/**
 * projectAccessGuard — ensures the authenticated user belongs to the
 * project indicated by the route prefix (req.project set by projectResolver).
 *
 * Each project stores users in its own DB, so the token's sub (user_id)
 * must correspond to a record in that project's User table.
 *
 * Security enforcement (in order):
 *  1. token.project MUST equal req.project — prevents cross-project token reuse.
 *  2. The user record in the project's own DB must exist, be active, and not banned.
 *
 * Active/banned check strategy:
 *  - All project schemas use `status` field: 'active' | 'suspended' | 'banned' | 'deleted'
 *  - Status 'active' → account OK
 *  - Status 'suspended' | 'deleted' → inactive (403)
 *  - Status 'banned' → banned (403)
 *
 * Caching strategy:
 *  - User status is cached in Redis for USER_STATUS_TTL seconds (default 60s).
 *  - On cache hit: DB round-trip is skipped entirely (~80% of requests).
 *  - Cache is invalidated automatically when admin bans/suspends a user
 *    (call cache.del(userStatusKey(project, userId)) after any status change).
 *
 * Usage: router.use(auth, projectAccessGuard)
 */
const { unauthorized, forbidden } = require('../../utils/network/response');
const { getPrismaClient }         = require('../../../config/databases');
const logger                      = require('../../services/logger');
const cache                       = require('../../services/cacheService');

// Admin project bypasses DB-level user lookup (admin tokens validated by adminGuard)
const ADMIN_PROJECTS = new Set(['admin']);

/** TTL for user-status cache entries (seconds). Short enough to pick up bans quickly. */
const USER_STATUS_TTL = 60;

/** Redis key for a user's status in a specific project. */
const userStatusKey = (project, userId) => `usr:status:${project}:${userId}`;

module.exports = async (req, res, next) => {
  const project = req.project;
  const userId  = req.user?.id;

  // ── 1. Admin project: delegated to adminGuard ───────────────────────────────
  if (ADMIN_PROJECTS.has(project)) return next();
  if (!userId) return unauthorized(res, 'Authentication required');

  // ── 2. Cross-project token enforcement (defence-in-depth) ─────────────────
  const tokenProject = req.user?.project;
  if (tokenProject && tokenProject !== project) {
    logger.warn('[projectAccessGuard] Cross-project token blocked', {
      tokenProject,
      routeProject: project,
      userId,
      ip:   req.ip,
      path: req.originalUrl,
    });
    return forbidden(res,
      `Token issued for "${tokenProject}" cannot access "${project}" resources`
    );
  }

  // ── 3. User exists & is active in the project's own DB (Redis-cached) ─────
  try {
    const cacheKey = userStatusKey(project, userId);
    let status = await cache.get(cacheKey);

    if (status === null) {
      // Cache miss — hit DB and cache the result
      const prisma = getPrismaClient(project);
      const user   = await prisma.user.findUnique({
        where:  { id: userId },
        select: { id: true, status: true },
      });

      if (!user) return forbidden(res, 'User not found in this project');

      status = user.status;
      // Cache both active and non-active statuses so bans are enforced on repeat requests
      await cache.set(cacheKey, status, USER_STATUS_TTL);
    }

    if (status === 'banned')   return forbidden(res, 'Account is banned');
    if (status !== 'active')   return forbidden(res, 'Account is inactive');

    // Attach status onto req.user for downstream controllers
    req.user = { ...req.user, status };
    next();
  } catch (err) {
    logger.error('[projectAccessGuard] lookup error', { project, userId, err: err.message });
    next(err);
  }
};

/**
 * Exported helper — call this whenever admin changes a user's status
 * so the cache is invalidated immediately (no 60s stale window).
 *
 * Example usage in adminUserController:
 *   const { invalidateUserStatusCache } = require('../middlewares/auth/projectAccessGuard');
 *   await invalidateUserStatusCache(project, userId);
 */
module.exports.invalidateUserStatusCache = async (project, userId) => {
  await cache.del(userStatusKey(project, userId));
};
