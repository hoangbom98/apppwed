'use strict';
/**
 * hub/controllers/cmsController.js
 * Full CMS controller for all public + user endpoints.
 * Models match prisma/hub/schema.prisma exactly.
 */
const { success, created, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');
const HubService = require('../services/hubService');
const Joi = require('joi');

const svc = (req) => new HubService(req.prisma);

// ── Categories ────────────────────────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const data = await svc(req).getCategories(req.query.type);
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Games ─────────────────────────────────────────────────────────────────────
exports.getGames = async (req, res) => {
  try {
    const result = await svc(req).getGames(req.query);
    return success(res, result);
  } catch (e) { return error(res, e.message, 500); }
};

exports.getGameBySlug = async (req, res) => {
  try {
    const game = await req.prisma.game.findUnique({
      where:   { slug: req.params.slug },
      include: { category: true },
    });
    if (!game || game.status !== 'active') return notFound(res);
    // Increment view count (fire and forget)
    req.prisma.game.update({ where: { id: game.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return success(res, game);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Websites ──────────────────────────────────────────────────────────────────
exports.getWebsites = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { status: 'active' };
    if (req.query.category) where.categoryId = req.query.category;
    const [data, total] = await Promise.all([
      req.prisma.website.findMany({ where, skip, take, orderBy: { sortOrder: 'asc' }, include: { category: true } }),
      req.prisma.website.count({ where }),
    ]);
    return success(res, { data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Tools ─────────────────────────────────────────────────────────────────────
exports.getTools = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { status: 'active' };
    if (req.query.category) where.categoryId = req.query.category;
    const [data, total] = await Promise.all([
      req.prisma.tool.findMany({ where, skip, take, orderBy: { sortOrder: 'asc' }, include: { category: true } }),
      req.prisma.tool.count({ where }),
    ]);
    return success(res, { data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getToolBySlug = async (req, res) => {
  try {
    const tool = await req.prisma.tool.findUnique({ where: { slug: req.params.slug }, include: { category: true } });
    if (!tool || tool.status !== 'active') return notFound(res);
    return success(res, tool);
  } catch (e) { return error(res, e.message, 500); }
};

// ── News ──────────────────────────────────────────────────────────────────────
exports.getNews = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { status: 'published' };
    if (req.query.category) where.categoryId = req.query.category;
    if (req.query.search)   where.title = { contains: req.query.search };
    const [data, total] = await Promise.all([
      req.prisma.news.findMany({
        where, skip, take,
        orderBy:  { publishedAt: 'desc' },
        include:  { category: { select: { id: true, name: true, slug: true } } },
        select: {
          id: true, title: true, slug: true, summary: true,
          image: true, author: true, views: true,
          isHot: true, isFeatured: true, publishedAt: true,
          category: true,
        },
      }),
      req.prisma.news.count({ where }),
    ]);
    return success(res, { data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getNewsBySlug = async (req, res) => {
  try {
    const news = await req.prisma.news.findUnique({
      where:   { slug: req.params.slug },
      include: { category: true, comments: { where: { status: 'active' }, orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { id: true, fullName: true, avatar: true } } } } },
    });
    if (!news || news.status !== 'published') return notFound(res);
    req.prisma.news.update({ where: { id: news.id }, data: { views: { increment: 1 } } }).catch(() => {});
    return success(res, news);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Pages (CMS) ───────────────────────────────────────────────────────────────
exports.getPage = async (req, res) => {
  try {
    const page = await req.prisma.page.findUnique({ where: { slug: req.params.slug } });
    if (!page || page.status !== 'published') return notFound(res);
    return success(res, page);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Banners ───────────────────────────────────────────────────────────────────
exports.getBanners = async (req, res) => {
  try {
    const now   = new Date();
    const where = {
      status: 'active',
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };
    if (req.query.position) where.position = req.query.position;
    const data = await req.prisma.banner.findMany({ where, orderBy: { sortOrder: 'asc' } });
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Menus ─────────────────────────────────────────────────────────────────────
exports.getMenu = async (req, res) => {
  try {
    const items = await req.prisma.menu.findMany({
      where:   { position: req.params.location, status: 'active', parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where:   { status: 'active' },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return success(res, items);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Search ────────────────────────────────────────────────────────────────────
exports.search = async (req, res) => {
  const schema = Joi.object({
    q: Joi.string().trim().min(2).required(),
    type: Joi.string().valid('games', 'news', 'tools', 'websites').optional()
  });
  const { error: valError } = schema.validate(req.query);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const { q, type } = req.query;
    const query = { contains: q.trim() };

    const results = {};
    if (!type || type === 'games') {
      results.games = await req.prisma.game.findMany({
        where: { status: 'active', OR: [{ name: query }, { description: query }] },
        take: 10, select: { id: true, name: true, slug: true, image: true },
      });
    }
    if (!type || type === 'news') {
      results.news = await req.prisma.news.findMany({
        where: { status: 'published', OR: [{ title: query }, { summary: query }] },
        take: 10, select: { id: true, title: true, slug: true, image: true, publishedAt: true },
      });
    }
    if (!type || type === 'tools') {
      results.tools = await req.prisma.tool.findMany({
        where: { status: 'active', OR: [{ name: query }, { description: query }] },
        take: 10, select: { id: true, name: true, slug: true, logo: true },
      });
    }
    if (!type || type === 'websites') {
      results.websites = await req.prisma.website.findMany({
        where: { status: 'active', OR: [{ name: query }, { description: query }] },
        take: 10, select: { id: true, name: true, slug: true, logo: true, link: true },
      });
    }
    return success(res, results);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Feedback ──────────────────────────────────────────────────────────────────
exports.submitFeedback = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    subject: Joi.string().required(),
    message: Joi.string().required()
  });
  const { error: valError } = schema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const { name, email, subject, message } = req.body;
    const fb = await req.prisma.feedback.create({
      data: {
        userId:  req.user?.id ?? null,
        name:    name ?? null,
        email:   email ?? null,
        subject,
        message,
        status:  'open',
      },
    });
    return created(res, { id: fb.id }, 'Phản hồi đã được gửi');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Notifications (authenticated) ────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    const [data, total, unread] = await Promise.all([
      req.prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.notification.count({ where }),
      req.prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);
    return success(res, { data, meta: { total, unread, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.markNotifRead = async (req, res) => {
  try {
    await req.prisma.notification.updateMany({
      where: { id: req.params.id === 'all' ? undefined : req.params.id, userId: req.user.id },
      data:  { isRead: true },
    });
    return success(res, null, 'Đã đánh dấu đã đọc');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Favorites (authenticated) ─────────────────────────────────────────────────
exports.getFavorites = async (req, res) => {
  try {
    const data = await req.prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

exports.addFavorite = async (req, res) => {
  const schema = Joi.object({
    targetType: Joi.string().required(),
    targetId: Joi.string().required()
  });
  const { error: valError } = schema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const { targetType, targetId } = req.body;
    const fav = await req.prisma.favorite.upsert({
      where:  { userId_targetType_targetId: { userId: req.user.id, targetType, targetId: String(targetId) } },
      create: { userId: req.user.id, targetType, targetId: String(targetId) },
      update: {},
    });
    return created(res, fav, 'Đã thêm vào yêu thích');
  } catch (e) { return error(res, e.message, 500); }
};

exports.removeFavorite = async (req, res) => {
  try {
    await req.prisma.favorite.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    return success(res, null, 'Đã xóa khỏi yêu thích');
  } catch (e) { return error(res, e.message, 500); }
};
