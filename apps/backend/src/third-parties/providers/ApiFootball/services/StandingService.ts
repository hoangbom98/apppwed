// src/third-parties/providers/ApiFootball/services/StandingService.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET /standings — league tables.
// Cached for 1 hour in Redis; synced once daily by cron.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }         from '../../../core/BaseService';
import { ServiceType }         from '../../../core/interfaces';
import { ApiFootballProvider } from '../ApiFootballProvider';

export interface StandingPayload {
  leagueId: number | string;
  season:   number | string;
  teamId?:  number | string;
}

export interface ApiFootballStanding {
  rank:        number;
  team:        { id: number; name: string; logo: string };
  points:      number;
  goalsDiff:   number;
  group:       string;
  form:        string;
  status:      string;
  description: string;
  all:         { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

export class StandingService extends BaseService {
  constructor(private readonly provider: ApiFootballProvider) {
    super(ServiceType.SPORTS_STANDINGS, 'API-Football Standings', 'APIFOOTBALL');
  }

  async call(payload: unknown, _prisma?: unknown): Promise<unknown> {
    const p = payload as StandingPayload;
    return this.getStandings(p.leagueId, p.season, p.teamId);
  }

  async getStandings(
    leagueId: number | string,
    season:   number | string,
    teamId?:  number | string,
  ): Promise<ApiFootballStanding[][]> {
    const params: Record<string, unknown> = { league: leagueId, season };
    if (teamId) params['team'] = teamId;

    const res = await this.provider.callApi<{
      response: Array<{ league: { standings: ApiFootballStanding[][] } }>
    }>({ method: 'GET', url: '/standings', params });

    return res.response?.[0]?.league?.standings ?? [];
  }
}
