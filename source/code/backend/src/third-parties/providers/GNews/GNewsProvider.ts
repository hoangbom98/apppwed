// src/third-parties/providers/GNews/GNewsProvider.ts
// ─────────────────────────────────────────────────────────────────────────────
// GNews API — sports news aggregation (free: 100 req/day, 10 articles/req).
// Vietnamese language supported: ?lang=vi
//
// Docs: https://gnews.io/docs/
// Base: https://gnews.io/api/v4
// ─────────────────────────────────────────────────────────────────────────────

import { BaseProvider }  from '../../core/BaseProvider';
import { ServiceType, IAggregatorConfig } from '../../core/interfaces';
import { NewsService }   from './services/NewsService';

export class GNewsProvider extends BaseProvider {
  constructor(cfg: IAggregatorConfig) {
    super('GNEWS', cfg, ['sports', '*']);
  }

  protected registerServices(): void {
    this.services.set(ServiceType.SPORTS_NEWS, new NewsService(this));
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Quick status check using minimal quota
      await this.callApi({
        method: 'GET', url: '/top-headlines',
        params: { topic: 'sports', max: 1, apikey: this.credential.apiKey, lang: 'vi' },
      });
      return true;
    } catch {
      return false;
    }
  }
}
