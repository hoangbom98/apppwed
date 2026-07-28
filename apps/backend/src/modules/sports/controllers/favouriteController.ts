import type { Request, Response } from 'express';
const { success, created, error, notFound } = require('../../../shared/utils/network/response');

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const favorites = await (req as any).prisma.favorite.findMany({
      where:   { userId: (req as any).user.id },
      include: {
        team:     { select: { id: true, name: true, slug: true, logo: true } },
        league:   { select: { id: true, name: true, slug: true, logo: true } },
        match:    {
          select: {
            id: true,
            homeTeam: { select: { name: true, logo: true } },
            awayTeam: { select: { name: true, logo: true } },
            startTime: true,
            status: true,
          },
        },
        streamer: { select: { id: true, displayName: true, avatar: true, isLive: true } },
      },
    });
    success(res, { favorites });
  } catch (e: unknown) {
    error(res, e instanceof Error ? e.message : 'Error', 500);
  }
};

export const add = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId, leagueId, matchId, streamerId } = req.body;
    if (!teamId && !leagueId && !matchId && !streamerId) {
      error(res, 'Provide one of: teamId, leagueId, matchId, streamerId');
      return;
    }

    const data: Record<string, unknown> = { userId: (req as any).user.id };
    if (teamId)    data.teamId    = teamId;
    if (leagueId)  data.leagueId  = leagueId;
    if (matchId)   data.matchId   = matchId;
    if (streamerId) data.streamerId = streamerId;

    const favorite = await (req as any).prisma.favorite.create({ data });
    created(res, favorite);
  } catch (e: any) {
    if (e.code === 'P2002') { error(res, 'Already favorited', 400); return; }
    error(res, e.message, 500);
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, id } = req.params;
    const where: Record<string, unknown> = { userId: (req as any).user.id };

    if      (type === 'team')     where.teamId     = id;
    else if (type === 'league')   where.leagueId   = id;
    else if (type === 'match')    where.matchId    = id;
    else if (type === 'streamer') where.streamerId = id;
    else { error(res, 'Invalid type', 400); return; }

    const favorite = await (req as any).prisma.favorite.findFirst({ where });
    if (!favorite) { notFound(res, 'Favorite not found'); return; }

    await (req as any).prisma.favorite.delete({ where: { id: favorite.id } });
    success(res, null, 'Removed from favorites');
  } catch (e: unknown) {
    error(res, e instanceof Error ? e.message : 'Error', 500);
  }
};
