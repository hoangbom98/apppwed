// @ts-nocheck
'use strict';
/**
 * hub/services/adminService.js
 * All IDs are CUIDs (strings) — never use parseInt(id) or Number(id).
 */

class AdminService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getDashboardStats() {
    const [
      users, games, news, feedbacks, newInquiries, socialChannels,
      socialPosts, pendingSocialReports, prodevsProjects,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.game.count(),
      this.prisma.news.count(),
      this.prisma.feedback.count({ where: { status: 'pending' } }),
      this.prisma.inquiry.count({ where: { status: 'new' } }),
      this.prisma.socialChannel.count(),
      // Social App stats (integrated from apps/external/social)
      this.prisma.socialPost.count({ where: { status: 'active' } }),
      this.prisma.socialReport.count({ where: { status: 'pending' } }),
      // ProDevs stats (integrated from apps/external/prodevs)
      this.prisma.prodevsProject.count(),
    ]);
    return {
      users, games, news,
      pendingFeedbacks: feedbacks, newInquiries, socialChannels,
      socialPosts, pendingSocialReports, prodevsProjects,
    };
  }

  async listResource(modelKey, query) {
    const { page = 1, limit = 10, status } = query;
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;
    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma[modelKey].findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma[modelKey].count({ where }),
    ]);
    return { data, meta: { total, page: parseInt(page, 10), limit: take, pages: Math.ceil(total / take) } };
  }

  async getResource(modelKey, id) {
    // id is a CUID string — no parseInt coercion
    return this.prisma[modelKey].findUnique({ where: { id } });
  }

  async createResource(modelKey, data) {
    return this.prisma[modelKey].create({ data });
  }

  async updateResource(modelKey, id, data) {
    // id is a CUID string — no parseInt coercion
    return this.prisma[modelKey].update({ where: { id }, data });
  }

  async deleteResource(modelKey, id) {
    // id is a CUID string — no parseInt coercion
    return this.prisma[modelKey].delete({ where: { id } });
  }

  async getSettings() {
    return this.prisma.setting.findMany({ orderBy: { group: 'asc' } });
  }

  async updateSettings(settings) {
    for (const s of settings) {
      await this.prisma.setting.upsert({ where: { key: s.key }, create: s, update: { value: s.value } });
    }
    return true;
  }
}

module.exports = AdminService;
