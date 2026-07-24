// @ts-nocheck
/**
 * cmsService.ts — Engine 10: Unified CMS Engine
 *
 * Centralised content management for articles, banners, pages, and media
 * across all 5 sub-projects. All content is stored in hub_db and served
 * cross-project via projectCode filtering.
 *
 * Features:
 *  - Articles with categories, tags, SEO metadata
 *  - Banners with position, schedule (start/end date), click tracking
 *  - Static pages (Terms, FAQ, About)
 *  - Media library (images, videos)
 *  - Redis cache for high-traffic reads
 *
 * USAGE (in hub module)
 * ─────
 *   const cms = new CmsService(hubPrisma);
 *
 *   // Public: get articles for homepage
 *   const articles = await cms.getArticles({ projectCode: 'game', limit: 10, status: 'published' });
 *
 *   // Get active banners for a position
 *   const banners = await cms.getBanners('game', 'home_top');
 *
 *   // Admin: create article
 *   await cms.createArticle({ title, content, projectCode, category, ... });
 *
 * Required hub_db models: Article, Banner, Category, Page, MediaFile
 */

'use strict';

const logger = require('./logger');
const cache  = require('./cacheService');

const TTL_ARTICLES = 300;   // 5 min
const TTL_BANNERS  = 300;
const TTL_PAGES    = 3600;  // 1 hour (rarely changes)

class CmsService {
  private prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  // ── ARTICLES ──────────────────────────────────────────────────────────────

  /**
   * Get published articles with pagination.
   */
  async getArticles(opts: {
    projectCode?: string;
    category?:    string;
    tag?:         string;
    status?:      string;
    page?:        number;
    limit?:       number;
    search?:      string;
  } = {}) {
    const { projectCode, category, tag, status = 'published', page = 1, limit = 10, search } = opts;
    const cacheKey = `cms:articles:${projectCode}:${category}:${page}:${limit}:${search || ''}`;

    return cache.remember(cacheKey, TTL_ARTICLES, async () => {
      const where: any = { status };
      if (projectCode) where.projectCode = projectCode;
      if (category)    where.category    = category;
      if (tag)         where.tags        = { has: tag };
      if (search)      where.title       = { contains: search };

      const [items, total] = await Promise.all([
        this.prisma.article?.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          take:    limit,
          skip:    (page - 1) * limit,
          select: {
            id: true, title: true, slug: true, excerpt: true,
            thumbnail: true, category: true, tags: true,
            publishedAt: true, viewCount: true, author: true,
          },
        }) ?? [],
        this.prisma.article?.count({ where }) ?? 0,
      ]);

      return { items, total, page, totalPages: Math.ceil(total / limit) };
    });
  }

  /**
   * Get single article by slug (increments view count).
   */
  async getArticleBySlug(slug: string, projectCode?: string) {
    const cacheKey = `cms:article:${slug}`;
    const article  = await cache.remember(cacheKey, TTL_ARTICLES, async () => {
      const where: any = { slug, status: 'published' };
      if (projectCode) where.projectCode = projectCode;
      return this.prisma.article?.findFirst({ where }) ?? null;
    });

    // Increment view count (non-blocking, no cache invalidation needed)
    if (article?.id) {
      this.prisma.article?.update({
        where: { id: article.id },
        data:  { viewCount: { increment: 1 } },
      }).catch(() => {});
    }

    return article;
  }

  /**
   * Admin: create or update an article.
   */
  async upsertArticle(data: {
    id?:          string;
    title:        string;
    slug:         string;
    content:      string;
    excerpt?:     string;
    thumbnail?:   string;
    category?:    string;
    tags?:        string[];
    projectCode:  string;
    status?:      string;
    publishedAt?: Date;
    seoTitle?:    string;
    seoDesc?:     string;
    author?:      string;
  }) {
    const result = data.id
      ? await this.prisma.article?.update({ where: { id: data.id }, data })
      : await this.prisma.article?.create({ data: { status: 'draft', ...data, publishedAt: data.publishedAt ?? new Date() } });

    // Bust cache
    await cache.del(`cms:article:${data.slug}`);
    await cache.del(`cms:articles:${data.projectCode}:*`);
    return result;
  }

  // ── BANNERS ───────────────────────────────────────────────────────────────

  /**
   * Get active banners for a project + position.
   * Filters by schedule (startDate ≤ now ≤ endDate).
   */
  async getBanners(projectCode: string, position?: string) {
    const cacheKey = `cms:banners:${projectCode}:${position || 'all'}`;
    return cache.remember(cacheKey, TTL_BANNERS, async () => {
      const now  = new Date();
      const where: any = {
        status: 'active',
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      };
      if (projectCode !== 'all') {
        where.OR = [
          { projectCode },
          { projectCode: 'all' },
        ];
      }
      if (position) where.position = position;

      return this.prisma.banner?.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, imageUrl: true, linkUrl: true, position: true, sortOrder: true },
      }) ?? [];
    });
  }

  /**
   * Admin: upsert a banner. Busts cache on save.
   */
  async upsertBanner(data: {
    id?:          string;
    title:        string;
    imageUrl:     string;
    linkUrl?:     string;
    position:     string;
    projectCode:  string;
    startDate?:   Date;
    endDate?:     Date;
    sortOrder?:   number;
    status?:      string;
  }) {
    const result = data.id
      ? await this.prisma.banner?.update({ where: { id: data.id }, data })
      : await this.prisma.banner?.create({ data: { status: 'active', sortOrder: 0, ...data } });

    await cache.del(`cms:banners:${data.projectCode}:*`);
    return result;
  }

  // ── PAGES ─────────────────────────────────────────────────────────────────

  /**
   * Get a static page by slug.
   */
  async getPage(slug: string, projectCode?: string) {
    const cacheKey = `cms:page:${slug}:${projectCode}`;
    return cache.remember(cacheKey, TTL_PAGES, async () => {
      const where: any = { slug, status: 'published' };
      if (projectCode) where.projectCode = projectCode;
      return this.prisma.page?.findFirst({ where }) ?? null;
    });
  }

  /**
   * Admin: upsert a static page.
   */
  async upsertPage(data: {
    id?:         string;
    title:       string;
    slug:        string;
    content:     string;
    projectCode: string;
    status?:     string;
    seoTitle?:   string;
    seoDesc?:    string;
  }) {
    const result = data.id
      ? await this.prisma.page?.update({ where: { id: data.id }, data })
      : await this.prisma.page?.create({ data: { status: 'draft', ...data } });

    await cache.del(`cms:page:${data.slug}:*`);
    return result;
  }

  // ── CATEGORIES ────────────────────────────────────────────────────────────

  /**
   * Get all active categories for a project.
   */
  async getCategories(projectCode: string) {
    return cache.remember(`cms:categories:${projectCode}`, 3600, async () => {
      return this.prisma.category?.findMany({
        where:   { projectCode, status: 'active' },
        orderBy: { sortOrder: 'asc' },
      }) ?? [];
    });
  }
}

module.exports = CmsService;
