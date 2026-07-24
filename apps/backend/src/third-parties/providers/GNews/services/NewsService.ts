// src/third-parties/providers/GNews/services/NewsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sports news aggregation via GNews API.
// Fetched every 30 min by cron; articles are upserted into sports_db.News.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }    from '../../../core/BaseService';
import { ServiceType }    from '../../../core/interfaces';
import { GNewsProvider }  from '../GNewsProvider';

export interface GNewsPayload {
  action:   'headlines' | 'search';
  query?:   string;
  lang?:    string;          // 'vi' | 'en' | 'zh' — default 'vi'
  max?:     number;          // articles per page, max 10 on free tier
  topic?:   'sports' | 'general';
  from?:    string;          // ISO date
  to?:      string;
}

export interface GNewsArticle {
  title:       string;
  description: string;
  content:     string;
  url:         string;
  image:        string | null;
  publishedAt:  string;
  source:       { name: string; url: string };
}

export class NewsService extends BaseService {
  constructor(private readonly provider: GNewsProvider) {
    super(ServiceType.SPORTS_NEWS, 'GNews Sports', 'GNEWS');
  }

  async call(payload: unknown, _prisma?: unknown): Promise<unknown> {
    const p = payload as GNewsPayload;
    return p.action === 'search'
      ? this.searchNews(p)
      : this.getHeadlines(p);
  }

  /** Top sports headlines (vi by default). */
  async getHeadlines(opts: GNewsPayload = { action: 'headlines' }): Promise<GNewsArticle[]> {
    const res = await this.provider.callApi<{ articles: GNewsArticle[] }>({
      method: 'GET',
      url:    '/top-headlines',
      params: {
        topic:  opts.topic  ?? 'sports',
        lang:   opts.lang   ?? 'vi',
        max:    opts.max    ?? 10,
        apikey: this.provider['credential'].apiKey,
        ...(opts.from ? { from: opts.from } : {}),
        ...(opts.to   ? { to:   opts.to }   : {}),
      },
    });
    return res.articles ?? [];
  }

  /** Search news by keyword (e.g. team name, tournament). */
  async searchNews(opts: GNewsPayload): Promise<GNewsArticle[]> {
    if (!opts.query) throw new Error('NewsService/search: query is required');
    const res = await this.provider.callApi<{ articles: GNewsArticle[] }>({
      method: 'GET',
      url:    '/search',
      params: {
        q:      opts.query,
        lang:   opts.lang   ?? 'vi',
        max:    opts.max    ?? 10,
        apikey: this.provider['credential'].apiKey,
        ...(opts.from ? { from: opts.from } : {}),
        ...(opts.to   ? { to:   opts.to }   : {}),
      },
    });
    return res.articles ?? [];
  }
}
