// @ts-nocheck
/**
 * shared/routes/affiliate.routes.ts
 *
 * Affiliate endpoints — mounted per-project by each module's routes/index.ts.
 *
 * Mount example:
 *   router.use('/', require('../../../shared/routes/affiliate.routes'));
 *
 * Endpoints:
 *   GET  /affiliate              — user: get own affiliate profile & stats
 *   POST /affiliate/register     — user: apply to become an affiliate
 *   GET  /affiliate/link         — user: get tracking link
 *   GET  /admin/affiliate        — admin: list all affiliates (paginated)
 *   PUT  /admin/affiliate/:id/approve — admin: approve affiliate
 *   PUT  /admin/affiliate/:id/reject  — admin: reject affiliate
 */
'use strict';

const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const { ok, error, created } = require('../utils/response');
const { getPrismaClient } = require('../../config/databases');
const { AffiliateService } = require('../../core/rewards/affiliate.service');

function getSvc(req) {
  const adminPrisma = getPrismaClient('admin');
  return new AffiliateService(adminPrisma, req.project);
}

// ── User ──────────────────────────────────────────────────────────────────────

router.get('/affiliate', auth, async (req, res) => {
  try {
    const stats = await getSvc(req).getStats(req.user.id);
    if (!stats) return ok(res, { registered: false });
    return ok(res, { registered: true, ...stats });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/affiliate/register', auth, async (req, res) => {
  try {
    const { website, socialMedia, notes } = req.body;
    const affiliate = await getSvc(req).registerAffiliate(req.user.id, { website, socialMedia, notes });
    return created(res, affiliate, 'Đăng ký affiliate thành công. Vui lòng chờ xét duyệt.');
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/affiliate/link', auth, async (req, res) => {
  try {
    const svc = getSvc(req);
    const adminPrisma = getPrismaClient('admin');
    const affiliate = await adminPrisma.affiliate.findFirst({
      where: { userId: req.user.id, project: req.project },
    });
    if (!affiliate || affiliate.status !== 'ACTIVE') {
      return error(res, 'Tài khoản affiliate chưa được kích hoạt', 403);
    }
    const link = svc.generateLink(affiliate.trackingId, req.query.campaign);
    return ok(res, { trackingId: affiliate.trackingId, link });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────

router.get('/admin/affiliate', auth, adminGuard, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const result = await getSvc(req).adminList({ skip, take: Number(limit), status });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/admin/affiliate/:id/approve', auth, adminGuard, async (req, res) => {
  try {
    const rate = req.body.commissionRate ? Number(req.body.commissionRate) : 0.10;
    const affiliate = await getSvc(req).approveAffiliate(req.params.id, rate);
    return ok(res, affiliate, 'Affiliate đã được kích hoạt');
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/admin/affiliate/:id/reject', auth, adminGuard, async (req, res) => {
  try {
    const { reason } = req.body;
    const affiliate = await getSvc(req).rejectAffiliate(req.params.id, reason);
    return ok(res, affiliate, 'Affiliate đã bị từ chối');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
