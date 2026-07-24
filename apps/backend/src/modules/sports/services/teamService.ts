// @ts-nocheck
'use strict';
/**
 * Team Service (Sports)
 *
 * Team CRUD plus helper for fetching recent form (last 5 results).
 */

class TeamService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /** List teams with optional league/status filter. */
  async list({ page = 1, limit = 20, leagueId, status, q } = {}) {
    const where = {};
    if (leagueId) where.leagueId = Number(leagueId);
    if (status)   where.status   = status;
    if (q)        where.name     = { contains: q };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { name: 'asc' },
        include: { league: { select: { id: true, name: true, slug: true, logo: true } } },
      }),
      this.prisma.team.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  /** Get full team detail by slug, including recent matches. */
  async getBySlug(slug) {
    return this.prisma.team.findUnique({
      where:   { slug },
      include: {
        league: true,
        homeMatches: {
          where:   { status: 'finished' },
          orderBy: { startTime: 'desc' },
          take:    5,
          include: { homeTeam: true, awayTeam: true },
        },
        awayMatches: {
          where:   { status: 'finished' },
          orderBy: { startTime: 'desc' },
          take:    5,
          include: { homeTeam: true, awayTeam: true },
        },
      },
    });
  }

  /**
   * Compute last-5 form for a team (W/D/L array) from finished matches.
   */
  async getForm(teamId) {
    const matches = await this.prisma.match.findMany({
      where: {
        status: 'finished',
        OR: [{ homeTeamId: Number(teamId) }, { awayTeamId: Number(teamId) }],
      },
      orderBy: { startTime: 'desc' },
      take:    5,
      select:  { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
    });

    return matches.map((m) => {
      const isHome = m.homeTeamId === Number(teamId);
      const scored  = isHome ? m.homeScore : m.awayScore;
      const against = isHome ? m.awayScore : m.homeScore;
      if (scored > against)  return 'W';
      if (scored < against)  return 'L';
      return 'D';
    });
  }
}

module.exports = TeamService;
