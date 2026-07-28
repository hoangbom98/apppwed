'use strict';
/**
 * game/controllers/sessionController.js
 * Manages game session lifecycle — launch, track, end.
 * IDs are CUIDs (strings), not integers.
 */
const { created, success, error, notFound, forbidden } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

// ── POST /api/game/sessions/launch ───────────────────────────────────────────
exports.launch = async (req, res) => {
  try {
    const { gameId, returnUrl } = req.body;
    if (!gameId) return error(res, 'gameId is required', 400);

    const game = await req.prisma.game.findUnique({
      where:   { id: String(gameId) },
      include: { product: { include: { aggregator: true } } },
    });
    if (!game) return notFound(res, 'Game not found');
    if (game.underMaintenance) return error(res, 'Game is under maintenance', 503);

    const session = await req.prisma.gameSession.create({
      data: {
        userId:    req.user.id,
        gameId:    String(gameId),
        betAmount: 0,
        status:    'playing',
      },
    });

    // Build a provisional launch URL — the real URL comes from GameLaunchController
    // This endpoint records the session; the client gets the actual game URL from /v1/launch
    const aggregatorBaseUrl = game.product?.aggregator?.baseUrl ?? '';
    const launchUrl = aggregatorBaseUrl
      ? `${aggregatorBaseUrl}?session=${session.id}${returnUrl ? '&returnUrl=' + encodeURIComponent(returnUrl) : ''}`
      : null;

    return created(res, { sessionId: session.id, launchUrl, game: { id: game.id, name: game.name, type: game.type } });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── GET /api/game/sessions/:id ───────────────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await req.prisma.gameSession.findUnique({
      where:   { id: req.params.id },
      include: { game: { select: { id: true, name: true, slug: true, thumbnail: true, type: true } } },
    });
    if (!session) return notFound(res);
    if (session.userId !== req.user.id) return forbidden(res);
    return success(res, session);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── POST /api/game/sessions/:id/end ─────────────────────────────────────────
exports.endSession = async (req, res) => {
  try {
    const session = await req.prisma.gameSession.findUnique({ where: { id: req.params.id } });
    if (!session) return notFound(res);
    if (session.userId !== req.user.id) return forbidden(res);
    if (session.status === 'finished') return success(res, session, 'Session already ended');

    const updated = await req.prisma.gameSession.update({
      where: { id: req.params.id },
      data:  { status: 'finished', finishedAt: new Date() },
    });
    return success(res, updated, 'Session ended');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── GET /api/game/sessions/history ─────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [sessions, total] = await Promise.all([
      req.prisma.gameSession.findMany({
        where:   { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip, take,
        include: { game: { select: { id: true, name: true, slug: true, thumbnail: true, type: true } } },
      }),
      req.prisma.gameSession.count({ where: { userId: req.user.id } }),
    ]);
    return success(res, sessions, null, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) {
    return error(res, e.message, 500);
  }
};
