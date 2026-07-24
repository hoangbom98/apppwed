'use strict';
/**
 * dating/controllers/matchController.js
 *
 * Swipe / match actions.
 * DB models: Match (matches), User (users)
 * Exports match what dating routes/index.js AND dating/routes/match.routes.js expect.
 */
const { ok, created, error, notFound } = require('../../../shared/utils/response');
const MatchService = require('../services/matchService');

function svc(req) { return new MatchService(req.prisma); }

// ── GET  /dating/match/profiles  ·  /dating/suggestions ────────────────────
exports.getSwipeProfiles = async (req, res) => {
  try {
    const limit   = parseInt(req.query.limit) || 10;
    const filters = {
      minAge: req.query.minAge ? parseInt(req.query.minAge) : undefined,
      maxAge: req.query.maxAge ? parseInt(req.query.maxAge) : undefined,
    };
    const profiles = await svc(req).getSuggestions(req.user.id, limit, filters);
    return ok(res, profiles);
  } catch (e) { return error(res, e.message, 500); }
};
exports.getSuggestions = exports.getSwipeProfiles;

// ── POST /dating/match/like/:id  ·  POST /dating/like ───────────────────────
exports.likeUser = async (req, res) => {
  try {
    const targetId = req.params.id || req.body.targetUserId;
    if (!targetId) return error(res, 'targetUserId is required', 400);
    const result = await svc(req).like(req.user.id, targetId, 'dating');
    return result.status === 'matched' ? created(res, result, 'It\'s a match!') : ok(res, result, 'Liked');
  } catch (e) { return error(res, e.message, 500); }
};
exports.like = exports.likeUser;

// ── POST /dating/match/nope/:id ──────────────────────────────────────────────
exports.nopeUser = async (req, res) => {
  try {
    const targetId = req.params.id || req.body.targetUserId;
    if (!targetId) return error(res, 'targetUserId is required', 400);
    // Record a "nope" — creates a match record with status 'noped' so they won't appear again
    const existing = await req.prisma.match.findFirst({
      where: { OR: [{ user1Id: req.user.id, user2Id: targetId }, { user1Id: targetId, user2Id: req.user.id }] },
    });
    if (!existing) {
      await req.prisma.match.create({ data: { user1Id: req.user.id, user2Id: targetId, status: 'noped' } });
    }
    return ok(res, null, 'Skipped');
  } catch (e) { return error(res, e.message, 500); }
};
exports.nope = exports.nopeUser;

// ── POST /dating/match/superlike/:id ────────────────────────────────────────
exports.superLike = async (req, res) => {
  try {
    const targetId = req.params.id || req.body.targetUserId;
    if (!targetId) return error(res, 'targetUserId is required', 400);
    const result = await svc(req).like(req.user.id, targetId, 'dating');
    return ok(res, { ...result, isSuperLike: true }, 'Super liked');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET  /dating/match/list  ·  /dating/matches ──────────────────────────────
exports.getMatches = async (req, res) => {
  try {
    const matches = await svc(req).getUserMatches(req.user.id);
    return ok(res, matches);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET  /dating/match/liked-me ──────────────────────────────────────────────
exports.getWhoLikedMe = async (req, res) => {
  try {
    const liked = await req.prisma.match.findMany({
      where:   { user2Id: req.user.id, status: 'liked' },
      include: { user1: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, liked);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET  /dating/match/favorites ────────────────────────────────────────────
exports.getFavorites = async (req, res) => {
  try {
    const favs = await req.prisma.match.findMany({
      where:   { OR: [{ user1Id: req.user.id }, { user2Id: req.user.id }], status: 'matched' },
      include: { user1: { select: { id: true, username: true, avatar: true } }, user2: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, favs);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/matches/:matchId/accept ────────────────────────────────────
exports.acceptMatch = async (req, res) => {
  try {
    const match = await req.prisma.match.findUnique({ where: { id: req.params.matchId } });
    if (!match) return notFound(res, 'Match not found');
    const updated = await req.prisma.match.update({ where: { id: req.params.matchId }, data: { status: 'matched' } });
    return ok(res, updated, 'Match accepted');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/matches/:matchId/reject ────────────────────────────────────
exports.rejectMatch = async (req, res) => {
  try {
    const match = await req.prisma.match.findUnique({ where: { id: req.params.matchId } });
    if (!match) return notFound(res, 'Match not found');
    const updated = await req.prisma.match.update({ where: { id: req.params.matchId }, data: { status: 'rejected' } });
    return ok(res, updated, 'Match rejected');
  } catch (e) { return error(res, e.message, 500); }
};

// Legacy alias used by matchController old routes
exports.create       = exports.likeUser;
exports.list         = exports.getMatches;
exports.updateStatus = async (req, res) => {
  try {
    const updated = await req.prisma.match.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    return ok(res, updated);
  } catch (e) { return error(res, e.message, 500); }
};
