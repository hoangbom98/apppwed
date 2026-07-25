// @ts-nocheck
/**
 * core/social/feed.service.ts
 *
 * Activity feed engine — personalised feeds for Hub and Dating.
 * Aggregates content from multiple sources into a unified timeline.
 *
 * Schema required (project DB):
 *   FeedItem { id, userId, targetId, targetType, action, metadata(Json), createdAt }
 *   Feed entries are inserted by domain services (match, bet, deposit, post).
 *
 * Usage:
 *   const { FeedService } = require('../../core/social/feed.service');
 *   const svc = new FeedService(prisma, 'dating');
 *   const feed = await svc.getFeed(userId, { skip: 0, take: 20 });
 *   await svc.addFeedItem(userId, 'POST', postId, 'created', { preview: '...' });
 */
'use strict';

const logger = require('../../shared/services/logger');

/** Supported feed item target types */
const FEED_TYPES = Object.freeze({
  POST:     'POST',
  MATCH:    'MATCH',
  BET:      'BET',
  DEPOSIT:  'DEPOSIT',
  LEVEL_UP: 'LEVEL_UP',
  SPIN:     'SPIN',
  MISSION:  'MISSION',
  GIFT:     'GIFT',
});

class FeedService {
  /**
   * @param {object} prisma       – project Prisma client
   * @param {string} projectCode
   */
  constructor(prisma, projectCode) {
    this.prisma      = prisma;
    this.projectCode = projectCode;
  }

  /**
   * Get a user's personalised activity feed.
   * @param {string} userId
   * @param {{ skip?: number, take?: number }} opts
   */
  async getFeed(userId, { skip = 0, take = 20 } = {}) {
    const [data, total] = await Promise.all([
      this.prisma.feedItem.findMany({
        where:   { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feedItem.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  /**
   * Get a global/public feed (all users' public activity).
   * @param {{ skip?: number, take?: number, targetType?: string }} opts
   */
  async getPublicFeed({ skip = 0, take = 20, targetType } = {}) {
    const where = { isPublic: true };
    if (targetType) where.targetType = targetType;

    const [data, total] = await Promise.all([
      this.prisma.feedItem.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
        },
      }),
      this.prisma.feedItem.count({ where }),
    ]);
    return { data, total };
  }

  /**
   * Insert a new feed item.
   * @param {string} userId
   * @param {string} targetType  – see FEED_TYPES
   * @param {string} targetId    – ID of the related entity
   * @param {string} action      – 'created' | 'won' | 'completed' | 'matched' | ...
   * @param {object} [metadata]  – extra context for rendering
   * @param {boolean} [isPublic] – whether item is visible in global feed
   */
  async addFeedItem(userId, targetType, targetId, action, metadata = {}, isPublic = false) {
    try {
      return await this.prisma.feedItem.create({
        data: {
          userId,
          targetType,
          targetId,
          action,
          metadata,
          isPublic,
        },
      });
    } catch (e) {
      // Non-blocking — feed write failures must not break the main action
      logger.warn(`[FeedService] addFeedItem error: ${e.message}`, { userId, targetType, targetId });
      return null;
    }
  }

  /**
   * Delete feed items for a specific target (e.g. when a post is deleted).
   * @param {string} targetId
   * @param {string} [userId]   – optional: only delete if userId matches
   */
  async deleteFeedItemsByTarget(targetId, userId = null) {
    const where = { targetId };
    if (userId) where.userId = userId;
    return this.prisma.feedItem.deleteMany({ where });
  }
}

module.exports = { FeedService, FEED_TYPES };
