'use strict';
/**
 * shared/routes/audit.routes.ts
 * Mount per-project: router.use('/', require('../../../shared/routes/audit.routes'));
 *
 * Endpoints:
 *   GET  /audit-logs                — user's own activity history
 *   GET  /admin/audit-logs          — admin: all logs with filters
 *   GET  /admin/audit-logs/:userId  — admin: logs for specific user
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const svc        = require('../services/auditService');
const { ok, error } = require('../utils/response');

// ── User: own audit trail ─────────────────────────────────────────────────────
router.get('/audit-logs', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const result = await svc.getUserLogs(req.prisma, req.user.id, {
      page: +page, limit: +limit, action,
    });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin: all logs ───────────────────────────────────────────────────────────
router.get('/admin/audit-logs', auth, adminGuard, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId, from, to } = req.query;
    const result = await svc.getAdminLogs(req.prisma, {
      page: +page, limit: +limit, action, userId, from, to,
    });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/admin/audit-logs/:userId', auth, adminGuard, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await svc.getUserLogs(req.prisma, req.params.userId, {
      page: +page, limit: +limit,
    });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
