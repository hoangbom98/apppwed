// code/backend/src/shared/middlewares/auth.js
/**
 * JWT Authentication Middleware — enforces token ownership per project.
 *
 * Each JWT payload MUST contain a `project` field matching the current
 * req.project (set by projectResolver). This prevents token cross-use:
 *   • A Game token cannot call Hub APIs (and vice-versa).
 *   • An Admin token can only call /api/admin/* routes.
 *
 * Token payload schema:
 *   { id: userId, email?, role, project: 'hub'|'game'|'trade'|'dating'|'sports'|'admin' }
 *
 * Token sources (in priority order):
 *   1. Authorization: Bearer <token>  (API clients, mobile apps)
 *   2. Cookie: access_token           (browser-based SPA — set by setAuthCookies)
 *
 * Error responses:
 *   401 — Missing / invalid / expired token
 *   403 — Token project does not match the requested route's project
 */
'use strict';
const jwt    = require('jsonwebtoken');
const logger = require('../services/logger');

const { PROJECT_IDS } = require('@lkvip/constants');
const VALID_PROJECTS  = new Set(PROJECT_IDS);

module.exports = (req, res, next) => {
  // ── 1. Extract token — Bearer header takes priority, cookie is fallback ───
  // Bearer: "Authorization: Bearer <token>"  — API clients / mobile apps
  // Cookie: "access_token=<token>"           — browser-based SPA requests
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7); // strip "Bearer "
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // ── 2. Verify signature + expiry ──────────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    logger.warn('[Auth] Token verification failed', { error: err.message, path: req.path });
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  // ── 3. Project-claim enforcement ──────────────────────────────────────────
  // req.project is set by projectResolver BEFORE this middleware runs.
  // decoded.project must match — enforces token isolation between sub-projects.
  const tokenProject   = decoded.project;
  const routeProject   = req.project;

  if (!tokenProject || !VALID_PROJECTS.has(tokenProject)) {
    logger.warn('[Auth] Token missing or invalid project claim', {
      tokenProject, routeProject, userId: decoded.id, path: req.path,
    });
    return res.status(403).json({
      success:  false,
      message:  'Token does not belong to a valid project',
      provided: tokenProject,
    });
  }

  if (tokenProject !== routeProject) {
    logger.warn('[Auth] Cross-project token attempt blocked', {
      tokenProject, routeProject, userId: decoded.id, ip: req.ip, path: req.path,
    });
    return res.status(403).json({
      success:  false,
      message:  `Token issued for project "${tokenProject}" cannot be used on project "${routeProject}"`,
      required: routeProject,
      provided: tokenProject,
    });
  }

  // ── 4. Attach decoded user to request ─────────────────────────────────────
  req.user = {
    id:      decoded.id,
    email:   decoded.email    || null,
    role:    decoded.role     || 'user',
    project: decoded.project,
    // modules[] gates the frontend registry (ProtectedRoute + getVisibleMenuGroups).
    // Passed through so downstream middlewares & controllers can read req.user.modules.
    modules: Array.isArray(decoded.modules) ? decoded.modules : [],
  };

  next();
};
