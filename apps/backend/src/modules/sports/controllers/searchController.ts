import type { Request, Response } from 'express';
const { success, error } = require('../../../shared/utils/network/response');

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };
    if (!q || q.length < 2) { error(res, 'Query must be at least 2 characters'); return; }

    const searchTerm = { contains: q };

    const [leagues, teams, matches, news, posts, highlights] = await Promise.all([
      (req as any).prisma.league.findMany({
        where:  { name: searchTerm, status: 'active' },
        select: { id: true, name: true, slug: true, logo: true },
        take:   5,
      }),
      (req as any).prisma.team.findMany({
        where:  { name: searchTerm, status: 'active' },
        select: { id: true, name: true, slug: true, logo: true },
        take:   5,
      }),
      (req as any).prisma.match.findMany({
        where: {
          OR: [
            { homeTeam: { name: searchTerm } },
            { awayTeam: { name: searchTerm } },
            { league:   { name: searchTerm } },
          ],
          status: { in: ['scheduled', 'live', 'finished'] },
        },
        select: {
          id: true,
          homeTeam: { select: { name: true, logo: true } },
          awayTeam: { select: { name: true, logo: true } },
          startTime: true,
          status: true,
        },
        take: 5,
      }),
      (req as any).prisma.news.findMany({
        where:  { title: searchTerm, status: 'published' },
        select: { id: true, title: true, slug: true, image: true, publishedAt: true },
        take:   5,
      }),
      (req as any).prisma.post.findMany({
        where:  { content: searchTerm, status: 'active', isPublic: true },
        select: { id: true, content: true, createdAt: true },
        take:   5,
      }),
      (req as any).prisma.highlight.findMany({
        where:  { title: searchTerm, status: 'active' },
        select: { id: true, title: true, slug: true, thumbnail: true },
        take:   5,
      }),
    ]);

    success(res, { leagues, teams, matches, news, posts, highlights });
  } catch (e: unknown) {
    error(res, e instanceof Error ? e.message : 'Error', 500);
  }
};
