/**
 * game/controllers/checkinController.js
 *
 * Daily 7-day check-in system.
 * Routes:
 *   GET  /checkin/config  — public: 7-day reward schedule
 *   GET  /checkin/status  — protected: user's streak + today's claim status
 *   POST /checkin/claim   — protected: claim today's check-in
 */
const { success, error, badRequest } = require('../../../shared/utils/network/response');
const checkinSvc = require('../services/checkinService');

// ── GET /game/checkin/config — public ─────────────────────────────────────────
exports.getConfig = async (req, res) => {
  try {
    const config = await checkinSvc.getConfig(req.prisma);
    return success(res, config);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/checkin/status — protected ─────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const status = await checkinSvc.getUserStatus(req.user.id, req.prisma);
    return success(res, status);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/checkin/claim — protected ──────────────────────────────────────
exports.claim = async (req, res) => {
  try {
    const result = await checkinSvc.claimToday(req.user.id, req.prisma);
    return success(res, result, 'Điểm danh thành công!');
  } catch (e) {
    // Service throws descriptive strings for known failures
    const isUserError = e.message && !e.message.includes('prisma') && !e.message.includes('Internal');
    if (isUserError) return badRequest(res, e.message);
    return error(res, e.message, 500);
  }
};
