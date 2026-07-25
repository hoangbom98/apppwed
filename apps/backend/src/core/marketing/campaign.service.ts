// @ts-nocheck
/**
 * core/marketing/campaign.service.ts
 *
 * Marketing automation engine.
 * Campaigns are stored in the admin_db Campaign table, and sent to segments
 * via the notification queue (email / push / telegram / in-app).
 *
 * Schema required (admin_db):
 *   Campaign { id, name, project, type, targetSegments(Json), content(Json),
 *              status, sentAt, sentCount, schedule, isActive, createdAt }
 *
 * Automatically triggered campaigns are registered via setupEventListeners().
 *
 * Usage:
 *   const { CampaignService } = require('../../core/marketing/campaign.service');
 *   const svc = new CampaignService(adminPrisma, projectPrisma, 'game');
 *   await svc.createCampaign({ name: 'Welcome', type: 'EMAIL', targetSegments: ['new_users'], content: {...} });
 */
'use strict';

const logger = require('../../shared/services/logger');
const notificationQueue = require('../../shared/queue/notificationQueue');
const { SegmentService }  = require('./segment.service');
const { eventBus, EVENTS } = require('../events/event-bus');

class CampaignService {
  /**
   * @param {object} adminPrisma   – admin_db Prisma client
   * @param {object} projectPrisma – project Prisma client (used for segment resolution)
   * @param {string} projectCode   – 'game' | 'sports' | 'trade' | 'dating' | 'hub'
   */
  constructor(adminPrisma, projectPrisma, projectCode) {
    this.adminPrisma  = adminPrisma;
    this.projectCode  = projectCode;
    this.segmentSvc   = new SegmentService(projectPrisma, projectCode);
    this._listenersRegistered = false;
  }

  /**
   * Register event-driven campaign triggers.
   * Call once during server start — safe to call multiple times (idempotent).
   */
  setupEventListeners() {
    if (this._listenersRegistered) return;
    this._listenersRegistered = true;

    // Welcome email when a new user registers
    eventBus.on(EVENTS.USER_REGISTERED, async (data) => {
      if (data.project !== this.projectCode) return;
      await this._sendDirectCampaign({
        name:   `Welcome — ${data.username || data.userId}`,
        type:   'EMAIL',
        userId: data.userId,
        content: {
          subject: `Chào mừng bạn đến với ${this.projectCode.toUpperCase()}!`,
          body:    `Chào {username}, cảm ơn bạn đã tham gia. Hãy khám phá ngay nhé!`,
        },
      });
    });

    // First-deposit push notification
    eventBus.on(EVENTS.DEPOSIT_SUCCESS, async (data) => {
      if (data.project !== this.projectCode || !data.isFirstDeposit) return;
      await this._sendDirectCampaign({
        name:   `First Deposit Bonus — ${data.userId}`,
        type:   'PUSH',
        userId: data.userId,
        content: {
          title: '🎉 Chúc mừng nạp tiền lần đầu!',
          body:  'Nhận ngay ưu đãi dành riêng cho thành viên mới. Khám phá ngay!',
        },
      });
    });

    // Level-up congratulation
    eventBus.on(EVENTS.LEVEL_UP, async (data) => {
      if (data.project !== this.projectCode) return;
      await this._sendDirectCampaign({
        name:   `VIP Level Up — ${data.userId}`,
        type:   'PUSH',
        userId: data.userId,
        content: {
          title: `🏆 Chúc mừng bạn lên cấp VIP ${data.newLevel}!`,
          body:  'Quyền lợi mới đang chờ bạn. Kiểm tra ngay!',
        },
      });
    });
  }

  // ── Campaign CRUD ─────────────────────────────────────────────────────────

  /**
   * Create and (optionally) immediately execute a campaign.
   * @param {object} opts
   * @param {string}   opts.name
   * @param {'EMAIL'|'PUSH'|'SMS'|'TELEGRAM'|'IN_APP'} opts.type
   * @param {string[]} opts.targetSegments
   * @param {object}   opts.content           – { subject?, body, title? }
   * @param {Date}     [opts.schedule]        – omit for immediate send
   * @param {boolean}  [opts.isActive=true]
   */
  async createCampaign(opts) {
    const isScheduled = opts.schedule && opts.schedule > new Date();

    const campaign = await this.adminPrisma.campaign.create({
      data: {
        name:           opts.name,
        project:        this.projectCode,
        type:           opts.type,
        targetSegments: opts.targetSegments || [],
        content:        opts.content || {},
        status:         isScheduled ? 'SCHEDULED' : 'ACTIVE',
        isActive:       opts.isActive !== false,
        schedule:       opts.schedule || new Date(),
      },
    });

    if (!isScheduled) {
      await this.executeCampaign(campaign.id);
    }

    return campaign;
  }

  /**
   * Execute a campaign — resolve segments, queue notifications.
   * @param {string} campaignId
   */
  async executeCampaign(campaignId) {
    const campaign = await this.adminPrisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || campaign.status === 'COMPLETED' || !campaign.isActive) return;

    try {
      const userIds = await this.segmentSvc.getUserIds(campaign.targetSegments || []);

      for (const userId of userIds) {
        await notificationQueue.add('send_campaign', {
          userId,
          project:    campaign.project,
          type:       campaign.type,
          content:    campaign.content,
          campaignId: campaign.id,
        }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
      }

      await this.adminPrisma.campaign.update({
        where: { id: campaignId },
        data:  { status: 'COMPLETED', sentAt: new Date(), sentCount: userIds.length },
      });

      logger.info(
        `[Campaign] executed id=${campaignId} sentTo=${userIds.length} type=${campaign.type}`,
      );
    } catch (e) {
      logger.error(`[Campaign] executeCampaign error: ${e.message}`, { campaignId });
      await this.adminPrisma.campaign.update({
        where: { id: campaignId },
        data:  { status: 'FAILED' },
      }).catch(() => {});
    }
  }

  /**
   * Admin: list campaigns for this project (paginated).
   */
  async listCampaigns({ skip = 0, take = 20, status } = {}) {
    const where = { project: this.projectCode };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.adminPrisma.campaign.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
      }),
      this.adminPrisma.campaign.count({ where }),
    ]);
    return { data, total };
  }

  /**
   * Admin: toggle campaign active flag.
   */
  async toggleCampaign(campaignId, isActive) {
    return this.adminPrisma.campaign.update({
      where: { id: campaignId },
      data:  { isActive },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Send a direct (non-segment) notification to a single user.
   * Fire-and-forget — errors are swallowed.
   */
  async _sendDirectCampaign({ name, type, userId, content }) {
    try {
      await notificationQueue.add('send_campaign', {
        userId,
        project:  this.projectCode,
        type,
        content,
        metadata: { auto: true, name },
      }, { attempts: 2 });
    } catch (e) {
      logger.error(`[Campaign] _sendDirectCampaign error: ${e.message}`, { userId, type });
    }
  }
}

module.exports = { CampaignService };
