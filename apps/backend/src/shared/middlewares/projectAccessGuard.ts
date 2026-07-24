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
 * Usage: router.use(auth, projectAccessGuard)
 */
const { unauthorized, forbidden } = require('../utils/response');
const { getPrismaClient }         = require('../../config/databases');
const logger                      = require('../services/logger');

// Admin project bypasses DB-level user lookup (admin tokens validated by adminGuard)
const ADMIN_PROJECTS = new Set(['admin']);

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

  // ── 3. User exists & is active in the project's own DB ────────────────────
  try {
    const prisma = getPrismaClient(project);
    const user   = await prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, status: true },
    });

    if (!user)                  return forbidden(res, 'User not found in this project');
    if (user.status === 'banned')    return forbidden(res, 'Account is banned');
    if (user.status !== 'active')    return forbidden(res, 'Account is inactive');

    // Attach status onto req.user for downstream controllers
    req.user = { ...req.user, status: user.status };
    next();
  } catch (err) {
    logger.error('[projectAccessGuard] DB lookup error', { project, userId, err: err.message });
    next(err);
  }
};
