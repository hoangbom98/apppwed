// src/third-parties/providers/TheSportsDB/TheSportsDBProvider.ts
// ─────────────────────────────────────────────────────────────────────────────
// TheSportsDB — free, unlimited static media & data.
// Free API key = "3"  (production key requires $5/mo Patreon pledge).
//
// Best used for: team logos, league badges, player photos, stadium images.
// NOT suitable for live data — use ApiFootball for that.
//
// Docs: https://www.thesportsdb.com/api.php
// Base: https://www.thesportsdb.com/api/v1/json/{apikey}/
// ─────────────────────────────────────────────────────────────────────────────

import { BaseProvider }  from '../../core/BaseProvider';
import { ServiceType, IAggregatorConfig } from '../../core/interfaces';
import { MediaService }  from './services/MediaService';

export class TheSportsDBProvider extends BaseProvider {
  constructor(cfg: IAggregatorConfig) {
    super('THESPORTSDB', cfg, ['sports', '*']);
    // The free API key is literally "3"; paid keys go in apiKey field
    const apiKey = cfg.apiKey || '3';
    // Override baseURL to embed the api key in the path
    const base = cfg.baseUrl?.replace(/\/$/, '') ?? 'https://www.thesportsdb.com';
    this.httpClient.defaults.baseURL = `${base}/api/v1/json/${apiKey}`;
  }

  protected registerServices(): void {
    this.services.set(ServiceType.SPORTS_MEDIA, new MediaService(this));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.callApi({ method: 'GET', url: '/all_sports.php' });
      return true;
    } catch {
      return false;
    }
  }
}
