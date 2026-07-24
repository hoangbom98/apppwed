// src/modules/sports/services/sports.service.ts
import { PrismaClient } from '@prisma/client';
import { ServiceRegistry } from '../../../third-parties/core/ServiceRegistry';
import { ServiceType } from '../../../third-parties/core/interfaces';
import { logger } from '../../../core/logger/logger.service';

const prisma = new PrismaClient();

export class SportsService {
  async syncEvents(projectId: string, date: string) {
    const registry = ServiceRegistry.getInstance();
    const provider = registry.getProvider('GNEWS');
    if (!provider) throw new Error('GNews provider not registered');

    const newsService = provider.getService(ServiceType.SPORTS_NEWS);
    if (!newsService) throw new Error('News service not found');

    const data = await newsService.call({ date });

    // Assuming GNews structure, adjust based on actual provider response
    const events = data.articles.map((article: any) => ({
      externalId: article.url,
      name: article.title,
      category: 'Sports',
      startTime: new Date(),
      homeTeam: 'Unknown',
      awayTeam: 'Unknown',
      projectId,
    }));

    for (const event of events) {
      await prisma.sportEvent.upsert({
        where: { externalId: event.externalId },
        update: event,
        create: event,
      });
    }

    logger.info(`Sports events synced for project ${projectId}`, { count: events.length });
    return { success: true, count: events.length };
  }

  async getEvents(projectId: string, filters: any) {
    return prisma.sportEvent.findMany({
      where: { ...filters, projectId },
      orderBy: { startTime: 'asc' },
    });
  }
}

export const sportsService = new SportsService();
