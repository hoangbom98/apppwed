// @ts-nocheck
const { success, created, error } = require('../../../shared/utils/response');

exports.list = async (req, res) => {
  try {
    const favorites = await req.prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        team: { select: { id: true, name: true, slug: true, logo: true } },
        league: { select: { id: true, name: true, slug: true, logo: true } },
        match: {
          select: {
            id: true,
            homeTeam: { select: { name: true, logo: true } },
            awayTeam: { select: { name: true, logo: true } },
            startTime: true,
            status: true,
          },
        },
        streamer: {
          select: { id: true, displayName: true, avatar: true, isLive: true },
        },
      },
    });
    
    return success(res, { favorites });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.add = async (req, res) => {
  try {
    const { teamId, leagueId, matchId, streamerId } = req.body;
    if (!teamId && !leagueId && !matchId && !streamerId) {
      return error(res, 'Provide one of: teamId, leagueId, matchId, streamerId');
    }
    
    const data = { userId: req.user.id };
    if (teamId)    data.teamId    = teamId;          // CUID strings
    if (leagueId)  data.leagueId  = leagueId;
    if (matchId)   data.matchId   = matchId;
    if (streamerId) data.streamerId = streamerId;
    
    const favorite = await req.prisma.favorite.create({ data });
    return created(res, favorite);
  } catch (e) {
    if (e.code === 'P2002') return error(res, 'Already favorited', 400);
    return error(res, e.message, 500);
  }
};

exports.remove = async (req, res) => {
  try {
    const { type, id } = req.params;
    const where = { userId: req.user.id };
    
    if (type === 'team')         where.teamId     = id;   // CUID strings
    else if (type === 'league')  where.leagueId   = id;
    else if (type === 'match')   where.matchId    = id;
    else if (type === 'streamer') where.streamerId = id;
    else return error(res, 'Invalid type', 400);
    
    const favorite = await req.prisma.favorite.findFirst({ where });
    if (!favorite) return error(res, 'Favorite not found', 404);
    
    await req.prisma.favorite.delete({ where: { id: favorite.id } });
    return success(res, null, 'Removed from favorites');
  } catch (e) {
    return error(res, e.message, 500);
  }
};
