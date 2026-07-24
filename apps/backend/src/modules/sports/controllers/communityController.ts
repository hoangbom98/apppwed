'use strict';
const { success, created, error } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.getFeed = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, 20);
    const where = { status: 'active', isPublic: true };

    const [posts, total] = await Promise.all([
      req.prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
      }),
      req.prisma.post.count({ where }),
    ]);

    return res.json({ success: true, posts, meta: { total, page, limit } });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content, images, video, poll, type, hashtags, location, isPublic = true } = req.body;

    const post = await req.prisma.post.create({
      data: {
        userId:   req.user.id,
        content,
        images:   images || [],
        video,
        poll,
        type:     type || 'text',
        hashtags: hashtags || [],
        location,
        isPublic,
      },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });

    return created(res, post);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.getPost = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    const post = await req.prisma.post.findUnique({
      where:   { id },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });

    if (!post) return error(res, 'Post not found', 404);
    return success(res, post);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.likePost = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    await req.prisma.post.update({
      where: { id },
      data:  { likes: { increment: 1 } },
    });
    return success(res, null, 'Liked');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.getComments = async (req, res) => {
  try {
    const postId = req.params.id; // CUID string — no coercion
    const comments = await req.prisma.postComment.findMany({
      where:   { postId, parentId: null, status: 'active' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, fullName: true, avatar: true } },
        replies: {
          where:   { status: 'active' },
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
    const { postId, content, parentId } = req.body;
    if (!content) return error(res, 'Content is required');

    const comment = await req.prisma.postComment.create({
      data: {
        userId:   req.user.id,
        postId,                            // CUID string — no coercion
        content,
        parentId: parentId || null,        // CUID string — no coercion
      },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });

    await req.prisma.post.update({
      where: { id: postId },               // CUID string — no coercion
      data:  { comments: { increment: 1 } },
    });

    return success(res, comment);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.deletePost = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    const post = await req.prisma.post.findUnique({ where: { id } });
    if (!post) return error(res, 'Post not found', 404);
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'Unauthorized', 403);
    }

    await req.prisma.post.update({
      where: { id: post.id },
      data:  { status: 'deleted' },
    });

    return success(res, null, 'Post deleted');
  } catch (e) {
    return error(res, e.message, 500);
  }
};
