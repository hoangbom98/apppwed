'use strict';
/**
 * shared/routes/loyalty.routes.ts
 * Mount per-project: router.use('/', require('../../../shared/routes/loyalty.routes'));
 *
 * Endpoints:
 *   GET  /loyalty                  — user: current points + tier info
 *   GET  /loyalty/history          — user: point transaction history
 *   GET  /loyalty/tiers            — public: tier definitions
 *   POST /loyalty/redeem           — user: redeem points for reward
 *   GET  /admin/loyalty/leaderboard — admin: top loyalty users
 *   POST /admin/loyalty/adjust     — admin: manual point adjustment
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const auditLog   = require('../middlewares/auditLogger');
const svc        = require('../services/loyaltyService');
const { ok, error } = require('../utils/response');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/loyalty/tiers', async (req, res) => {
  try {
    const tiers = await svc.getTiers(req.prisma, req.project);
    return ok(res, tiers);
  } catch (e) { return error(res, e.message, 500); }
});

// ── User ──────────────────────────────────────────────────────────────────────
router.get('/loyalty', auth, async (req, res) => {
  try {
    const data = await svc.getUserLoyalty(req.prisma, req.user.id, req.project);
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/loyalty/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await svc.getHistory(req.prisma, req.user.id, { page: +page, limit: +limit });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/loyalty/redeem', auth, auditLog, async (req, res) => {
  try {
    const { rewardId, points } = req.body;
    if (!rewardId || !points) return error(res, 'rewardId and points are required', 422);
    const result = await svc.redeem(req.prisma, req.user.id, rewardId, +points, req.project);
    return ok(res, result);
  } catch (e) { return error(res, e.message, e.message.includes('nsufficient') ? 400 : 500); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/loyalty/leaderboard', auth, adminGuard, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const data = await svc.getLeaderboard(req.prisma, +limit);
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/admin/loyalty/adjust', auth, adminGuard, auditLog, async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    if (!userId || points === undefined) return error(res, 'userId and points are required', 422);
    const result = await svc.adminAdjust(req.prisma, userId, +points, reason, req.user.id);
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
