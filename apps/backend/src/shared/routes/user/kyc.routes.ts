'use strict';
/**
 * shared/routes/kyc.routes.ts
 * Mount per-project: router.use('/', require('../../../shared/routes/kyc.routes'));
 *
 * Endpoints:
 *   GET  /kyc/status               — user: current KYC status
 *   POST /kyc/submit               — user: submit KYC documents
 *   GET  /admin/kyc                — admin: list all KYC submissions (filterable)
 *   GET  /admin/kyc/:userId        — admin: get one user's KYC detail
 *   PUT  /admin/kyc/:userId/approve — admin: approve KYC
 *   PUT  /admin/kyc/:userId/reject  — admin: reject KYC with reason
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const auditLog   = require('../middlewares/auditLogger');
const { upload } = require('../services/uploadService');
const svc        = require('../services/kycService');
const { ok, created, error } = require('../utils/response');

// ── User ──────────────────────────────────────────────────────────────────────
router.get('/kyc/status', auth, async (req, res) => {
  try {
    const status = await svc.getStatus(req.prisma, req.user.id);
    return ok(res, status);
  } catch (e) { return error(res, e.message, 500); }
});

router.post(
  '/kyc/submit',
  auth,
  upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack',  maxCount: 1 },
    { name: 'selfie',  maxCount: 1 },
  ]),
  auditLog,
  async (req, res) => {
    try {
      const files = req.files || {};
      const docs  = {
        ...req.body,
        idFront: files.idFront?.[0]?.path,
        idBack:  files.idBack?.[0]?.path,
        selfie:  files.selfie?.[0]?.path,
      };
      const result = await svc.submit(req.prisma, req.user.id, docs);
      return created(res, result, 'KYC submitted — pending review');
    } catch (e) {
      return error(res, e.message, e.message.includes('đã') ? 400 : 500);
    }
  }
);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/kyc', auth, adminGuard, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const result = await svc.adminList(req.prisma, { page: +page, limit: +limit, status });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/admin/kyc/:userId', auth, adminGuard, async (req, res) => {
  try {
    const data = await svc.adminGetOne(req.prisma, req.params.userId);
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/admin/kyc/:userId/approve', auth, adminGuard, auditLog, async (req, res) => {
  try {
    const result = await svc.approve(req.prisma, req.params.userId, req.user.id);
    return ok(res, result, 'KYC approved');
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/admin/kyc/:userId/reject', auth, adminGuard, auditLog, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return error(res, 'reason is required', 422);
    const result = await svc.reject(req.prisma, req.params.userId, req.user.id, reason);
    return ok(res, result, 'KYC rejected');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
