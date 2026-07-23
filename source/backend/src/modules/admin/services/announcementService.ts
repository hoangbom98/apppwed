// @ts-nocheck
'use strict';
/**
 * Announcement Service
 *
 * Business logic for system-wide announcements stored in admin_db.
 * Handles scheduling validation and cross-project notification dispatch.
 */
const notifSvc = require('../../shared/services/notificationService');
const logger   = require('../../shared/services/logger');

class AnnouncementService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma – admin DB
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Get all announcements currently in the active window.
   */
  async getActive() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        status:  'active',
        startAt: { lte: now },
        endAt:   { gte: now },
      },
      orderBy: { startAt: 'desc' },
    });
  }

  /**
   * Create a new announcement and immediately notify users if it's live.
   */
  async create(data) {
    const { title, content, type = 'info', projects = null, startAt, endAt } = data;
    const start = new Date(startAt);
    const end   = new Date(endAt);

    if (end <= start) {
      throw Object.assign(new Error('endAt phải sau startAt'), { status: 400 });
    }

    const item = await this.prisma.announcement.create({
      data: { title, content, type, projects, startAt: start, endAt: end, status: 'active' },
    });

    // Push real-time notification if announcement is currently active
    const now = new Date();
    if (start <= now && end >= now) {
      notifSvc.broadcast('announcement', { title, content, type }).catch((e) =>
        logger.warn('[AnnouncementService] broadcast error:', e.message)
      );
    }

    return item;
  }

  /**
   * Deactivate all expired announcements (called by cron).
   */
  async expireOutdated() {
    const result = await this.prisma.announcement.updateMany({
      where:  { status: 'active', endAt: { lt: new Date() } },
      data:   { status: 'expired' },
    });
    if (result.count > 0) {
      logger.info(`[AnnouncementService] Expired ${result.count} announcements`);
    }
    return result.count;
  }
}

module.exports = AnnouncementService;
