// src/third-parties/core/BaseProvider.ts
// ─────────────────────────────────────────────────────────────────────────────
// Abstract base class for every third-party provider.
//
// Shared design: one master credential set in game_db.gameAggregator is used
// by both game and sports (and any other sub-project that needs this provider).
// The calling module passes its own Prisma client only when wallet callbacks
// are needed — the provider itself never hardcodes a specific project DB.
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  IProvider,
  IProviderConfig,
  ICredential,
  IService,
  ServiceType,
  ProjectScope,
  IAggregatorConfig,
} from './interfaces';
import { logger } from '../../shared/services/logger';

export abstract class BaseProvider implements IProvider {
  protected httpClient:  AxiosInstance;
  protected config:      IProviderConfig;
  protected credential:  ICredential = {};
  protected services:    Map<ServiceType, IService> = new Map();

  readonly scopes: ProjectScope[];

  constructor(
    public readonly name: string,
    aggregatorCfg: IAggregatorConfig,
    scopes: ProjectScope[] = ['game', 'sports'],
  ) {
    this.scopes = scopes;

    this.config = {
      baseUrl:  aggregatorCfg.baseUrl,
      timeout:  30_000,
      retries:  3,
      ...(aggregatorCfg.config as IProviderConfig | null ?? {}),
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    });

    // Bootstrap credentials straight from the aggregator config row.
    this.setCredential({
      apiKey:    aggregatorCfg.apiKey,
      secretKey: aggregatorCfg.secretKey,
      hashKey:   (aggregatorCfg.config as Record<string, string> | null)?.hashKey,
    });

    // Let each subclass register its own services.
    this.registerServices();
  }

  // ── Abstract ──────────────────────────────────────────────────────────────

  /** Each concrete provider registers its IService instances here. */
  protected abstract registerServices(): void;

  // ── IProvider implementation ──────────────────────────────────────────────

  getService(type: ServiceType): IService | undefined {
    return this.services.get(type);
  }

  getServices(): Promise<IService[]> {
    return Promise.resolve([...this.services.values()]);
  }

  configure(config: IProviderConfig): void {
    this.config = { ...this.config, ...config };
    if (config.baseUrl) this.httpClient.defaults.baseURL = config.baseUrl;
    if (config.timeout) this.httpClient.defaults.timeout = config.timeout;
  }

  setCredential(cred: ICredential): void {
    // Merge — don't replace — so provider-level headers survive partial updates.
    this.credential = { ...this.credential, ...cred };
    if (cred.apiKey) {
      this.httpClient.defaults.headers.common['X-API-Key'] = cred.apiKey;
    }
    if (cred.token) {
      this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${cred.token}`;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.httpClient.get('/health', { timeout: 5_000 });
      return res.status === 200;
    } catch (err: unknown) {
      logger.warn(`[${this.name}] health check failed: ${(err as Error).message}`);
      return false;
    }
  }

  // ── Protected helpers ─────────────────────────────────────────────────────

  /**
   * Make an HTTP call with automatic retry + exponential back-off.
   * Does NOT touch a Prisma client — purely HTTP.
   */
  async callApi<T>(config: AxiosRequestConfig): Promise<T> {
    const start      = Date.now();
    const maxRetries = (this.config.retries as number) || 3;
    let   lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await this.httpClient.request<T>(config);
        logger.info(
          `[${this.name}] ${config.method?.toUpperCase()} ${config.url} → ${res.status} (${Date.now() - start}ms)`,
        );
        return res.data;
      } catch (err: unknown) {
        lastError = err as Error;
        logger.error(
          `[${this.name}] attempt ${attempt}/${maxRetries} failed: ${lastError.message}`,
        );
        if (attempt < maxRetries) {
          await delay(attempt * 1_000); // 1 s, 2 s, …
        }
      }
    }
    throw lastError;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
