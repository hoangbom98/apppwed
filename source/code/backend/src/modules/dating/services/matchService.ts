// @ts-nocheck
const BaseService = require('../../../shared/services/BaseService');
const NotificationService = require('../../../shared/services/notificationService');

class MatchService extends BaseService {
  constructor(prisma) {
    super(prisma, 'match');
  }

  async getSuggestions(userId, limit = 10, _filters = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { interestedIn: true },
    });

    const excluded = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: { user1Id: true, user2Id: true },
    });
    
    const excludeIds = new Set([userId]);
    excluded.forEach(m => {
      excludeIds.add(m.user1Id);
      excludeIds.add(m.user2Id);
    });

    const where = {
      id: { notIn: Array.from(excludeIds) },
      status: 'active',
    };
    if (user?.interestedIn) where.gender = user.interestedIn;

    return this.prisma.user.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });
  }

  async like(userId, targetUserId, projectCode) {
    const existing = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
        ],
      },
    });

    if (existing && existing.status === 'matched') return { status: 'already_matched' };
    if (existing && existing.status === 'liked' && existing.user1Id !== userId) {
      const match = await this.prisma.match.update({
        where: { id: existing.id },
        data: { status: 'matched' },
      });
      await NotificationService.sendEmail(projectCode, targetUserId, 'Match!', 'Bạn có một match mới!');
      return { status: 'matched', match };
    }

    const match = await this.prisma.match.create({
      data: { user1Id: userId, user2Id: targetUserId, status: 'liked' },
    });
    return { status: 'liked', match };
  }

  async getUserMatches(userId) {
    return this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'matched',
      },
    });
  }
}

module.exports = MatchService;
