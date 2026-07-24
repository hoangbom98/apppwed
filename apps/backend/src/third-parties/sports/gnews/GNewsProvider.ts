// src/third-parties/sports/gnews/GNewsProvider.ts
import { BaseProvider }  from '../../core/BaseProvider';
import { ServiceType, IProviderConfig, ICredential } from '../../core/interfaces';
import { NewsService }   from './services/NewsService';

export class GNewsProvider extends BaseProvider {
  constructor(cfg?: IProviderConfig, cred?: ICredential) {
    super('GNEWS', cfg, cred);
  }

  protected registerServices(): void {
    this.services.set(ServiceType.SPORTS_NEWS, new NewsService(this));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.callApi({
        method: 'GET', url: '/top-headlines',
        params: { topic: 'sports', max: 1, lang: 'vi' },
      });
      return true;
    } catch {
      return false;
    }
  }
}
