// @ts-nocheck
'use strict';
/**
 * Standing Service (Sports)
 *
 * Manages league standings including automated recalculation
 * after match results are confirmed.
 */

class StandingService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Get current standings for a league.
   */
  async getByLeague(leagueId) {
    return this.prisma.standing.findMany({
      where:   { leagueId: Number(leagueId) },
      orderBy: [{ points: 'desc' }, { goalDiff: 'desc' }, { goalsFor: 'desc' }],
      include: { team: { select: { id: true, name: true, slug: true, logo: true } } },
    });
  }

  // ── Mutations (admin / cron) ───────────────────────────────────────────────

  /**
   * Recalculate all standings for a league from finished matches.
   * Called automatically after a match is finalised.
   */
  async recalculate(leagueId) {
    const matches = await this.prisma.match.findMany({
      where:  { leagueId: Number(leagueId), status: 'finished' },
      select: {
        homeTeamId: true, awayTeamId: true,
        homeScore:  true, awayScore:  true,
      },
    });

    const table = {};
    const ensure = (teamId) => {
      if (!table[teamId]) {
        table[teamId] = { teamId, leagueId: Number(leagueId), played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 };
      }
    };

    for (const m of matches) {
      const h = m.homeTeamId;
      const a = m.awayTeamId;
      ensure(h);
      ensure(a);
      table[h].played++;
      table[a].played++;
      table[h].goalsFor     += m.homeScore;
      table[h].goalsAgainst += m.awayScore;
      table[a].goalsFor     += m.awayScore;
      table[a].goalsAgainst += m.homeScore;

      if (m.homeScore > m.awayScore) {
        table[h].won++;   table[h].points += 3;
        table[a].lost++;
      } else if (m.homeScore < m.awayScore) {
        table[a].won++;   table[a].points += 3;
        table[h].lost++;
      } else {
        table[h].drawn++; table[h].points++;
        table[a].drawn++; table[a].points++;
      }

      table[h].goalDiff = table[h].goalsFor - table[h].goalsAgainst;
      table[a].goalDiff = table[a].goalsFor - table[a].goalsAgainst;
    }

    // Upsert standings
    const rows = Object.values(table);
    for (const row of rows) {
      await this.prisma.standing.upsert({
        where:  { leagueId_teamId: { leagueId: row.leagueId, teamId: row.teamId } },
        create: row,
        update: {
          played:       row.played,
          won:          row.won,
          drawn:        row.drawn,
          lost:         row.lost,
          goalsFor:     row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDiff:     row.goalDiff,
          points:       row.points,
          updatedAt:    new Date(),
        },
      });
    }

    return rows.length;
  }
}

module.exports = StandingService;
