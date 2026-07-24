// src/third-parties/providers/ApiFootball/ApiFootballProvider.ts
// ─────────────────────────────────────────────────────────────────────────────
// API-Football v3 (via RapidAPI) — the primary sports data source.
//
// Covers: fixtures, live scores, standings, match stats, lineups, events,
//         teams, players, odds predictions.
//
// Free tier: 100 req/day — use Redis caching aggressively.
// Host:      api-football-v1.p.rapidapi.com
// Docs:      https://www.api-football.com/documentation-v3
//
// Scope: sports module (and any other module needing sports data).
// ─────────────────────────────────────────────────────────────────────────────

import { BaseProvider }   from '../../core/BaseProvider';
import { ServiceType, IAggregatorConfig } from '../../core/interfaces';
import { FixtureService }  from './services/FixtureService';
import { LiveScoreService } from './services/LiveScoreService';
import { StandingService } from './services/StandingService';
import { MatchStatsService } from './services/MatchStatsService';

export class ApiFootballProvider extends BaseProvider {
  readonly apiHost: string;

  constructor(cfg: IAggregatorConfig) {
    super('APIFOOTBALL', cfg, ['sports', '*']);
    // RapidAPI requires X-RapidAPI-Host in addition to X-RapidAPI-Key
    this.apiHost = (cfg.config as Record<string, string> | null)?.apiHost
      ?? 'api-football-v1.p.rapidapi.com';
    this.httpClient.defaults.headers.common['X-RapidAPI-Key']  = cfg.apiKey;
    this.httpClient.defaults.headers.common['X-RapidAPI-Host'] = this.apiHost;
  }

  protected registerServices(): void {
    this.services.set(ServiceType.SPORTS_FIXTURES,  new FixtureService(this));
    this.services.set(ServiceType.SPORTS_LIVE,       new LiveScoreService(this));
    this.services.set(ServiceType.SPORTS_STANDINGS,  new StandingService(this));
    this.services.set(ServiceType.SPORTS_STATS,      new MatchStatsService(this));
  }

  // ── Health check override ─────────────────────────────────────────────────
  async healthCheck(): Promise<boolean> {
    try {
      // Use /status endpoint which is free and counts as 0 toward quota
      const res = await this.callApi<{ errors: unknown[] }>({
        method: 'GET',
        url:    '/status',
      });
      return Array.isArray(res.errors) && res.errors.length === 0;
    } catch {
      return false;
    }
  }
}
