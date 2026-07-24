// src/third-parties/sports/gnews/services/NewsService.ts
import { BaseService } from '../../core/BaseService';
import { ServiceType } from '../../core/interfaces';
import { GNewsProvider } from '../GNewsProvider';

export class NewsService extends BaseService {
  constructor(private provider: GNewsProvider) {
    super(ServiceType.SPORTS_NEWS, 'GNews Sports News', 'GNEWS');
  }

  async call(payload: any): Promise<any> {
    return this.provider['callApi']({
      method: 'GET',
      url: '/top-headlines',
      params: { 
        topic: 'sports', 
        lang: 'vi',
        ...payload 
      },
    });
  }
}
