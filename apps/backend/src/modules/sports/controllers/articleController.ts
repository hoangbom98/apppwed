import type { Request, Response } from 'express';
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, 20);
    const where: Record<string, unknown> = { status: 'published' };
    if (req.query.category) where.category = req.query.category;

    const [articles, total] = await Promise.all([
      (req as any).prisma.news.findMany({
        where, skip, take,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true, title: true, slug: true, summary: true,
          image: true, category: true, views: true, likes: true,
          publishedAt: true, createdAt: true,
        },
      }),
      (req as any).prisma.news.count({ where }),
    ]);

    success(res, { articles, meta: { total, page, limit } });
  } catch (e: unknown) {
    error(res, e instanceof Error ? e.message : 'Error', 500);
  }
};

export const get = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = await (req as any).prisma.news.findUnique({
      where:   { slug: req.params.slug },
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!article)                      { notFound(res, 'Article not found'); return; }
    if (article.status !== 'published') { error(res, 'Article not published', 403); return; }

    await (req as any).prisma.news.update({
      where: { id: article.id },
      data:  { views: { increment: 1 } },
    });

    success(res, { ...article, views: article.views + 1 });
  } catch (e: unknown) {
    error(res, e instanceof Error ? e.message : 'Error', 500);
  }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const newsId   = req.params.id;
    const comments = await (req as any).prisma.newsComment.findMany({
      where:   { newsId, parentId: null, status: 'active' },
      orderBy: { createdAt: 'asc' },
      include: {
        user:    { select: { id: true, username: true, fullName: true, avatar: true } },
        replies: {
          where:   { status: 'active' },
          include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
        },
      },
    });
    success(res, { comments });
  } catch (e: unknown) {
    error(res, e instanceof Error ? e.message : 'Error', 500);
  }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { newsId, content, parentId } = req.body;
    if (!content || !newsId) { error(res, 'newsId and content are required', 400); return; }

    const comment = await (req as any).prisma.newsComment.create({
      data: {
        userId:   (req as any).user.id,
        newsId,
        content,
        parentId: parentId || null,
      },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });

    success(res, comment);
  } catch (e: unknown) {
    error(res, e instanceof Error ? e.message : 'Error', 500);
  }
};
