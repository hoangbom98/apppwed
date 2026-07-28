// @ts-nocheck
const { success, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

exports.list = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, 20);
    const where = { status: 'published' };
    
    if (req.query.category) where.category = req.query.category;
    
    const [articles, total] = await Promise.all([
      req.prisma.news.findMany({
        where,
        skip,
        take,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          image: true,
          category: true,
          views: true,
          likes: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      req.prisma.news.count({ where }),
    ]);
    
    return res.json({ success: true, articles, meta: { total, page, limit } });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.get = async (req, res) => {
  try {
    const article = await req.prisma.news.findUnique({
      where: { slug: req.params.slug },
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        _count: { select: { comments: true } },
      },
    });
    
    if (!article) return error(res, 'Article not found', 404);
    if (article.status !== 'published') return error(res, 'Article not published', 403);
    
    // Increment views
    await req.prisma.news.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });
    
    return success(res, { ...article, views: article.views + 1 });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.getComments = async (req, res) => {
  try {
    const newsId   = req.params.id;              // CUID string
    const comments = await req.prisma.newsComment.findMany({
      where: { newsId, parentId: null, status: 'active' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, fullName: true, avatar: true } },
        replies: {
          where: { status: 'active' },
          include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
        },
      },
    });
    
    return success(res, { comments });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.addComment = async (req, res) => {
  try {
    const { newsId, content, parentId } = req.body;
    if (!content || !newsId) return error(res, 'newsId and content are required', 400);

    const comment = await req.prisma.newsComment.create({
      data: {
        userId:   req.user.id,
        newsId,                              // CUID string
        content,
        parentId: parentId || null,          // CUID string or null
      },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });
    
    return success(res, comment);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
