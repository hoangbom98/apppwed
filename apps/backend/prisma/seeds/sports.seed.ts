'use strict';
/**
 * prisma/seeds/sports.seed.ts — Sports DB seed
 * Creates: Leagues, Teams, sample upcoming Matches
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');
const prisma = getPrismaClient('sports');

async function seed() {
  // ── 1. Leagues ────────────────────────────────────────────────────
  const leagues = [
    { name: 'English Premier League', slug: 'epl',        country: 'England', type: 'national',      sortOrder: 1 },
    { name: 'La Liga',                slug: 'la-liga',    country: 'Spain',   type: 'national',      sortOrder: 2 },
    { name: 'Champions League',       slug: 'ucl',        country: 'Europe',  type: 'international', sortOrder: 3 },
    { name: 'V.League 1',             slug: 'vleague1',   country: 'Vietnam', type: 'national',      sortOrder: 4 },
    { name: 'Bundesliga',             slug: 'bundesliga', country: 'Germany', type: 'national',      sortOrder: 5 },
    { name: 'Serie A',                slug: 'serie-a',    country: 'Italy',   type: 'national',      sortOrder: 6 },
  ];
  const leagueMap = {};
  for (const lg of leagues) {
    const result = await prisma.league.upsert({
      where:  { slug: lg.slug },
      update: { status: 'active' },
      create: { ...lg, status: 'active' },
    });
    leagueMap[lg.slug] = result.id;
  }
  console.log(`  Leagues: ${leagues.length}`);

  // ── 2. Teams ──────────────────────────────────────────────────────
  const teams = [
    // EPL
    { leagueSlug: 'epl',        name: 'Manchester City', slug: 'man-city',    country: 'England' },
    { leagueSlug: 'epl',        name: 'Arsenal',          slug: 'arsenal',     country: 'England' },
    { leagueSlug: 'epl',        name: 'Liverpool',        slug: 'liverpool',   country: 'England' },
    { leagueSlug: 'epl',        name: 'Chelsea',          slug: 'chelsea',     country: 'England' },
    // La Liga
    { leagueSlug: 'la-liga',    name: 'Real Madrid',      slug: 'real-madrid', country: 'Spain'   },
    { leagueSlug: 'la-liga',    name: 'FC Barcelona',     slug: 'barcelona',   country: 'Spain'   },
    // V.League
    { leagueSlug: 'vleague1',   name: 'Hà Nội FC',        slug: 'hanoi-fc',    country: 'Vietnam' },
    { leagueSlug: 'vleague1',   name: 'HAGL',              slug: 'hagl',        country: 'Vietnam' },
    { leagueSlug: 'vleague1',   name: 'SHB Đà Nẵng',      slug: 'da-nang',     country: 'Vietnam' },
    // Bundesliga
    { leagueSlug: 'bundesliga', name: 'Bayern Munich',    slug: 'bayern',      country: 'Germany' },
    { leagueSlug: 'bundesliga', name: 'Borussia Dortmund',slug: 'dortmund',    country: 'Germany' },
  ];
  const teamMap = {};
  for (const team of teams) {
    const leagueId = leagueMap[team.leagueSlug];
    if (!leagueId) continue;
    const result = await prisma.team.upsert({
      where:  { slug: team.slug },
      update: {},
      create: { leagueId, name: team.name, slug: team.slug, country: team.country, status: 'active' },
    });
    teamMap[team.slug] = result.id;
  }
  console.log(`  Teams: ${teams.length}`);

  // ── 3. Sample Matches (upcoming) ──────────────────────────────────
  // Use relative future timestamps so matches are always "upcoming" when seeded
  const now = new Date();
  const upcoming = (hoursFromNow) => new Date(now.getTime() + hoursFromNow * 3600 * 1000);

  const matchDefs = [
    {
      leagueSlug: 'epl',
      homeSlug:   'man-city',
      awaySlug:   'arsenal',
      startTime:  upcoming(24),
      round:      'Matchday 1',
      season:     '2025-26',
    },
    {
      leagueSlug: 'epl',
      homeSlug:   'liverpool',
      awaySlug:   'chelsea',
      startTime:  upcoming(48),
      round:      'Matchday 1',
      season:     '2025-26',
    },
    {
      leagueSlug: 'la-liga',
      homeSlug:   'real-madrid',
      awaySlug:   'barcelona',
      startTime:  upcoming(72),
      round:      'Matchday 1',
      season:     '2025-26',
    },
    {
      leagueSlug: 'vleague1',
      homeSlug:   'hanoi-fc',
      awaySlug:   'hagl',
      startTime:  upcoming(36),
      round:      'Vòng 1',
      season:     '2025',
    },
    {
      leagueSlug: 'bundesliga',
      homeSlug:   'bayern',
      awaySlug:   'dortmund',
      startTime:  upcoming(96),
      round:      'Matchday 1',
      season:     '2025-26',
    },
  ];

  let matchCount = 0;
  for (const m of matchDefs) {
    const leagueId   = leagueMap[m.leagueSlug];
    const homeTeamId = teamMap[m.homeSlug];
    const awayTeamId = teamMap[m.awaySlug];
    if (!leagueId || !homeTeamId || !awayTeamId) continue;

    // upsert by composite leagueId+homeTeamId+awayTeamId+startTime is not straightforward;
    // use createMany with skipDuplicates based on a unique index — or just try/catch createMany
    try {
      await prisma.match.create({
        data: {
          leagueId,
          homeTeamId,
          awayTeamId,
          startTime: m.startTime,
          status:    'scheduled',
          round:     m.round,
          season:    m.season,
        },
      });
      matchCount++;
    } catch {
      // Duplicate match already exists — skip silently
    }
  }
  console.log(`  Matches: ${matchCount} sample upcoming matches created`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => { console.log('✅ sports.seed done'); process.exit(0); })
    .catch(e => { console.error('[seed:sports] ❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect && prisma.$disconnect());
}
