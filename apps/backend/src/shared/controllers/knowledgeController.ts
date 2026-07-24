// @ts-nocheck
/**
 * KnowledgeController — REST handlers for the knowledge base.
 *
 * Routes (mounted via support.routes.js):
 *   GET  /knowledge                    — list published articles
 *   GET  /knowledge/:slug              — article detail (increments views)
 *   POST /knowledge/:slug/like         — auth: increment likes
 *   POST /knowledge                    — adminGuard: create article
 *   PUT  /knowledge/:id                — adminGuard: update article
 *   POST /knowledge/:id/translate      — adminGuard: auto-translate article
 */
const translationService = require('../services/translationService');
const { success, created, error, notFound, paginate } = require('../utils/response');

/**
 * GET /knowledge
 * List published articles.
 * Query: { category, q, lang }
 * If `lang` is provided, overlay translated title/content from KnowledgeTranslation.
 */
exports.listArticles = async (req, res) => {
  try {
    const { category, q, lang, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = { status: 'published' };
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
        { summary: { contains: q } },
      ];
    }

    const [articles, total] = await Promise.all([
      req.prisma.knowledgeArticle.findMany({
        where,
        include: lang
          ? { translations: { where: { language: lang }, take: 1 } }
          : undefined,
        orderBy: { publishedAt: 'desc' },
        skip,
        take,
      }),
      req.prisma.knowledgeArticle.count({ where }),
    ]);

    const data = lang
      ? articles.map((a) => {
          const tx = a.translations?.[0];
          return tx
            ? { ...a, title: tx.title, content: tx.content, translations: undefined }
            : a;
        })
      : articles;

    return paginate(res, data, {
      page: Number(page),
      limit: take,
      total,
      pages: Math.ceil(total / take),
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /knowledge/:slug
 * Article detail. Increments view count.
 * Query: { lang } — overlay translation if available.
 */
exports.getArticle = async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang } = req.query;

    const article = await req.prisma.knowledgeArticle.findUnique({
      where: { slug },
      include: lang
        ? { translations: { where: { language: lang }, take: 1 } }
        : { translations: true },
    });

    if (!article) return notFound(res, 'Article not found');

    // Increment views non-blocking
    req.prisma.knowledgeArticle
      .update({ where: { slug }, data: { views: { increment: 1 } } })
      .catch(() => {});

    if (lang) {
      const tx = article.translations?.[0];
      if (tx) {
        return success(res, {
          ...article,
          title: tx.title,
          content: tx.content,
          translations: undefined,
        });
      }
    }

    return success(res, article);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /knowledge/:slug/like
 * Authenticated: increment article likes by 1.
 */
exports.likeArticle = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await req.prisma.knowledgeArticle.update({
      where: { slug },
      data: { likes: { increment: 1 } },
      select: { id: true, slug: true, likes: true },
    });
    return success(res, article, 'Liked');
  } catch (err) {
    // P2025 = record not found (Prisma)
    if (err.code === 'P2025') return notFound(res, 'Article not found');
    return error(res, err.message);
  }
};

/**
 * POST /knowledge
 * Admin: create a new knowledge article.
 * Body: { title, slug, content, summary?, image?, category? }
 */
exports.createArticle = async (req, res) => {
  try {
    const { title, slug, content, summary, image, category = 'general' } = req.body;
    if (!title) return error(res, 'title is required', 422);
    if (!slug) return error(res, 'slug is required', 422);
    if (!content) return error(res, 'content is required', 422);

    const article = await req.prisma.knowledgeArticle.create({
      data: {
        title,
        slug,
        content,
        summary,
        image,
        category,
        authorId: req.user?.id ? parseInt(req.user.id, 10) : null,
        status: 'published',
        publishedAt: new Date(),
      },
    });
    return created(res, article, 'Article created');
  } catch (err) {
    // P2002 = unique constraint (slug already exists)
    if (err.code === 'P2002') return error(res, 'Slug already exists', 409);
    return error(res, err.message);
  }
};

/**
 * PUT /knowledge/:id
 * Admin: update an existing article by ID.
 */
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, content, summary, image, category, status } = req.body;

    const article = await req.prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary }),
        ...(image !== undefined && { image }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
      },
    });
    return success(res, article, 'Article updated');
  } catch (err) {
    if (err.code === 'P2025') return notFound(res, 'Article not found');
    if (err.code === 'P2002') return error(res, 'Slug already exists', 409);
    return error(res, err.message);
  }
};

/**
 * POST /knowledge/:id/translate
 * Admin: auto-translate an article using translationService.
 * Body: { language } — target language code, e.g. 'vi', 'zh', 'en'
 */
exports.addTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { language } = req.body;
    if (!language) return error(res, 'language is required', 422);

    const article = await req.prisma.knowledgeArticle.findUnique({
      where: { id },
      select: { id: true, title: true, content: true },
    });
    if (!article) return notFound(res, 'Article not found');

    const sourceLang = translationService.detectLanguage(article.title);

    const [translatedTitle, translatedContent] = await Promise.all([
      translationService.translate(req.prisma, article.title, language, sourceLang),
      translationService.translate(req.prisma, article.content, language, sourceLang),
    ]);

    // Upsert so re-running for the same language refreshes the translation
    const translation = await req.prisma.knowledgeTranslation.upsert({
      where: { articleId_language: { articleId: id, language } },
      update: { title: translatedTitle, content: translatedContent },
      create: { articleId: id, language, title: translatedTitle, content: translatedContent },
    });

    return created(res, translation, 'Translation added');
  } catch (err) {
    return error(res, err.message);
  }
};
