const { success, error } = require('../../../shared/utils/network/response');

exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return error(res, 'Query must be at least 2 characters');
    
    const searchTerm = { contains: q };
    
    const [leagues, teams, matches, news, posts, highlights] = await Promise.all([
      req.prisma.league.findMany({
        where: { name: searchTerm, status: 'active' },
        select: { id: true, name: true, slug: true, logo: true },
        take: 5,
      }),
      req.prisma.team.findMany({
        where: { name: searchTerm, status: 'active' },
        select: { id: true, name: true, slug: true, logo: true },
        take: 5,
      }),
      req.prisma.match.findMany({
        where: {
          OR: [
            { homeTeam: { name: searchTerm } },
            { awayTeam: { name: searchTerm } },
            { league: { name: searchTerm } },
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
      req.prisma.news.findMany({
        where: { title: searchTerm, status: 'published' },
        select: { id: true, title: true, slug: true, image: true, publishedAt: true },
        take: 5,
      }),
      req.prisma.post.findMany({
        where: { content: searchTerm, status: 'active', isPublic: true },
        select: { id: true, content: true, createdAt: true },
        take: 5,
      }),
      req.prisma.highlight.findMany({
        where: { title: searchTerm, status: 'active' },
        select: { id: true, title: true, slug: true, thumbnail: true },
        take: 5,
      }),
    ]);
    
    return success(res, { leagues, teams, matches, news, posts, highlights });
  } catch (e) {
    return error(res, e.message, 500);
  }
};
