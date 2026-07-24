'use strict';
/**
 * shared/routes/risk.routes.ts
 * Mount globally: app.use('/api', require('./shared/routes/risk.routes'));
 * All routes require auth + adminGuard.
 *
 * Endpoints:
 *   GET  /admin/risk/score/:userId     — risk score for a user
 *   POST /admin/risk/score/:userId     — recalculate risk score
 *   GET  /admin/risk/alerts            — list open risk alerts
 *   PATCH /admin/risk/alerts/:id       — update alert status
 *   GET  /admin/risk/ip-blacklist      — list blocked IPs
 *   POST /admin/risk/ip-blacklist      — add IP to blacklist
 *   DELETE /admin/risk/ip-blacklist/:ip — remove IP from blacklist
 *   GET  /admin/risk/security-logs     — recent security events
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const RiskScorer = require('../../risk/riskScorer');
const riskSvc    = require('../services/riskService');
const { ok, error } = require('../utils/response');

router.use(auth, adminGuard);

// ── Risk Scores ───────────────────────────────────────────────────────────────
router.get('/admin/risk/score/:userId', async (req, res) => {
  try {
    const scorer = new RiskScorer(req.prisma);
    const score  = await scorer.getScore(req.params.userId);
    return ok(res, score);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/admin/risk/score/:userId', async (req, res) => {
  try {
    const scorer = new RiskScorer(req.prisma);
    const score  = await scorer.calculate(req.params.userId);
    return ok(res, score, 'Risk score recalculated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Alerts ────────────────────────────────────────────────────────────────────
router.get('/admin/risk/alerts', async (req, res) => {
  try {
    const { status = 'open', page = 1, limit = 50 } = req.query;
    const result = await riskSvc.listAlerts(req.prisma, { status, page: +page, limit: +limit });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/admin/risk/alerts/:id', async (req, res) => {
  try {
    const { status, note } = req.body;
    const alert = await riskSvc.updateAlert(req.prisma, req.params.id, { status, note, reviewedBy: req.user.id });
    return ok(res, alert);
  } catch (e) { return error(res, e.message, 500); }
});

// ── IP Blacklist ──────────────────────────────────────────────────────────────
router.get('/admin/risk/ip-blacklist', async (req, res) => {
  try {
    const list = await riskSvc.listIpBlacklist(req.prisma);
    return ok(res, list);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/admin/risk/ip-blacklist', async (req, res) => {
  try {
    const { ip, reason, expiresAt } = req.body;
    if (!ip) return error(res, 'ip is required', 422);
    const entry = await riskSvc.addIpBlacklist(req.prisma, ip, reason, expiresAt, req.user.id);
    return ok(res, entry, 'IP added to blacklist');
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/admin/risk/ip-blacklist/:ip', async (req, res) => {
  try {
    await riskSvc.removeIpBlacklist(req.prisma, req.params.ip);
    return ok(res, null, 'IP removed from blacklist');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Security Logs ─────────────────────────────────────────────────────────────
router.get('/admin/risk/security-logs', async (req, res) => {
  try {
    const { page = 1, limit = 100, severity } = req.query;
    const result = await riskSvc.listSecurityLogs(req.prisma, { page: +page, limit: +limit, severity });
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
