'use strict';
/**
 * shared/routes/banner.routes.ts
 * Mount globally: app.use('/api', require('./shared/routes/banner.routes'));
 *
 * Endpoints:
 *   GET  /banners                   — public: active banners (filterable by position)
 *   POST /admin/banners             — admin: create banner
 *   PUT  /admin/banners/:id         — admin: update banner
 *   PATCH /admin/banners/:id/toggle — admin: enable/disable
 *   DELETE /admin/banners/:id       — admin: delete banner
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const auditLog   = require('../middlewares/auditLogger');
const svc        = require('../services/bannerService');
const { ok, created, error } = require('../utils/response');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/banners', async (req, res) => {
  try {
    const { position, project } = req.query;
    const data = await svc.getActive(req.prisma, { position, project });
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post('/admin/banners', auth, adminGuard, auditLog, async (req, res) => {
  try {
    const banner = await svc.create(req.prisma, req.body);
    return created(res, banner);
  } catch (e) { return error(res, e.message, 422); }
});

router.put('/admin/banners/:id', auth, adminGuard, auditLog, async (req, res) => {
  try {
    const banner = await svc.update(req.prisma, req.params.id, req.body);
    return ok(res, banner);
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/admin/banners/:id/toggle', auth, adminGuard, auditLog, async (req, res) => {
  try {
    const banner = await svc.toggle(req.prisma, req.params.id);
    return ok(res, banner);
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/admin/banners/:id', auth, adminGuard, auditLog, async (req, res) => {
  try {
    await svc.remove(req.prisma, req.params.id);
    return ok(res, null, 'Banner deleted');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
