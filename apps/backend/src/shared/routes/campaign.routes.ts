// @ts-nocheck
/**
 * shared/routes/campaign.routes.ts
 *
 * Marketing campaign admin endpoints — mounted per-project.
 *
 * Mount example:
 *   router.use('/', require('../../../shared/routes/campaign.routes'));
 *
 * Endpoints:
 *   GET  /admin/campaigns            — list campaigns for this project
 *   POST /admin/campaigns            — create and optionally execute a campaign
 *   PUT  /admin/campaigns/:id/toggle — enable / disable a campaign
 *   POST /admin/campaigns/:id/execute — manually re-run a campaign
 */
'use strict';

const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const auditLog   = require('../middlewares/auditLogger');
const { ok, error, created } = require('../utils/response');
const { getPrismaClient } = require('../../config/databases');
const { CampaignService } = require('../../core/marketing/campaign.service');

function getSvc(req) {
  const adminPrisma = getPrismaClient('admin');
  return new CampaignService(adminPrisma, req.prisma, req.project);
}

// ── Admin ─────────────────────────────────────────────────────────────────────

router.get('/admin/campaigns', auth, adminGuard, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const result = await getSvc(req).listCampaigns({ skip, take: Number(limit), status });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/admin/campaigns', auth, adminGuard, auditLog, async (req, res) => {
  try {
    const { name, type, targetSegments, content, schedule, isActive } = req.body;
    if (!name || !type || !content) {
      return error(res, 'name, type và content là bắt buộc', 422);
    }
    const campaign = await getSvc(req).createCampaign({
      name,
      type,
      targetSegments: targetSegments || [],
      content,
      schedule: schedule ? new Date(schedule) : null,
      isActive,
    });
    return created(res, campaign, 'Chiến dịch đã được tạo');
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/admin/campaigns/:id/toggle', auth, adminGuard, auditLog, async (req, res) => {
  try {
    const { isActive } = req.body;
    const campaign = await getSvc(req).toggleCampaign(req.params.id, isActive !== false);
    return ok(res, campaign, 'Đã cập nhật trạng thái chiến dịch');
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/admin/campaigns/:id/execute', auth, adminGuard, auditLog, async (req, res) => {
  try {
    await getSvc(req).executeCampaign(req.params.id);
    return ok(res, null, 'Chiến dịch đang được thực thi');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
