// src/third-parties/core/ServiceRegistry.ts
// ─────────────────────────────────────────────────────────────────────────────
// Singleton registry that:
//   1. Reads active aggregator configs from game_db.gameAggregator at startup.
//   2. Builds one concrete provider instance per code.
//   3. Exposes typed lookup helpers for controllers.
//
// MULTI-PROJECT DESIGN
// ─────────────────────────────────────────────────────────────────────────────
// Credentials live in a single place: game_db.gameAggregator.
// Each provider instance is shared across all sub-projects (game, sports, …).
// The ONLY thing that changes per sub-project is the Prisma client injected
// into wallet-callback calls (balance / bet / win).
//
// Usage in a controller:
//   const registry = ServiceRegistry.getInstance();
//   await registry.ensureLoaded();                // idempotent
//   const svc = registry.getService('GOLDGATE', ServiceType.GAME_API);
//   const url  = await svc.call({ gameCode, userId }, req.prisma);
// ─────────────────────────────────────────────────────────────────────────────

import { IProvider, IService, ServiceType, ProjectScope, IAggregatorConfig } from './interfaces';
import { GoldgateProvider }      from '../providers/Goldgate/GoldgateProvider';
import { GSCProvider }           from '../providers/GSC/GSCProvider';
import { TCGamingProvider }      from '../providers/TCGaming/TCGamingProvider';
import { BinanceProvider }       from '../providers/Binance/BinanceProvider';
import { ApiFootballProvider }   from '../providers/ApiFootball/ApiFootballProvider';
import { TheSportsDBProvider }   from '../providers/TheSportsDB/TheSportsDBProvider';
import { GNewsProvider }         from '../providers/GNews/GNewsProvider';
import { logger }                from '../../shared/services/core/logger';
import { getPrismaClient }       from '../../config/databases';

// ── Provider constructor type ─────────────────────────────────────────────────

type ProviderCtor = new (cfg: IAggregatorConfig) => IProvider;

/**
 * Map aggregator code → concrete provider class.
 * Add new providers here; no other file needs to change.
 *
 * Codes must match game_db.gameAggregator.code values.
 *
 * Sports data providers bootstrap from env vars (not game_db) because they
 * are public APIs — not game aggregators. They are registered separately
 * in bootstrapSportsProviders() below, called alongside ensureLoaded().
 */
const PROVIDER_MAP: Record<string, ProviderCtor> = {
  // Game aggregators (credentials in game_db.gameAggregator)
  GSC:          GSCProvider,
  GOLDGATE:     GoldgateProvider,
  TCGAMING:     TCGamingProvider,
  BINANCE:      BinanceProvider,
  // Sports data providers — also in game_db.gameAggregator OR bootstrapped via env
  APIFOOTBALL:  ApiFootballProvider,
  THESPORTSDB:  TheSportsDBProvider,
  GNEWS:        GNewsProvider,
};

// ── Registry ──────────────────────────────────────────────────────────────────

export class ServiceRegistry {
  private static _instance: ServiceRegistry | null = null;

  private providers: Map<string, IProvider>   = new Map();
  private loaded    = false;
  private loading   = false;

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry._instance) {
      ServiceRegistry._instance = new ServiceRegistry();
    }
    return ServiceRegistry._instance;
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  /**
   * Load all active aggregator rows from game_db and build provider instances.
   * Call once at app startup (e.g. in app.ts after DB is ready).
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  async ensureLoaded(): Promise<void> {
    if (this.loaded || this.loading) return;
    this.loading = true;

    try {
      const gamePrisma = getPrismaClient('game') as { gameAggregator: { findMany: Function } };
      const rows: IAggregatorConfig[] = await gamePrisma.gameAggregator.findMany({
        where: { status: 'active' },
      });

      for (const row of rows) {
        const code  = row.code.toUpperCase();
        const Ctor  = PROVIDER_MAP[code];
        if (!Ctor) {
          logger.warn(`[ServiceRegistry] no provider class for aggregator code "${code}" — skipped`);
          continue;
        }
        const instance = new Ctor(row);
        this.providers.set(code, instance);
        logger.info(`[ServiceRegistry] provider loaded: ${code} (${row.name})`);
      }

      this.loaded  = true;
      this.loading = false;
    } catch (err: unknown) {
      this.loading = false;
      logger.error(`[ServiceRegistry] failed to load providers: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Reload a single provider (e.g. after admin updates its credentials).
   * @param code  'GSC' | 'GOLDGATE' | 'TCGAMING' | 'BINANCE' | …
   */
  async reloadProvider(code: string): Promise<void> {
    const upperCode  = code.toUpperCase();
    const Ctor       = PROVIDER_MAP[upperCode];
    if (!Ctor) throw new Error(`Unknown provider code: ${upperCode}`);

    const gamePrisma = getPrismaClient('game') as { gameAggregator: { findFirst: Function } };
    const row: IAggregatorConfig | null = await gamePrisma.gameAggregator.findFirst({
      where: { code: upperCode, status: 'active' },
    });
    if (!row) throw new Error(`Aggregator "${upperCode}" not found or inactive`);

    this.providers.set(upperCode, new Ctor(row));
    logger.info(`[ServiceRegistry] provider reloaded: ${upperCode}`);
  }

  // ── Lookup helpers ────────────────────────────────────────────────────────

  /** Get a provider by its aggregator code. */
  getProvider(code: string): IProvider | undefined {
    return this.providers.get(code.toUpperCase());
  }

  /**
   * Get a specific service from a named provider.
   * Returns undefined if provider doesn't exist or doesn't offer that service.
   */
  getService(providerCode: string, serviceType: ServiceType): IService | undefined {
    return this.getProvider(providerCode)?.getService(serviceType);
  }

  /**
   * List all providers that offer a given service type,
   * optionally filtered by project scope.
   */
  getProvidersByService(
    serviceType: ServiceType,
    scope?: ProjectScope,
  ): IProvider[] {
    const result: IProvider[] = [];
    for (const provider of this.providers.values()) {
      if (!provider.getService(serviceType)) continue;
      if (scope && scope !== '*') {
        const scopes = provider.scopes ?? [];
        if (!scopes.includes(scope) && !scopes.includes('*')) continue;
      }
      result.push(provider);
    }
    return result;
  }

  /** List all registered provider codes. */
  getProviderCodes(): string[] {
    return [...this.providers.keys()];
  }

  /**
   * Register a provider manually — useful for testing or runtime overrides.
   */
  registerProvider(code: string, provider: IProvider): void {
    this.providers.set(code.toUpperCase(), provider);
  }

  /**
   * Bootstrap sports public-API providers from environment variables.
   * Called alongside ensureLoaded() at startup. Safe to call multiple times.
   *
   * Why env vars instead of game_db?
   *   Sports public APIs (API-Football, TheSportsDB, GNews) are free accounts —
   *   their credentials go in .env, not in game_db.gameAggregator which is meant
   *   for game aggregators. Admin can still add them to game_db to override.
   */
  bootstrapSportsProviders(): void {
    // API-Football (via RapidAPI)
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (rapidApiKey && !this.providers.has('APIFOOTBALL')) {
      const afCfg: IAggregatorConfig = {
        id: 'env-apifootball', code: 'APIFOOTBALL', name: 'API-Football',
        baseUrl:   process.env.API_FOOTBALL_BASE_URL ?? 'https://api-football-v1.p.rapidapi.com/v3',
        apiKey:    rapidApiKey,
        secretKey: '',
        status:    'active',
        config:    { apiHost: process.env.API_FOOTBALL_HOST ?? 'api-football-v1.p.rapidapi.com' },
      };
      this.providers.set('APIFOOTBALL', new ApiFootballProvider(afCfg));
      logger.info('[ServiceRegistry] API-Football provider bootstrapped from env');
    }

    // TheSportsDB (free key = "3")
    if (!this.providers.has('THESPORTSDB')) {
      const sdbKey = process.env.THESPORTSDB_API_KEY ?? '3';
      const sdbCfg: IAggregatorConfig = {
        id: 'env-thesportsdb', code: 'THESPORTSDB', name: 'TheSportsDB',
        baseUrl:   process.env.THESPORTSDB_BASE_URL ?? 'https://www.thesportsdb.com',
        apiKey:    sdbKey,
        secretKey: '',
        status:    'active',
        config:    {},
      };
      this.providers.set('THESPORTSDB', new TheSportsDBProvider(sdbCfg));
      logger.info('[ServiceRegistry] TheSportsDB provider bootstrapped from env');
    }

    // GNews (sports news)
    const gnewsKey = process.env.GNEWS_API_KEY;
    if (gnewsKey && !this.providers.has('GNEWS')) {
      const gnCfg: IAggregatorConfig = {
        id: 'env-gnews', code: 'GNEWS', name: 'GNews',
        baseUrl:   'https://gnews.io/api/v4',
        apiKey:    gnewsKey,
        secretKey: '',
        status:    'active',
        config:    {},
      };
      this.providers.set('GNEWS', new GNewsProvider(gnCfg));
      logger.info('[ServiceRegistry] GNews provider bootstrapped from env');
    }
  }
}
