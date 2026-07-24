'use strict';
/**
 * Autocomplete controller — Game module
 * GET /api/game/autocomplete?q=<query>[&source=game|user|all][&limit=10]
 *
 * Sources:
 *   game  — searches game catalog (name, provider)
 *   user  — searches users (username, fullName) — admin/internal use
 *   all   — runs all sources concurrently
 */

const { ok, badRequest } = require('../../../shared/utils/response');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Search games in the game DB.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} q
 * @param {number} limit
 */
async function searchGames(prisma, q, limit) {
  const rows = await prisma.game.findMany({
    where: {
      AND: [
        { status: 'active' },
        {
          OR: [
            { name:     { contains: q } },
            { provider: { contains: q } },
          ],
        },
      ],
    },
    take: limit,
    select: { id: true, name: true, slug: true, thumbnail: true, provider: true, category: true },
  });

  return rows.map((g) => ({
    id:       `game_${g.id}`,
    label:    g.name,
    value:    g,
    category: g.provider || 'Game',
    image:    g.thumbnail || null,
    score:    1,
  }));
}

/**
 * Search users in the game DB.
 * Only exposes username + avatar (no PII).
 */
async function searchUsers(prisma, q, limit) {
  const rows = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q } },
        { fullName: { contains: q } },
      ],
    },
    take: limit,
    select: { id: true, username: true, fullName: true, avatar: true },
  });

  return rows.map((u) => ({
    id:       `user_${u.id}`,
    label:    u.username,
    value:    { id: u.id, username: u.username, avatar: u.avatar },
    category: 'Người chơi',
    image:    u.avatar || null,
    score:    1,
  }));
}

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * GET /api/game/autocomplete
 * Query params: q, source (game|user|all), limit (1-20)
 */
async function autocomplete(req, res, next) {
  try {
    const q      = (req.query.q || '').trim();
    const source = req.query.source || 'game';
    const limit  = Math.min(parseInt(req.query.limit) || 10, 20);

    if (!q || q.length < 1) {
      return ok(res, { query: q, results: [], total: 0 });
    }

    const prisma   = req.prisma;
    const results  = [];

    const runGame = async () => {
      const items = await searchGames(prisma, q, limit);
      if (items.length) results.push({ source: 'game', items, total: items.length });
    };

    const runUser = async () => {
      const items = await searchUsers(prisma, q, limit);
      if (items.length) results.push({ source: 'user', items, total: items.length });
    };

    if (source === 'all') {
      await Promise.all([runGame(), runUser()]);
    } else if (source === 'game') {
      await runGame();
    } else if (source === 'user') {
      await runUser();
    } else {
      return badRequest(res, `Unknown source: ${source}`);
    }

    const total = results.reduce((s, r) => s + r.total, 0);
    return ok(res, { query: q, results, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { autocomplete };
