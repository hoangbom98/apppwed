// @ts-nocheck
'use strict';
/**
 * Autocomplete controller — Dating module
 * GET /api/dating/autocomplete?q=<query>[&source=user|all][&limit=10]
 *
 * Dating User fields: id, email, username, fullName, avatar, bio, gender,
 *   birthDate, location, coins, isVerified, isVip, role, status, lastSeen
 *
 * Non-existent fields: isActive, displayName, nickname, age, city
 */

const { ok, badRequest } = require('../../../shared/utils/response');

async function searchUsers(prisma, q, limit) {
  const rows = await prisma.user.findMany({
    where: {
      AND: [
        { status: 'active' },
        {
          OR: [
            { fullName: { contains: q } },
            { username: { contains: q } },
          ],
        },
      ],
    },
    take: limit,
    select: { id: true, fullName: true, username: true, avatar: true, birthDate: true, location: true, gender: true },
  });

  return rows.map((u) => {
    const age = u.birthDate
      ? Math.floor((Date.now() - new Date(u.birthDate)) / (1000 * 60 * 60 * 24 * 365.25))
      : null;
    return {
      id:       `user_${u.id}`,
      label:    u.fullName || u.username || 'Người dùng',
      value:    { id: u.id, fullName: u.fullName, avatar: u.avatar, age, location: u.location },
      category: u.location || 'Thành viên',
      image:    u.avatar || null,
      score:    1,
    };
  });
}

async function autocomplete(req, res, next) {
  try {
    const q      = (req.query.q || '').trim();
    const source = req.query.source || 'user';
    const limit  = Math.min(parseInt(req.query.limit) || 10, 20);

    if (!q || q.length < 1) {
      return ok(res, { query: q, results: [], total: 0 });
    }

    const results = [];

    if (source === 'user' || source === 'all') {
      const items = await searchUsers(req.prisma, q, limit);
      if (items.length) results.push({ source: 'user', items, total: items.length });
    } else {
      return badRequest(res, `Unknown source: ${source}`);
    }

    return ok(res, { query: q, results, total: results.reduce((s, r) => s + r.total, 0) });
  } catch (err) {
    next(err);
  }
}

module.exports = { autocomplete };
