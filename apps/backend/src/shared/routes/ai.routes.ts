'use strict';
/**
 * shared/routes/ai.routes.ts
 * Mount globally: app.use('/api', require('./shared/routes/ai.routes'));
 *
 * Endpoints (all require auth — prevents abuse):
 *   POST /ai/chat                  — chat with AI assistant
 *   POST /ai/translate             — translate text
 *   POST /ai/moderate              — content moderation check
 *   GET  /ai/suggestions           — get personalised recommendations
 *   POST /admin/ai/batch-moderate  — admin: batch moderate content
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const svc        = require('../services/aiService');
const { ok, error } = require('../utils/response');

// ── User ──────────────────────────────────────────────────────────────────────
router.post('/ai/chat', auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return error(res, 'message is required', 422);
    const reply = await svc.chat(message, history, req.user);
    return ok(res, { reply });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/ai/translate', auth, async (req, res) => {
  try {
    const { text, targetLang = 'vi' } = req.body;
    if (!text) return error(res, 'text is required', 422);
    const result = await svc.translate(text, targetLang);
    return ok(res, { translated: result });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/ai/moderate', auth, async (req, res) => {
  try {
    const { text, contentType = 'text' } = req.body;
    if (!text) return error(res, 'text is required', 422);
    const result = await svc.moderateContent(text, contentType);
    return ok(res, result);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/ai/suggestions', auth, async (req, res) => {
  try {
    const suggestions = await svc.getRecommendations(req.prisma, req.user.id, req.project);
    return ok(res, suggestions);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post('/admin/ai/batch-moderate', auth, adminGuard, async (req, res) => {
  try {
    const { items } = req.body; // [{ id, text, contentType }]
    if (!Array.isArray(items) || !items.length) return error(res, 'items[] is required', 422);
    const results = await svc.batchModerate(items);
    return ok(res, results);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
