// src/third-parties/core/interfaces.ts

export enum ServiceType {
  GAME_API = 'GAME_API',
  TURNKEY = 'TURNKEY',
  WHITE_LABEL = 'WHITE_LABEL',
  SELF_SERVICE = 'SELF_SERVICE',
  LIVE_STREAM = 'LIVE_STREAM',
  SPORTS_SOLUTIONS = 'SPORTS_SOLUTIONS',
  SPORTS_SCHEDULE = 'SPORTS_SCHEDULE',
  SPORTS_NEWS = 'SPORTS_NEWS',
  DEMO = 'DEMO',
  PRICE_FEED = 'PRICE_FEED',
  WALLET = 'WALLET',
  RTP_ADJUSTABLE = 'RTP_ADJUSTABLE',
}

export interface IProviderConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ICredential {
  apiKey?: string;
  secretKey?: string;
  token?: string;
}

export interface IService {
  readonly type: ServiceType;
  readonly name: string;
  readonly providerName: string;
  call(payload: any, context?: any): Promise<any>;
}

export interface IProvider {
  readonly name: string;
  getServices(): Promise<IService[]>;
  getService(type: ServiceType): IService | undefined;
  configure(config: IProviderConfig): void;
  setCredential(cred: ICredential): void;
  healthCheck(): Promise<boolean>;
}
