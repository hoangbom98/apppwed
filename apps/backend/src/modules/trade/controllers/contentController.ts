// @ts-nocheck
'use strict';
/**
 * contentController — Banner + NewsArticle management
 *
 * Public: GET /trade/banners, GET /trade/news, GET /trade/news/:slug
 * Admin:  CRUD /trade/admin/banners, CRUD /trade/admin/news
 */
const { success, error, notFound } = require('../../../shared/utils/response');
const { paginate }                  = require('../../../shared/utils/helpers');

// ─────────────────────────────────────────────────────────────────────────────
// BANNERS
// ─────────────────────────────────────────────────────────────────────────────

exports.listBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await req.prisma.banner.findMany({
      where: {
        status:   'active',
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        ...(req.query.position && { position: req.query.position }),
      },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, banners);
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminListBanners = async (req, res) => {
  try {
    const banners = await req.prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return success(res, banners);
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminCreateBanner = async (req, res) => {
  try {
    const { imageUrl, title, linkUrl, position = 'top', sortOrder = 0, startsAt, endsAt } = req.body;
    if (!imageUrl) return error(res, 'imageUrl là bắt buộc', 400);
    const banner = await req.prisma.banner.create({
      data: { imageUrl, title, linkUrl, position, sortOrder, status: 'active',
              startsAt: startsAt ? new Date(startsAt) : null,
              endsAt:   endsAt   ? new Date(endsAt)   : null },
    });
    return success(res, banner, 'Đã tạo banner');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminUpdateBanner = async (req, res) => {
  try {
    const banner = await req.prisma.banner.update({ where: { id: req.params.id }, data: req.body });
    return success(res, banner, 'Đã cập nhật banner');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminDeleteBanner = async (req, res) => {
  try {
    await req.prisma.banner.delete({ where: { id: req.params.id } });
    return success(res, null, 'Đã xóa banner');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEWS
// ─────────────────────────────────────────────────────────────────────────────

exports.listNews = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = { status: 'published' };
    if (req.query.category) where.category = req.query.category;
    const [data, total] = await Promise.all([
      req.prisma.newsArticle.findMany({
        where, skip, take, orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, slug: true, summary: true, thumbnail: true,
                  category: true, views: true, readReward: true, publishedAt: true },
      }),
      req.prisma.newsArticle.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.getNews = async (req, res) => {
  try {
    const article = await req.prisma.newsArticle.findUnique({ where: { slug: req.params.slug } });
    if (!article || article.status !== 'published') return notFound(res, 'Bài viết không tồn tại');
    // Increment view count
    await req.prisma.newsArticle.update({ where: { id: article.id }, data: { views: { increment: 1 } } });
    return success(res, article);
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminListNews = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = {};
    if (req.query.status)   where.status   = req.query.status;
    if (req.query.category) where.category = req.query.category;
    const [data, total] = await Promise.all([
      req.prisma.newsArticle.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.newsArticle.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminCreateNews = async (req, res) => {
  try {
    const { title, content, summary, thumbnail, category = 'news', readReward = 0, status = 'published' } = req.body;
    if (!title || !content) return error(res, 'title và content là bắt buộc', 400);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const article = await req.prisma.newsArticle.create({
      data: { title, slug, content, summary, thumbnail, category, readReward: parseFloat(readReward),
              status, publishedAt: status === 'published' ? new Date() : null, authorId: req.user.id },
    });
    return success(res, article, 'Đã tạo bài viết');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminUpdateNews = async (req, res) => {
  try {
    const data: any = { ...req.body };
    if (data.status === 'published') data.publishedAt = new Date();
    const article = await req.prisma.newsArticle.update({ where: { id: req.params.id }, data });
    return success(res, article, 'Đã cập nhật bài viết');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminDeleteNews = async (req, res) => {
  try {
    await req.prisma.newsArticle.update({ where: { id: req.params.id }, data: { status: 'hidden' } });
    return success(res, null, 'Đã ẩn bài viết');
  } catch (e: any) { return error(res, e.message, 500); }
};
