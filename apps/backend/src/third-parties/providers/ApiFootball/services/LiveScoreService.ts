// src/third-parties/providers/ApiFootball/services/LiveScoreService.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET /fixtures?live=all — real-time scores for all currently live matches.
// Polled by the cron job every 60s during match windows.
// Results are written to sports_db via SportsDataSyncService.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }         from '../../../core/BaseService';
import { ServiceType }         from '../../../core/interfaces';
import { ApiFootballProvider } from '../ApiFootballProvider';
import type { ApiFootballFixture } from './FixtureService';

export interface LiveScorePayload {
  action:      'all' | 'byLeague' | 'byFixtures';
  leagueId?:   number | string;
  fixtureIds?: (number | string)[];
}

export class LiveScoreService extends BaseService {
  constructor(private readonly provider: ApiFootballProvider) {
    super(ServiceType.SPORTS_LIVE, 'API-Football Live Scores', 'APIFOOTBALL');
  }

  async call(payload: unknown, _prisma?: unknown): Promise<unknown> {
    const p = payload as LiveScorePayload;
    switch (p.action) {
      case 'all':        return this.getAllLive();
      case 'byLeague':   return this.getLiveByLeague(p.leagueId!);
      case 'byFixtures': return this.getLiveByFixtures(p.fixtureIds!);
      default:           throw new Error(`LiveScoreService: unknown action "${p.action}"`);
    }
  }

  /** Fetch ALL currently live fixtures across every league. */
  async getAllLive(): Promise<ApiFootballFixture[]> {
    const res = await this.provider.callApi<{ response: ApiFootballFixture[] }>({
      method: 'GET', url: '/fixtures', params: { live: 'all' },
    });
    return res.response ?? [];
  }

  /** Fetch live fixtures for a specific league only (saves quota). */
  async getLiveByLeague(leagueId: number | string): Promise<ApiFootballFixture[]> {
    const res = await this.provider.callApi<{ response: ApiFootballFixture[] }>({
      method: 'GET', url: '/fixtures', params: { live: String(leagueId) },
    });
    return res.response ?? [];
  }

  /** Fetch specific fixture IDs (up to 20 at a time, pipe-separated). */
  async getLiveByFixtures(fixtureIds: (number | string)[]): Promise<ApiFootballFixture[]> {
    const ids = fixtureIds.slice(0, 20).join('-');
    const res = await this.provider.callApi<{ response: ApiFootballFixture[] }>({
      method: 'GET', url: '/fixtures', params: { ids },
    });
    return res.response ?? [];
  }
}
