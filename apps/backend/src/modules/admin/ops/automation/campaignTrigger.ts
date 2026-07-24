// @ts-nocheck
'use strict';
/**
 * CampaignTrigger — fires segment-based marketing campaigns.
 *
 * Checks campaign_log to avoid duplicate sends within the cooldown window.
 */
const logger = require('../../../../shared/services/logger');
const notificationService = require('../../../../shared/services/notificationService');

const COOLDOWN_DAYS = 7;

const CAMPAIGNS = {
  champion: {
    name:    'VIP Appreciation',
    message: '🏆 Cảm ơn sự ủng hộ của bạn! Nhận ngay ưu đãi đặc biệt dành cho thành viên VIP.',
    bonus:   500000,
    action:  'bonus_credit',
  },
  gold: {
    name:    'Gold Member Reward',
    message: '🥇 Thưởng nạp đầu tháng – nạp ngay để nhận thêm 10%!',
    bonus:   0,
    action:  'deposit_bonus',
  },
  at_risk: {
    name:    'Win-Back Campaign',
    message: '👋 Chúng tôi nhớ bạn! Trở lại ngay nhận 5 vòng quay miễn phí.',
    bonus:   0,
    action:  'free_spins',
  },
  silver: {
    name:    'Silver Boost',
    message: '⭐ Bạn đang tiến tới cấp Gold. Nạp thêm để nhận thưởng!',
    bonus:   0,
    action:  'notify',
  },
  bronze: {
    name:    'Welcome Journey',
    message: '👋 Chào mừng bạn đến với hành trình thú vị! Nhận hướng dẫn bắt đầu.',
    bonus:   0,
    action:  'notify',
  },
};

class CampaignTrigger {
  constructor(adminPrisma) {
    this.admin = adminPrisma;
  }

  // ── Trigger campaign for a single user based on their current segment ─────
  async trigger(userId, segment) {
    const uid      = parseInt(userId, 10);
    const campaign = CAMPAIGNS[segment];
    if (!campaign) return null;

    // Cooldown check
    const cooldownDate = new Date(Date.now() - COOLDOWN_DAYS * 86400000);
    const existing = await this.admin.opsCampaignLog.findFirst({
      where: {
        userId:       uid,
        campaignName: campaign.name,
        createdAt:    { gte: cooldownDate },
      },
    }).catch(() => null);

    if (existing) return null; // already sent recently

    // Log the campaign
    await this.admin.opsCampaignLog.create({
      data: {
        userId:       uid,
        campaignName: campaign.name,
        segment,
        action:       campaign.action,
        status:       'sent',
      },
    }).catch(() => {});

    // Emit real-time notification
    notificationService.sendToUser(uid, 'ops:campaign', {
      campaign: campaign.name,
      message:  campaign.message,
    });

    logger.info(`[Campaign] ${campaign.name} → userId=${uid}`);
    return { userId: uid, campaign: campaign.name, segment };
  }

  // ── Run all pending campaigns across all segmented users ──────────────────
  async runAll() {
    let segments = [];
    try {
      segments = await this.admin.opsUserSegment.findMany({
        select: { userId: true, segment: true },
      });
    } catch (err) {
      logger.error(`[Campaign] runAll: ${err.message}`);
      return 0;
    }

    let sent = 0;
    for (const s of segments) {
      const result = await this.trigger(s.userId, s.segment);
      if (result) sent++;
    }

    logger.info(`[Campaign] runAll: ${sent}/${segments.length} campaigns fired`);
    return sent;
  }

  // ── Stats for the last N days ─────────────────────────────────────────────
  async getStats(days = 7) {
    const since = new Date(Date.now() - days * 86400000);
    try {
      const rows = await this.admin.opsCampaignLog.groupBy({
        by:    ['campaignName'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      });
      return rows.map(r => ({ campaign: r.campaignName, count: r._count.id }));
    } catch {
      return [];
    }
  }
}

module.exports = CampaignTrigger;
