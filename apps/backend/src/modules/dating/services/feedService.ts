'use strict';
/**
 * dating/services/feedService.js
 *
 * Business logic for social feed (posts, post likes, post comments).
 * DB models: Post, PostLike, PostComment
 */
const BaseService = require('../../../shared/services/BaseService');

class FeedService extends BaseService {
  constructor(prisma) {
    super(prisma, 'post');
  }

  async getFeed(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where:   { status: 'active' },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, avatar: true } } },
      }),
      this.prisma.post.count({ where: { status: 'active' } }),
    ]);
    return { posts, meta: { total, page, limit } };
  }

  async createPost(userId, data) {
    return this.prisma.post.create({
      data:    { userId, ...data },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
  }

  /**
   * Like a post — creates PostLike record (idempotent) and increments counter.
   */
  async likePost(userId, postId) {
    return this.prisma.$transaction(async (tx) => {
      // upsert-style: create if not exists (unique constraint on [postId, userId])
      const existing = await tx.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });
      if (existing) return { liked: true, alreadyLiked: true };

      await tx.postLike.create({ data: { postId, userId } });
      const updated = await tx.post.update({
        where: { id: postId },
        data:  { likes: { increment: 1 } },
      });
      return { liked: true, likes: updated.likes };
    });
  }

  /**
   * Unlike a post — removes PostLike record and decrements counter.
   */
  async unlikePost(userId, postId) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });
      if (!existing) return { liked: false, alreadyUnliked: true };

      await tx.postLike.delete({ where: { postId_userId: { postId, userId } } });
      const updated = await tx.post.update({
        where: { id: postId },
        data:  { likes: { decrement: 1 } },
      });
      return { liked: false, likes: Math.max(0, updated.likes) };
    });
  }
}

module.exports = FeedService;
