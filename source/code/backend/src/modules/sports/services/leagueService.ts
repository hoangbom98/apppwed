// @ts-nocheck
'use strict';
/**
 * League Service (Sports)
 *
 * CRUD and related helpers for football/sports leagues, including
 * team listings and upcoming-match counts.
 */

class LeagueService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * List leagues with optional filters.
   * @param {{ page?, limit?, status?, type?, country?, q? }} opts
   */
  async list({ page = 1, limit = 20, status, type, country, q } = {}) {
    const where = {};
    if (status)  where.status  = status;
    if (type)    where.type    = type;
    if (country) where.country = country;
    if (q)       where.name    = { contains: q };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.league.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.league.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  /**
   * Get a single league by slug with team/match counts.
   */
  async getBySlug(slug) {
    return this.prisma.league.findUnique({
      where:   { slug },
      include: { _count: { select: { teams: true, matches: true } } },
    });
  }

  /**
   * Get all teams belonging to a league.
   */
  async getTeams(leagueId) {
    return this.prisma.team.findMany({
      where:   { leagueId: Number(leagueId), status: 'active' },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get current standings for a league ordered by points.
   */
  async getStandings(leagueId) {
    return this.prisma.standing.findMany({
      where:   { leagueId: Number(leagueId) },
      orderBy: [{ points: 'desc' }, { goalDiff: 'desc' }, { goalsFor: 'desc' }],
      include: { team: { select: { id: true, name: true, slug: true, logo: true } } },
    });
  }

  // ── Mutations (admin only) ─────────────────────────────────────────────────

  /** Create a new league. */
  async create(data) {
    return this.prisma.league.create({ data });
  }

  /** Update a league by id. */
  async update(id, data) {
    return this.prisma.league.update({
      where: { id: Number(id) },
      data:  { ...data, updatedAt: new Date() },
    });
  }
}

module.exports = LeagueService;
