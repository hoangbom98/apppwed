// @ts-nocheck
/**
 * core/social/community.service.ts
 *
 * Shared community / UGC engine for Sports and Dating.
 * Handles posts, likes, comments, and basic content moderation.
 *
 * Schema required on the project DB:
 *   Post    { id, userId, content, mediaUrls, isPublic, status, viewCount, likeCount, commentCount, ... }
 *   PostLike    { id, postId, userId }
 *   PostComment { id, postId, userId, content, parentId?, ... }
 *
 * Usage:
 *   const { CommunityService } = require('../../core/social/community.service');
 *   const svc = new CommunityService(prisma, 'sports');
 *   const post = await svc.createPost(userId, { content: 'Great match!', mediaUrls: [] });
 */
'use strict';

const logger       = require('../../shared/services/logger');
const { eventBus, EVENTS } = require('../events/event-bus');

class CommunityService {
  /**
   * @param {object} prisma       – project Prisma client
   * @param {string} projectCode  – 'sports' | 'dating' | 'hub' | 'game'
   */
  constructor(prisma, projectCode) {
    this.prisma      = prisma;
    this.projectCode = projectCode;
  }

  // ── Posts ─────────────────────────────────────────────────────────────────

  /**
   * Create a new post.
   * @param {string} userId
   * @param {{ content: string, mediaUrls?: string[], isPublic?: boolean, metadata?: object }} data
   */
  async createPost(userId, data) {
    const post = await this.prisma.post.create({
      data: {
        userId,
        content:    data.content,
        mediaUrls:  data.mediaUrls  || [],
        isPublic:   data.isPublic !== false,
        status:     'published',
        metadata:   data.metadata  || {},
      },
    });

    eventBus.emit(EVENTS.POST_CREATED, {
      postId:  post.id,
      userId,
      project: this.projectCode,
    });

    logger.info(`[Community] post created userId=${userId} postId=${post.id} project=${this.projectCode}`);
    return post;
  }

  /**
   * Get paginated feed (public posts, newest first).
   * @param {{ skip?: number, take?: number, userId?: string }} opts
   */
  async getFeed({ skip = 0, take = 20, userId } = {}) {
    const where = { status: 'published', isPublic: true };
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get a single post by ID.
   * @param {string} postId
   */
  async getPost(postId) {
    const post = await this.prisma.post.findUnique({
      where:   { id: postId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    if (post) {
      // Increment view count (fire-and-forget)
      this.prisma.post.update({
        where: { id: postId },
        data:  { viewCount: { increment: 1 } },
      }).catch(() => {});
    }
    return post;
  }

  /**
   * Delete a post (author or admin).
   * @param {string} postId
   * @param {string} requesterId  – the user requesting the deletion
   * @param {boolean} isAdmin
   */
  async deletePost(postId, requesterId, isAdmin = false) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Bài viết không tồn tại');
    if (!isAdmin && post.userId !== requesterId) throw new Error('Không có quyền xóa bài viết này');

    return this.prisma.post.update({
      where: { id: postId },
      data:  { status: 'deleted' },
    });
  }

  // ── Likes ─────────────────────────────────────────────────────────────────

  /**
   * Toggle like on a post.
   * @param {string} postId
   * @param {string} userId
   * @returns {{ liked: boolean, likeCount: number }}
   */
  async toggleLike(postId, userId) {
    const existing = await this.prisma.postLike.findFirst({
      where: { postId, userId },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.postLike.delete({ where: { id: existing.id } }),
        this.prisma.post.update({
          where: { id: postId },
          data:  { likeCount: { decrement: 1 } },
        }),
      ]);
      const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
      return { liked: false, likeCount: Number(post?.likeCount ?? 0) };
    }

    await this.prisma.$transaction([
      this.prisma.postLike.create({ data: { postId, userId } }),
      this.prisma.post.update({
        where: { id: postId },
        data:  { likeCount: { increment: 1 } },
      }),
    ]);
    const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
    return { liked: true, likeCount: Number(post?.likeCount ?? 0) };
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  /**
   * Add a comment to a post.
   * @param {string} postId
   * @param {string} userId
   * @param {string} content
   * @param {string} [parentId]  – for nested replies
   */
  async addComment(postId, userId, content, parentId = null) {
    if (!content?.trim()) throw new Error('Nội dung bình luận không được để trống');

    const [comment] = await this.prisma.$transaction([
      this.prisma.postComment.create({
        data: { postId, userId, content: content.trim(), parentId },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data:  { commentCount: { increment: 1 } },
      }),
    ]);

    eventBus.emit(EVENTS.COMMENT_ADDED, {
      postId,
      commentId: comment.id,
      userId,
      project:   this.projectCode,
    });

    return comment;
  }

  /**
   * Get paginated comments for a post.
   * @param {string} postId
   * @param {{ skip?: number, take?: number }} opts
   */
  async getComments(postId, { skip = 0, take = 20 } = {}) {
    const [data, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where:   { postId, parentId: null },
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
        },
      }),
      this.prisma.postComment.count({ where: { postId, parentId: null } }),
    ]);
    return { data, total };
  }
}

module.exports = { CommunityService };
