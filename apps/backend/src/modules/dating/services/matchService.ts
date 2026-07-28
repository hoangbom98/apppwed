const BaseService    = require('../../../shared/services/BaseService');
const NotificationService = require('../../../shared/services/notificationService');

interface MatchRecord {
  id: string;
  user1Id: string;
  user2Id: string;
  status: string;
}

class MatchService extends BaseService {
  constructor(prisma: unknown) {
    super(prisma, 'match');
  }

  async getSuggestions(userId: string, limit: number | string = 10, _filters: Record<string, unknown> = {}): Promise<unknown[]> {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { interestedIn: true },
    });

    const excluded: Array<{ user1Id: string; user2Id: string }> = await this.prisma.match.findMany({
      where:  { OR: [{ user1Id: userId }, { user2Id: userId }] },
      select: { user1Id: true, user2Id: true },
    });

    const excludeIds = new Set<string>([userId]);
    excluded.forEach(m => {
      excludeIds.add(m.user1Id);
      excludeIds.add(m.user2Id);
    });

    const where: Record<string, unknown> = {
      id:     { notIn: Array.from(excludeIds) },
      status: 'active',
    };
    if (user?.interestedIn) where.gender = user.interestedIn;

    return this.prisma.user.findMany({
      where,
      take:    parseInt(String(limit), 10),
      orderBy: { createdAt: 'desc' },
    });
  }

  async like(userId: string, targetUserId: string, projectCode: string): Promise<{ status: string; match?: MatchRecord }> {
    const existing: MatchRecord | null = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
        ],
      },
    });

    if (existing?.status === 'matched') return { status: 'already_matched' };
    if (existing?.status === 'liked' && existing.user1Id !== userId) {
      const match: MatchRecord = await this.prisma.match.update({
        where: { id: existing.id },
        data:  { status: 'matched' },
      });
      await NotificationService.sendEmail(projectCode, targetUserId, 'Match!', 'Bạn có một match mới!');
      return { status: 'matched', match };
    }

    const match: MatchRecord = await this.prisma.match.create({
      data: { user1Id: userId, user2Id: targetUserId, status: 'liked' },
    });
    return { status: 'liked', match };
  }

  async getUserMatches(userId: string): Promise<MatchRecord[]> {
    return this.prisma.match.findMany({
      where: {
        OR:     [{ user1Id: userId }, { user2Id: userId }],
        status: 'matched',
      },
    });
  }
}

module.exports = MatchService;
