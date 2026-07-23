'use strict';
/**
 * Autocomplete controller — Hub module
 * GET /api/hub/autocomplete?q=<query>[&source=game|website|tool|news|all][&limit=10]
 */

const { ok, badRequest } = require('../../../shared/utils/response');

async function searchGames(prisma, q, limit) {
  const rows = await prisma.game.findMany({
    where: {
      OR: [{ name: { contains: q } }, { description: { contains: q } }],
    },
    take: limit,
    select: { id: true, name: true, slug: true, thumbnail: true, category: true },
  });
  return rows.map((g) => ({
    id: `game_${g.id}`, label: g.name, value: g,
    category: 'Game', image: g.thumbnail || null, score: 1,
  }));
}

async function searchWebsites(prisma, q, limit) {
  const rows = await prisma.website.findMany({
    where: { OR: [{ name: { contains: q } }, { url: { contains: q } }] },
    take: limit,
    select: { id: true, name: true, slug: true, url: true, logo: true, category: true },
  });
  return rows.map((w) => ({
    id: `website_${w.id}`, label: w.name, value: w,
    category: 'Website', image: w.logo || null, score: 1,
  }));
}

async function searchTools(prisma, q, limit) {
  const rows = await prisma.tool.findMany({
    where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
    take: limit,
    select: { id: true, name: true, slug: true, icon: true, category: true },
  });
  return rows.map((t) => ({
    id: `tool_${t.id}`, label: t.name, value: t,
    category: 'Tool', image: t.icon || null, score: 1,
  }));
}

async function searchNews(prisma, q, limit) {
  const rows = await prisma.news.findMany({
    where: {
      AND: [
        { status: 'published' },
        { OR: [{ title: { contains: q } }, { summary: { contains: q } }] },
      ],
    },
    take: limit,
    select: { id: true, title: true, slug: true, thumbnail: true, category: true },
  });
  return rows.map((n) => ({
    id: `news_${n.id}`, label: n.title, value: n,
    category: 'Tin tức', image: n.thumbnail || null, score: 1,
  }));
}

async function autocomplete(req, res, next) {
  try {
    const q      = (req.query.q || '').trim();
    const source = req.query.source || 'all';
    const limit  = Math.min(parseInt(req.query.limit) || 8, 20);

    if (!q || q.length < 1) {
      return ok(res, { query: q, results: [], total: 0 });
    }

    const prisma  = req.prisma;
    const results = [];

    const runners = {
      game:    () => searchGames(prisma, q, limit).then((items) => { if (items.length) results.push({ source: 'game',    items, total: items.length }); }),
      website: () => searchWebsites(prisma, q, limit).then((items) => { if (items.length) results.push({ source: 'website', items, total: items.length }); }),
      tool:    () => searchTools(prisma, q, limit).then((items) => { if (items.length) results.push({ source: 'tool',    items, total: items.length }); }),
      news:    () => searchNews(prisma, q, limit).then((items) => { if (items.length) results.push({ source: 'news',    items, total: items.length }); }),
    };

    if (source === 'all') {
      await Promise.all(Object.values(runners).map((fn) => fn()));
    } else if (runners[source]) {
      await runners[source]();
    } else {
      return badRequest(res, `Unknown source: ${source}`);
    }

    return ok(res, { query: q, results, total: results.reduce((s, r) => s + r.total, 0) });
  } catch (err) {
    next(err);
  }
}

module.exports = { autocomplete };
