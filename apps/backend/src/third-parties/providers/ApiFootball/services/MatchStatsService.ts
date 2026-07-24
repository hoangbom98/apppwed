// src/third-parties/providers/ApiFootball/services/MatchStatsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET /fixtures/statistics  — possession, shots, corners, cards, etc.
// GET /fixtures/events      — goals, substitutions, VAR events per minute.
// GET /fixtures/lineups     — starting XI + bench for each team.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }         from '../../../core/BaseService';
import { ServiceType }         from '../../../core/interfaces';
import { ApiFootballProvider } from '../ApiFootballProvider';

export type MatchStatsPayload =
  | { action: 'statistics'; fixtureId: number | string; teamId?: number | string }
  | { action: 'events';     fixtureId: number | string; teamId?: number | string; type?: string }
  | { action: 'lineups';    fixtureId: number | string; teamId?: number | string }
  | { action: 'players';    fixtureId: number | string; teamId?: number | string };

export class MatchStatsService extends BaseService {
  constructor(private readonly provider: ApiFootballProvider) {
    super(ServiceType.SPORTS_STATS, 'API-Football Match Stats', 'APIFOOTBALL');
  }

  async call(payload: unknown, _prisma?: unknown): Promise<unknown> {
    const p = payload as MatchStatsPayload;
    const params: Record<string, unknown> = { fixture: p.fixtureId };
    if ('teamId' in p && p.teamId) params['team'] = p.teamId;

    switch (p.action) {
      case 'statistics':
        return this.provider.callApi({ method: 'GET', url: '/fixtures/statistics', params }).then((r: unknown) => (r as { response: unknown }).response ?? []);

      case 'events':
        if ('type' in p && p.type) params['type'] = p.type;
        return this.provider.callApi({ method: 'GET', url: '/fixtures/events', params }).then((r: unknown) => (r as { response: unknown }).response ?? []);

      case 'lineups':
        return this.provider.callApi({ method: 'GET', url: '/fixtures/lineups', params }).then((r: unknown) => (r as { response: unknown }).response ?? []);

      case 'players':
        return this.provider.callApi({ method: 'GET', url: '/fixtures/players', params }).then((r: unknown) => (r as { response: unknown }).response ?? []);

      default:
        throw new Error(`MatchStatsService: unknown action "${(p as Record<string, unknown>)['action']}"`);
    }
  }
}
