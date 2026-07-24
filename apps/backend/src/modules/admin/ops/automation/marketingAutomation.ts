// @ts-nocheck
'use strict';
/**
 * MarketingAutomation — event-triggered promotions across all 5 projects.
 *
 * Runs for each configured project:
 *   1. Birthday bonus  (projects with lkvipTransaction)
 *   2. New users who haven't bet in 7 days
 *   3. VIP reward for users who deposited > 10M this month
 */
const logger = require('../../../../shared/services/logger');
const notificationService = require('../../../../shared/services/notificationService');

class MarketingAutomation {
  /**
   * @param {object} projectClients  – map: { game: PrismaClient, hub: PrismaClient, ... }
   * @param {object} adminPrisma     – Prisma client for admin DB
   */
  constructor(projectClients, adminPrisma) {
    // Accept both old (single gamePrisma) and new (projectClients map) signature
    if (projectClients && typeof projectClients === 'object' && !projectClients.$connect) {
      this.projects = projectClients;
    } else {
      this.projects = { game: projectClients };
    }
    this.admin = adminPrisma;
  }

  // ── Run all automated promotions across all projects ─────────────────────
  async runAll() {
    let totalBirthday = 0, totalNewUser = 0, totalVip = 0;

    for (const [project, db] of Object.entries(this.projects)) {
      if (!db) continue;
      const results = await Promise.allSettled([
        this._birthdayBonuses(project, db),
        this._newUserNudge(project, db),
        this._vipReward(project, db),
      ]);
      const counts = results.map(r => (r.status === 'fulfilled' ? r.value : 0));
      logger.info(`[Marketing] project=${project} birthday=${counts[0]} newUser=${counts[1]} vip=${counts[2]}`);
      totalBirthday += counts[0];
      totalNewUser  += counts[1];
      totalVip      += counts[2];
    }

    return { birthday: totalBirthday, newUser: totalNewUser, vip: totalVip };
  }

  // ── Birthday bonuses ──────────────────────────────────────────────────────
  async _birthdayBonuses(project, db) {
    const today = new Date();
    const mm    = today.getMonth() + 1;
    const dd    = today.getDate();

    let users = [];
    try {
      users = await db.user.findMany({
        where: { birthDate: { not: null }, status: 'active' },
        select: { id: true, birthDate: true },
      });
      users = users.filter(u => {
        if (!u.birthDate) return false;
        const bd = new Date(u.birthDate);
        return bd.getMonth() + 1 === mm && bd.getDate() === dd;
      });
    } catch { return 0; }

    let sent = 0;
    for (const u of users) {
      const alreadySent = await this.admin.opsCampaignLog.findFirst({
        where: {
          project,
          userId:       u.id,
          campaignName: 'Birthday Bonus',
          createdAt:    { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) },
        },
      }).catch(() => null);

      if (alreadySent) continue;

      // Credit bonus (game project has LkvipTransaction; others skip gracefully)
      try {
        await db.lkvipTransaction.create({
          data: {
            userId:      u.id,
            type:        'bonus',
            amount:      100000,
            description: 'Quà sinh nhật',
            status:      'completed',
          },
        });
      } catch { /* model not available on this project */ }

      await this.admin.opsCampaignLog.create({
        data: { project, userId: u.id, campaignName: 'Birthday Bonus', segment: 'all', action: 'bonus_credit', status: 'sent' },
      }).catch(() => {});

      notificationService.sendToUser(u.id, 'ops:campaign', {
        campaign: 'Birthday Bonus',
        message:  '🎂 Chúc mừng sinh nhật! Bạn vừa nhận được 100.000đ từ chúng tôi.',
      });
      sent++;
    }
    return sent;
  }

  // ── New users not yet active ──────────────────────────────────────────────
  async _newUserNudge(project, db) {
    const cutoff = new Date(Date.now() - 7 * 86400000);
    let users = [];
    try {
      users = await db.user.findMany({
        where: { createdAt: { gte: cutoff }, status: 'active' },
        select: { id: true },
      });
    } catch { return 0; }

    let sent = 0;
    for (const u of users) {
      let hasBet = null;
      try {
        hasBet = await db.lkvipTransaction.findFirst({
          where: { userId: u.id, type: { in: ['bet', 'deposit'] } },
        }).catch(() => null);
      } catch { /* model not available */ }
      if (hasBet) continue;

      const alreadySent = await this.admin.opsCampaignLog.findFirst({
        where: { project, userId: u.id, campaignName: 'New User Nudge', createdAt: { gte: cutoff } },
      }).catch(() => null);
      if (alreadySent) continue;

      await this.admin.opsCampaignLog.create({
        data: { project, userId: u.id, campaignName: 'New User Nudge', segment: 'bronze', action: 'notify', status: 'sent' },
      }).catch(() => {});

      notificationService.sendToUser(u.id, 'ops:campaign', {
        campaign: 'New User Nudge',
        message:  '🎁 Bắt đầu hành trình của bạn – nạp tiền ngay để nhận thưởng chào mừng!',
      });
      sent++;
    }
    return sent;
  }

  // ── VIP reward for top depositors this month ──────────────────────────────
  async _vipReward(project, db) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let topDepositors = [];
    try {
      const rows = await db.lkvipTransaction.groupBy({
        by:    ['userId'],
        where: { type: 'deposit', status: 'completed', createdAt: { gte: monthStart } },
        _sum:  { amount: true },
        having: { amount: { _sum: { gt: 10000000 } } },
      });
      topDepositors = rows.map(r => ({ userId: r.userId, total: Number(r._sum.amount) }));
    } catch { return 0; }

    let sent = 0;
    for (const d of topDepositors) {
      const alreadySent = await this.admin.opsCampaignLog.findFirst({
        where: { project, userId: d.userId, campaignName: 'VIP Monthly Reward', createdAt: { gte: monthStart } },
      }).catch(() => null);
      if (alreadySent) continue;

      await this.admin.opsCampaignLog.create({
        data: { project, userId: d.userId, campaignName: 'VIP Monthly Reward', segment: 'champion', action: 'notify', status: 'sent' },
      }).catch(() => {});

      notificationService.sendToUser(d.userId, 'ops:campaign', {
        campaign: 'VIP Monthly Reward',
        message:  `🌟 Cảm ơn bạn đã nạp ${Number(d.total).toLocaleString('vi-VN')}đ tháng này! Phần thưởng VIP đang được xử lý.`,
      });
      sent++;
    }
    return sent;
  }
}

module.exports = MarketingAutomation;
