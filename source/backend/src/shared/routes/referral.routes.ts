'use strict';
/**
 * shared/routes/referral.routes.ts
 * Mount per-project: router.use('/', require('../../../shared/routes/referral.routes'));
 *
 * Endpoints:
 *   GET  /referral/code            — user: get own referral code
 *   GET  /referral/stats           — user: referral count + total commission earned
 *   GET  /referral/history         — user: commission transaction history
 *   GET  /referral/tree            — user: downline tree (level 1–3)
 *   GET  /admin/referral/top       — admin: top referrers leaderboard
 *   GET  /admin/referral/:userId   — admin: referral details for a user
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const { getPrismaClient } = require('../../config/databases');
const ReferralService     = require('../services/referralService');
const { ok, error }       = require('../utils/response');

function getSvc(req) {
  const adminPrisma = getPrismaClient('admin');
  return new ReferralService(req.prisma, req.project, adminPrisma);
}

// ── User ──────────────────────────────────────────────────────────────────────
router.get('/referral/code', auth, async (req, res) => {
  try {
    const code = await getSvc(req).getOrCreateCode(req.user.id);
    return ok(res, { code });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/referral/stats', auth, async (req, res) => {
  try {
    const stats = await getSvc(req).getStats(req.user.id);
    return ok(res, stats);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/referral/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await getSvc(req).getCommissionHistory(req.user.id, { page: +page, limit: +limit });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/referral/tree', auth, async (req, res) => {
  try {
    const tree = await getSvc(req).getDownlineTree(req.user.id);
    return ok(res, tree);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/referral/top', auth, adminGuard, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const data = await getSvc(req).getTopReferrers(+limit);
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/admin/referral/:userId', auth, adminGuard, async (req, res) => {
  try {
    const data = await getSvc(req).getAdminDetail(req.params.userId);
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
