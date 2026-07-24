// src/modules/sports/services/sportsDataSyncService.ts
// ─────────────────────────────────────────────────────────────────────────────
// SportsDataSyncService — syncs data from ApiFootball / TheSportsDB / GNews
// into sports_db. Called by cron jobs and admin-triggered syncs.
//
// CRON SCHEDULE (registered in src/config/cron.ts):
//   Live scores:  every 60s  (only when matches are actually live)
//   Fixtures:     every 6h
//   Standings:    daily at 03:00
//   News:         every 30min
//
// All DB writes use the sports prisma client (passed at construction).
// Redis caching reduces external API calls (TTLs configured via env vars).
// Socket.IO pushes real-time score updates to connected clients.
// ─────────────────────────────────────────────────────────────────────────────
// @ts-nocheck
'use strict';

const { ServiceRegistry }  = require('../../../third-parties/core/ServiceRegistry');
const { ServiceType }      = require('../../../third-parties/core/interfaces');
const cache                = require('../../../shared/services/cacheService');
const logger               = require('../../../shared/services/logger');
const { getIo }            = require('../../../shared/socket/socketStore');

// League IDs to track (comma-sep env var, or defaults below)
// API-Football IDs:
//   39  = Premier League   140 = La Liga    78 = Bundesliga
//   135 = Serie A          61  = Ligue 1    340 = V.League 1 (Vietnam)
//   2   = Champions League  3  = Europa League
const DEFAULT_LEAGUES = [39, 140, 78, 135, 61, 340, 2];

function getTrackedLeagues(): number[] {
  const raw = process.env.SPORTS_LEAGUES;
  if (!raw) return DEFAULT_LEAGUES;
  return raw.split(',').map(Number).filter(Boolean);
}

const CACHE_TTL_LIVE     = parseInt(process.env.SPORTS_CACHE_TTL_LIVE     ?? '55',    10);
const CACHE_TTL_FIXTURES = parseInt(process.env.SPORTS_CACHE_TTL_FIXTURES ?? '21600', 10);
const CACHE_TTL_STANDINGS= parseInt(process.env.SPORTS_CACHE_TTL_STANDINGS ?? '3600',  10);
const CACHE_TTL_NEWS     = parseInt(process.env.SPORTS_CACHE_TTL_NEWS     ?? '1800',  10);
const CURRENT_SEASON     = process.env.SPORTS_SEASON ?? new Date().getFullYear().toString();

class SportsDataSyncService {
  /** @param {import('@prisma/client').PrismaClient} prisma  sports_db client */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Live Scores ───────────────────────────────────────────────────────────

  /**
   * Poll live scores from ApiFootball and update sports_db matches.
   * Emits Socket.IO "score:update" for every changed match.
   *
   * Called every 60s by the cron job (only fires on match days).
   */
  async syncLiveScores() {
    const cacheKey = 'sports:live:all';
    try {
      // Respect cache — prevent hammering the API more than once per poll window
      const cached = await cache.get(cacheKey);
      if (cached) return { skipped: true, source: 'cache' };

      const registry = ServiceRegistry.getInstance();
      const svc = registry.getService('APIFOOTBALL', ServiceType.SPORTS_LIVE);
      if (!svc) {
        logger.warn('[SportsSync] APIFOOTBALL/SPORTS_LIVE service not available');
        return { error: 'service_unavailable' };
      }

      const fixtures = await svc.call({ action: 'all' });
      await cache.set(cacheKey, fixtures, CACHE_TTL_LIVE);

      let updated = 0;
      const io = getIo?.();

      for (const f of fixtures) {
        const externalId = String(f.fixture.id);
        const match = await this.prisma.match.findFirst({
          where: { OR: [{ externalId }, { externalApiId: externalId }] },
        }).catch(() => null);

        if (!match) continue;

        const homeScore = f.goals.home  ?? match.homeScore;
        const awayScore = f.goals.away  ?? match.awayScore;
        const halfHome  = f.score.halftime.home ?? match.halfHome;
        const halfAway  = f.score.halftime.away ?? match.halfAway;
        const status    = this._mapStatus(f.fixture.status.short);
        const elapsed   = f.fixture.status.elapsed;

        // Only write if something changed
        if (
          match.homeScore === homeScore &&
          match.awayScore === awayScore &&
          match.status   === status
        ) continue;

        await this.prisma.match.update({
          where: { id: match.id },
          data:  { homeScore, awayScore, halfHome, halfAway, status, updatedAt: new Date() },
        });

        // Record live score snapshot
        await this.prisma.liveScore.create({
          data: { matchId: match.id, homeScore, awayScore, event: `${elapsed ?? 0}'` },
        }).catch(() => {/* ignore duplicate */});

        // Push to Socket.IO
        if (io) {
          io.to(`match:${match.id}`).emit('score:update', {
            matchId: match.id,
            homeScore,
            awayScore,
            halfHome,
            halfAway,
            status,
            elapsed,
          });
        }

        updated++;
      }

      logger.info(`[SportsSync] live scores: ${fixtures.length} live, ${updated} updated`);
      await this._logSync('APIFOOTBALL', 'live_scores', 'success', `updated ${updated}`);
      return { live: fixtures.length, updated };
    } catch (err) {
      logger.error(`[SportsSync] syncLiveScores error: ${err.message}`);
      await this._logSync('APIFOOTBALL', 'live_scores', 'failed', err.message);
      throw err;
    }
  }

  // ── Fixtures ──────────────────────────────────────────────────────────────

  /**
   * Sync today's + tomorrow's fixtures from ApiFootball into sports_db.
   * Upserts based on externalApiId (f.fixture.id).
   */
  async syncFixtures(daysAhead = 1) {
    const registry = ServiceRegistry.getInstance();
    const svc      = registry.getService('APIFOOTBALL', ServiceType.SPORTS_FIXTURES);
    if (!svc) return { error: 'service_unavailable' };

    const leagues = getTrackedLeagues();
    let created = 0, updated = 0;

    for (let d = 0; d <= daysAhead; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().slice(0, 10);

      const cacheKey = `sports:fixtures:${dateStr}`;
      let fixtures = await cache.get(cacheKey);
      if (!fixtures) {
        fixtures = await svc.call({ action: 'byDate', date: dateStr });
        await cache.set(cacheKey, fixtures, CACHE_TTL_FIXTURES);
      }

      for (const f of fixtures) {
        if (!leagues.includes(f.league.id)) continue;

        // Ensure league exists
        const league = await this._upsertLeague(f.league);

        // Ensure teams exist
        const [homeTeam, awayTeam] = await Promise.all([
          this._upsertTeam(f.teams.home, league.id),
          this._upsertTeam(f.teams.away, league.id),
        ]);

        // Upsert match
        const externalId = String(f.fixture.id);
        const existing = await this.prisma.match.findFirst({
          where: { externalApiId: externalId },
        }).catch(() => null);

        const data = {
          leagueId:    league.id,
          homeTeamId:  homeTeam.id,
          awayTeamId:  awayTeam.id,
          startTime:   new Date(f.fixture.date),
          status:      this._mapStatus(f.fixture.status.short),
          homeScore:   f.goals.home  ?? null,
          awayScore:   f.goals.away  ?? null,
          halfHome:    f.score.halftime.home ?? null,
          halfAway:    f.score.halftime.away ?? null,
          round:       f.league.round ?? null,
          season:      String(f.league.season),
          externalApiId: externalId,
        };

        if (existing) {
          await this.prisma.match.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await this.prisma.match.create({ data });
          created++;
        }
      }
    }

    logger.info(`[SportsSync] fixtures: created=${created} updated=${updated}`);
    await this._logSync('APIFOOTBALL', 'fixtures', 'success', `created ${created}, updated ${updated}`);
    return { created, updated };
  }

  // ── Standings ─────────────────────────────────────────────────────────────

  async syncStandings() {
    const registry = ServiceRegistry.getInstance();
    const svc      = registry.getService('APIFOOTBALL', ServiceType.SPORTS_STANDINGS);
    if (!svc) return { error: 'service_unavailable' };

    const leagues = getTrackedLeagues();
    let synced = 0;

    for (const leagueId of leagues) {
      const cacheKey = `sports:standings:${leagueId}:${CURRENT_SEASON}`;
      let tables = await cache.get(cacheKey);
      if (!tables) {
        tables = await svc.call({ leagueId, season: CURRENT_SEASON });
        await cache.set(cacheKey, tables, CACHE_TTL_STANDINGS);
      }

      for (const group of tables) {
        for (const entry of group) {
          // Find league in sports_db by externalApiLeagueId or by name
          const league = await this.prisma.league.findFirst({
            where: { OR: [{ externalApiId: String(leagueId) }, { name: { contains: entry.team?.name ?? '' } }] },
          }).catch(() => null);
          if (!league) continue;

          const team = await this.prisma.team.findFirst({
            where: { externalApiId: String(entry.team.id) },
          }).catch(() => null);
          if (!team) continue;

          await this.prisma.standing.upsert({
            where:  { leagueId_teamId_season: { leagueId: league.id, teamId: team.id, season: CURRENT_SEASON } },
            update: {
              rank:         entry.rank,
              played:       entry.all.played,
              wins:         entry.all.win,
              draws:        entry.all.draw,
              losses:       entry.all.lose,
              goalsFor:     entry.all.goals.for,
              goalsAgainst: entry.all.goals.against,
              goalDiff:     entry.goalsDiff,
              points:       entry.points,
              form:         entry.form ?? null,
            },
            create: {
              leagueId:    league.id,
              teamId:      team.id,
              season:      CURRENT_SEASON,
              rank:        entry.rank,
              played:      entry.all.played,
              wins:        entry.all.win,
              draws:       entry.all.draw,
              losses:      entry.all.lose,
              goalsFor:    entry.all.goals.for,
              goalsAgainst:entry.all.goals.against,
              goalDiff:    entry.goalsDiff,
              points:      entry.points,
              form:        entry.form ?? null,
            },
          });
          synced++;
        }
      }
    }

    logger.info(`[SportsSync] standings: ${synced} rows synced`);
    await this._logSync('APIFOOTBALL', 'standings', 'success', `${synced} rows`);
    return { synced };
  }

  // ── News ──────────────────────────────────────────────────────────────────

  async syncNews(lang = 'vi', max = 10) {
    const registry = ServiceRegistry.getInstance();
    const svc      = registry.getService('GNEWS', ServiceType.SPORTS_NEWS);
    if (!svc) return { error: 'service_unavailable' };

    const cacheKey = `sports:news:${lang}`;
    const cached   = await cache.get(cacheKey);
    if (cached) return { skipped: true, source: 'cache' };

    const articles = await svc.call({ action: 'headlines', lang, max, topic: 'sports' });
    await cache.set(cacheKey, articles, CACHE_TTL_NEWS);

    let created = 0;
    for (const art of articles) {
      const slug = art.title.toLowerCase().replace(/\s+/g, '-').slice(0, 180).replace(/[^\w-]/g, '');
      const existing = await this.prisma.news.findFirst({ where: { slug } }).catch(() => null);
      if (existing) continue;

      await this.prisma.news.create({
        data: {
          title:       art.title,
          slug,
          content:     art.content || art.description || '',
          summary:     art.description ?? null,
          image:       art.image       ?? null,
          category:    'news',
          status:      'published',
          publishedAt: new Date(art.publishedAt),
        },
      }).catch(() => {/* slug conflict — skip */});
      created++;
    }

    logger.info(`[SportsSync] news: ${created} new articles`);
    await this._logSync('GNEWS', 'news', 'success', `${created} new`);
    return { fetched: articles.length, created };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  async _upsertLeague(l) {
    const extId = String(l.id);
    const slug  = l.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return this.prisma.league.upsert({
      where:  { externalApiId: extId },
      update: { name: l.name, logo: l.logo ?? null },
      create: { externalApiId: extId, name: l.name, slug: `${slug}-${extId}`, logo: l.logo ?? null, country: l.country ?? null, type: 'national' },
    }).catch(async () =>
      this.prisma.league.findFirst({ where: { externalApiId: extId } }),
    );
  }

  async _upsertTeam(t, leagueId) {
    const extId = String(t.id);
    const slug  = t.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return this.prisma.team.upsert({
      where:  { externalApiId: extId },
      update: { name: t.name, logo: t.logo ?? null },
      create: { externalApiId: extId, leagueId, name: t.name, slug: `${slug}-${extId}`, logo: t.logo ?? null },
    }).catch(async () =>
      this.prisma.team.findFirst({ where: { externalApiId: extId } }),
    );
  }

  _mapStatus(short) {
    const map = {
      NS: 'scheduled', TBD: 'scheduled',
      '1H': 'live', HT: 'halftime', '2H': 'live', ET: 'live', BT: 'live', P: 'live', INT: 'live',
      FT: 'finished', AET: 'finished', PEN: 'finished',
      SUSP: 'postponed', PST: 'postponed', CANC: 'cancelled', ABD: 'cancelled',
      AWD: 'finished', WO: 'finished',
    };
    return map[short] ?? 'scheduled';
  }

  async _logSync(provider, syncType, status, message) {
    await this.prisma.sportsDataSyncLog.create({
      data: { provider, syncType, status, message, startedAt: new Date(), endedAt: new Date() },
    }).catch(() => {/* swallow log errors */});
  }
}

module.exports = SportsDataSyncService;
