/**
 * game/controllers/missionController.js
 *
 * Daily missions / tasks system.
 * Routes:
 *   GET  /missions                  — protected: today's mission list with progress
 *   POST /missions/:templateId/claim — protected: claim completed mission reward
 */
const { success, error, badRequest } = require('../../../shared/utils/network/response');
const missionSvc = require('../services/missionService');

// ── GET /game/missions — protected ───────────────────────────────────────────
exports.getMissions = async (req, res) => {
  try {
    const missions = await missionSvc.getTodayMissions(req.user.id, req.prisma);
    return success(res, missions);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/missions/:templateId/claim — protected ────────────────────────
exports.claimMission = async (req, res) => {
  try {
    const result = await missionSvc.claimMission(req.user.id, req.params.templateId, req.prisma);
    return success(res, result, 'Nhận thưởng nhiệm vụ thành công!');
  } catch (e) {
    const isUserError = e.message && !e.message.includes('prisma');
    if (isUserError) return badRequest(res, e.message);
    return error(res, e.message, 500);
  }
};
