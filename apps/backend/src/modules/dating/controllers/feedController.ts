'use strict';
/**
 * dating/controllers/feedController.js
 *
 * Social feed (posts + stories) REST endpoints.
 * DB models: Post, PostLike, PostComment, Story
 */
const { ok, created, error, notFound } = require('../../../shared/utils/network/response');
const FeedService = require('../services/feedService');
const StoryService = require('../services/storyService');

function svc(req) { return new FeedService(req.prisma); }
function storySvc(req) { return new StoryService(req.prisma); }

// ── GET /dating/feed ─────────────────────────────────────────────────────────
exports.getFeed = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const feed  = await svc(req).getFeed(req.user.id, page, limit);
    return ok(res, feed);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/feed/post ───────────────────────────────────────────────────
exports.createPost = async (req, res) => {
  try {
    const { content, images, visibility = 'public' } = req.body;
    if (!content) return error(res, 'content is required', 400);
    const post = await svc(req).createPost(req.user.id, { content, images, visibility });
    return created(res, post, 'Post created');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/feed/:id/like ───────────────────────────────────────────────
exports.likePost = async (req, res) => {
  try {
    const result = await svc(req).likePost(req.user.id, req.params.id);
    return ok(res, result, 'Post liked');
  } catch (e) { return error(res, e.message, 500); }
};

// ── DELETE /dating/feed/:id/like ─────────────────────────────────────────────
exports.unlikePost = async (req, res) => {
  try {
    const result = await svc(req).unlikePost(req.user.id, req.params.id);
    return ok(res, result, 'Post unliked');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/feed/:id/comments ────────────────────────────────────────────
exports.getComments = async (req, res) => {
  try {
    const page    = parseInt(req.query.page)  || 1;
    const limit   = parseInt(req.query.limit) || 20;
    const skip    = (page - 1) * limit;
    const postId  = req.params.id;

    const post = await req.prisma.post.findUnique({ where: { id: postId } });
    if (!post) return notFound(res, 'Post not found');

    const [comments, total] = await Promise.all([
      req.prisma.postComment.findMany({
        where:   { postId, status: 'active' },
        skip,
        take:    limit,
        orderBy: { createdAt: 'asc' },
      }),
      req.prisma.postComment.count({ where: { postId, status: 'active' } }),
    ]);
    return ok(res, { comments, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/feed/:id/comments ───────────────────────────────────────────
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return error(res, 'content is required', 400);
    const postId = req.params.id;

    const post = await req.prisma.post.findUnique({ where: { id: postId } });
    if (!post) return notFound(res, 'Post not found');

    const comment = await req.prisma.$transaction(async (tx) => {
      const c = await tx.postComment.create({
        data: { postId, userId: req.user.id, content },
      });
      await tx.post.update({
        where: { id: postId },
        data:  { comments: { increment: 1 } },
      });
      return c;
    });
    return created(res, comment, 'Comment added');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/stories ──────────────────────────────────────────────────────
exports.getStories = async (req, res) => {
  try {
    const stories = await storySvc(req).getStories();
    return ok(res, stories);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/stories/create ──────────────────────────────────────────────
exports.createStory = async (req, res) => {
  try {
    const { mediaUrl, mediaType = 'image', duration = 5 } = req.body;
    if (!mediaUrl) return error(res, 'mediaUrl is required', 400);
    const story = await storySvc(req).createStory(req.user.id, { mediaUrl, mediaType, duration });
    return created(res, story, 'Story created');
  } catch (e) { return error(res, e.message, 500); }
};
