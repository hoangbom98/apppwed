// src/third-parties/providers/ApiFootball/services/FixtureService.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET /fixtures — match schedule for a given date / league / season.
// Used by the sports cron job and the /api/sports/matches endpoint.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }          from '../../../core/BaseService';
import { ServiceType }          from '../../../core/interfaces';
import { ApiFootballProvider }  from '../ApiFootballProvider';

export interface FixturePayload {
  action:   'byDate' | 'byLeague' | 'byId';
  date?:    string;          // 'YYYY-MM-DD'
  leagueId?: number | string;
  season?:  number | string; // e.g. 2025
  fixtureId?: number | string;
  next?:    number;          // next N fixtures
  last?:    number;          // last N fixtures
}

export interface ApiFootballFixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league:  { id: number; name: string; country: string; logo: string; season: number; round: string };
  teams:   { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
  goals:   { home: number | null; away: number | null };
  score:   { halftime: { home: number | null; away: number | null } };
}

export class FixtureService extends BaseService {
  constructor(private readonly provider: ApiFootballProvider) {
    super(ServiceType.SPORTS_FIXTURES, 'API-Football Fixtures', 'APIFOOTBALL');
  }

  async call(payload: unknown, _prisma?: unknown): Promise<unknown> {
    const p = payload as FixturePayload;
    switch (p.action) {
      case 'byDate':   return this.getByDate(p.date!, p.leagueId, p.season);
      case 'byLeague': return this.getByLeague(p.leagueId!, p.season!, p.next, p.last);
      case 'byId':     return this.getById(p.fixtureId!);
      default:         throw new Error(`FixtureService: unknown action "${p.action}"`);
    }
  }

  /** Get all fixtures for a calendar date (optionally filtered by league). */
  async getByDate(
    date:      string,
    leagueId?: number | string,
    season?:   number | string,
  ): Promise<ApiFootballFixture[]> {
    const params: Record<string, unknown> = { date };
    if (leagueId) params['league'] = leagueId;
    if (season)   params['season'] = season;
    const res = await this.provider.callApi<{ response: ApiFootballFixture[] }>({
      method: 'GET', url: '/fixtures', params,
    });
    return res.response ?? [];
  }

  /** Get upcoming or recent fixtures for a league/season. */
  async getByLeague(
    leagueId: number | string,
    season:   number | string,
    next?:    number,
    last?:    number,
  ): Promise<ApiFootballFixture[]> {
    const params: Record<string, unknown> = { league: leagueId, season };
    if (next) params['next'] = next;
    if (last) params['last'] = last;
    const res = await this.provider.callApi<{ response: ApiFootballFixture[] }>({
      method: 'GET', url: '/fixtures', params,
    });
    return res.response ?? [];
  }

  /** Get a single fixture by ID. */
  async getById(fixtureId: number | string): Promise<ApiFootballFixture | null> {
    const res = await this.provider.callApi<{ response: ApiFootballFixture[] }>({
      method: 'GET', url: '/fixtures', params: { id: fixtureId },
    });
    return res.response?.[0] ?? null;
  }
}
