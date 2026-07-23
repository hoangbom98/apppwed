'use strict';
/**
 * hub/controllers/newsCommentController.js
 * Manages comments on news articles.
 * DB model: Comment (id = CUID string)
 * Fields: id, userId, newsId, content, likes, status
 * Note: Comment model has NO parentId/replies — flat comment structure only.
 */
const { success, created, error, notFound, forbidden } = require('../../../shared/utils/response');

exports.list = async (req, res) => {
  try {
    const newsId   = req.params.newsId;          // CUID string — no + coercion
    const comments = await req.prisma.comment.findMany({
      where:   { newsId, status: 'active' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    });
    return success(res, comments);
  } catch (e) { return error(res, e.message, 500); }
};

exports.create = async (req, res) => {
  try {
    const newsId  = req.params.newsId;            // CUID string
    const { content } = req.body;
    if (!content) return error(res, 'Nội dung là bắt buộc', 400);

    // Verify news exists
    const news = await req.prisma.news.findUnique({ where: { id: newsId } });
    if (!news) return notFound(res, 'News not found');

    const comment = await req.prisma.comment.create({
      data: { userId: req.user.id, newsId, content },
    });
    return created(res, comment);
  } catch (e) { return error(res, e.message, 500); }
};

exports.like = async (req, res) => {
  try {
    const id      = req.params.id;               // CUID string
    const comment = await req.prisma.comment.findUnique({ where: { id } });
    if (!comment) return notFound(res);
    await req.prisma.comment.update({ where: { id }, data: { likes: { increment: 1 } } });
    return success(res, null, 'Đã thích');
  } catch (e) { return error(res, e.message, 500); }
};

exports.delete = async (req, res) => {
  try {
    const id      = req.params.id;               // CUID string
    const comment = await req.prisma.comment.findUnique({ where: { id } });
    if (!comment) return notFound(res);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (comment.userId !== req.user.id && !isAdmin) return forbidden(res);
    await req.prisma.comment.update({ where: { id }, data: { status: 'deleted' } });
    return success(res, null, 'Đã xóa');
  } catch (e) { return error(res, e.message, 500); }
};
