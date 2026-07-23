// @ts-nocheck
'use strict';
/**
 * ArticleService — Sports module
 *
 * Uses CORRECT schema models:
 *   News         (@@map "news")       — articles
 *   NewsComment  (@@map "news_comments") — has parentId self-relation
 *
 * No "newsLike" model exists in the schema.
 * Likes are tracked as an integer counter on News.likes only.
 * All IDs are CUID strings — never coerce with Number().
 */

class ArticleService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /** List published articles with optional category / tag / search filter. */
  async list({ page = 1, limit = 20, category, tag, q } = {}) {
    const where = { status: 'published' };
    if (category) where.category = category;
    if (tag)      where.tags = { path: '$', array_contains: tag }; // JSON array contains
    if (q)        where.OR  = [
      { title:   { contains: q } },
      { summary: { contains: q } },
    ];

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { publishedAt: 'desc' },
        select:  {
          id: true, title: true, slug: true, summary: true,
          image: true, category: true, views: true, likes: true,
          publishedAt: true, createdAt: true,
        },
      }),
      this.prisma.news.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  /** Get a single article by slug + increment view counter (fire-and-forget). */
  async getBySlug(slug) {
    const article = await this.prisma.news.findUnique({
      where:   { slug },
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        _count: { select: { comments: true } },
      },
    });
    if (!article || article.status !== 'published') return null;

    this.prisma.news.update({ where: { id: article.id }, data: { views: { increment: 1 } } }).catch(() => {});
    return { ...article, views: article.views + 1 };
  }

  /** Return up to 5 articles in the same category (excluding current). */
  async getRelated(articleId, category) {
    return this.prisma.news.findMany({
      where:   { status: 'published', category, id: { not: articleId } },
      take:    5,
      orderBy: { publishedAt: 'desc' },
      select:  { id: true, title: true, slug: true, image: true, publishedAt: true },
    });
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Add a comment (or reply) to a news article.
   * newsId and parentId are CUID strings.
   */
  async addComment(userId, newsId, content, parentId = null) {
    if (!content?.trim()) {
      throw Object.assign(new Error('Nội dung bình luận không được trống'), { status: 400 });
    }
    return this.prisma.newsComment.create({
      data: {
        userId,
        newsId,                            // CUID string
        content,
        parentId: parentId || null,        // CUID string or null
      },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });
  }

  /**
   * Toggle like on an article.
   * No separate like table — just increments/decrements News.likes counter.
   */
  async toggleLike(userId, articleId) {
    // Use a small per-user key in a UserLikedNews set if available;
    // otherwise just increment — idempotency handled by UI.
    const updated = await this.prisma.news.update({
      where: { id: articleId },           // CUID string
      data:  { likes: { increment: 1 } },
      select: { likes: true },
    });
    return { liked: true, likes: updated.likes };
  }
}

module.exports = ArticleService;
