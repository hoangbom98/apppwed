// @ts-nocheck
/**
 * shared/routes/leaderboard.routes.ts
 *
 * Leaderboard endpoints — mounted per-project.
 *
 * Mount example:
 *   router.use('/', require('../../../shared/routes/leaderboard.routes'));
 *
 * Endpoints:
 *   GET /leaderboard              — list available board types for this project
 *   GET /leaderboard/:boardType   — get top-100 for a board (public, cached)
 *   GET /leaderboard/:boardType/me — get caller's rank on a board
 */
'use strict';

const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { httpCache } = require('../middlewares/httpCache');
const { ok, error } = require('../utils/response');
const { LeaderboardService } = require('../../core/gamification/leaderboard.service');

function getSvc(req) {
  return new LeaderboardService(req.prisma, req.project);
}

// ── Public: available boards ──────────────────────────────────────────────────
router.get('/leaderboard', httpCache(60), async (req, res) => {
  try {
    const types = getSvc(req).getBoardTypes();
    return ok(res, { project: req.project, types });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Public: top-N for a board ─────────────────────────────────────────────────
router.get('/leaderboard/:boardType', httpCache(300), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const data  = await getSvc(req).getTopN(req.params.boardType, limit);
    return ok(res, { boardType: req.params.boardType, data });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Protected: caller's own rank ──────────────────────────────────────────────
router.get('/leaderboard/:boardType/me', auth, async (req, res) => {
  try {
    const rank = await getSvc(req).getUserRank(req.user.id, req.params.boardType);
    return ok(res, rank);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
