// src/third-parties/core/interfaces.ts

export enum ServiceType {
  GAME_API          = 'GAME_API',
  TURNKEY           = 'TURNKEY',
  WHITE_LABEL       = 'WHITE_LABEL',
  SELF_SERVICE      = 'SELF_SERVICE',
  LIVE_STREAM       = 'LIVE_STREAM',
  SPORTS_SOLUTIONS  = 'SPORTS_SOLUTIONS',
  SPORTS_SCHEDULE   = 'SPORTS_SCHEDULE',
  SPORTS_NEWS       = 'SPORTS_NEWS',
  SPORTS_FIXTURES   = 'SPORTS_FIXTURES',
  SPORTS_LIVE       = 'SPORTS_LIVE',
  SPORTS_STANDINGS  = 'SPORTS_STANDINGS',
  SPORTS_STATS      = 'SPORTS_STATS',
  SPORTS_MEDIA      = 'SPORTS_MEDIA',
  DEMO              = 'DEMO',
  PRICE_FEED        = 'PRICE_FEED',
  WALLET            = 'WALLET',
  RTP_ADJUSTABLE    = 'RTP_ADJUSTABLE',
}

/** Project scope — which sub-project(s) a provider serves. */
export type ProjectScope = 'game' | 'sports' | 'trade' | 'hub' | 'dating' | 'admin' | '*';

/** Raw aggregator config row as stored in game_db.gameAggregator. */
export interface IAggregatorConfig {
  id:        string | number;
  code:      string;
  name:      string;
  baseUrl:   string;
  apiKey:    string;
  secretKey: string;
  status:    string;
  config?:   Record<string, unknown> | null;
  scopes?:   ProjectScope[];
}

export interface IProviderConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ICredential {
  apiKey?:    string;
  secretKey?: string;
  token?:     string;
  hashKey?:   string;
}

export interface IService {
  readonly type: ServiceType;
  readonly name: string;
  readonly providerName: string;
  call(payload: any, context?: any): Promise<any>;
}

export interface IProvider {
  readonly name: string;
  readonly scopes: ProjectScope[];
  getServices(): Promise<IService[]>;
  getService(type: ServiceType): IService | undefined;
  configure(config: IProviderConfig): void;
  setCredential(cred: ICredential): void;
  healthCheck(): Promise<boolean>;
}
