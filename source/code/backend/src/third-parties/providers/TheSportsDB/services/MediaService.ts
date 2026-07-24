// src/third-parties/providers/TheSportsDB/services/MediaService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Static data: team logos, league badges, player photos, stadium images.
// All responses are cached for 24h since this data rarely changes.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }          from '../../../core/BaseService';
import { ServiceType }          from '../../../core/interfaces';
import { TheSportsDBProvider }  from '../TheSportsDBProvider';

export type MediaPayload =
  | { action: 'searchTeam';   name: string }
  | { action: 'lookupTeam';   id: string | number }
  | { action: 'lookupLeague'; id: string | number }
  | { action: 'searchPlayer'; name: string }
  | { action: 'allLeagues' }
  | { action: 'leaguesByCountry'; country: string }
  | { action: 'pastEvents';  leagueId: string | number };

export class MediaService extends BaseService {
  constructor(private readonly provider: TheSportsDBProvider) {
    super(ServiceType.SPORTS_MEDIA, 'TheSportsDB Media', 'THESPORTSDB');
  }

  async call(payload: unknown, _prisma?: unknown): Promise<unknown> {
    const p = payload as MediaPayload;
    switch (p.action) {
      case 'searchTeam':
        return this.provider.callApi({ method: 'GET', url: '/searchteams.php', params: { t: p.name } })
          .then((r: unknown) => (r as Record<string, unknown>)['teams'] ?? []);

      case 'lookupTeam':
        return this.provider.callApi({ method: 'GET', url: '/lookupteam.php', params: { id: p.id } })
          .then((r: unknown) => (r as Record<string, unknown>)['teams']?.[0] ?? null);

      case 'lookupLeague':
        return this.provider.callApi({ method: 'GET', url: '/lookupleague.php', params: { id: p.id } })
          .then((r: unknown) => (r as Record<string, unknown>)['leagues']?.[0] ?? null);

      case 'searchPlayer':
        return this.provider.callApi({ method: 'GET', url: '/searchplayers.php', params: { p: p.name } })
          .then((r: unknown) => (r as Record<string, unknown>)['player'] ?? []);

      case 'allLeagues':
        return this.provider.callApi({ method: 'GET', url: '/all_leagues.php' })
          .then((r: unknown) => (r as Record<string, unknown>)['leagues'] ?? []);

      case 'leaguesByCountry':
        return this.provider.callApi({ method: 'GET', url: '/search_all_leagues.php', params: { c: p.country } })
          .then((r: unknown) => (r as Record<string, unknown>)['countrys'] ?? []);

      case 'pastEvents':
        return this.provider.callApi({ method: 'GET', url: '/eventspastleague.php', params: { id: p.leagueId } })
          .then((r: unknown) => (r as Record<string, unknown>)['events'] ?? []);

      default:
        throw new Error(`MediaService: unknown action "${(p as Record<string, unknown>)['action']}"`);
    }
  }
}
