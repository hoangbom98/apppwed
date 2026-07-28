// src/third-parties/managers/ConnectionManager.ts
// ─────────────────────────────────────────────────────────────────────────────
// Manages provider health, failover, and best-provider selection.
//
// Failover logic:
//   1. Try the preferred provider (if specified).
//   2. If it fails or is unhealthy, cycle through other providers that offer
//      the same service type and project scope.
//   3. Throw only if ALL candidates fail.
// ─────────────────────────────────────────────────────────────────────────────

import { ServiceRegistry } from '../core/ServiceRegistry';
import { IProvider, ServiceType, ProjectScope } from '../core/interfaces';
import { logger } from '../../shared/services/core/logger';

/** Health cache entry */
interface HealthEntry {
  healthy:     boolean;
  checkedAt:   number;   // ms timestamp
}

const HEALTH_TTL_MS = 60_000; // 1 minute

export class ConnectionManager {
  private static _instance: ConnectionManager | null = null;

  private healthCache: Map<string, HealthEntry> = new Map();

  static getInstance(): ConnectionManager {
    if (!ConnectionManager._instance) {
      ConnectionManager._instance = new ConnectionManager();
    }
    return ConnectionManager._instance;
  }

  // ── Health check ─────────────────────────────────────────────────────────

  /**
   * Check (and cache) whether a provider is healthy.
   * Cached result is reused for HEALTH_TTL_MS.
   */
  async checkHealth(provider: IProvider): Promise<boolean> {
    const cached = this.healthCache.get(provider.name);
    if (cached && Date.now() - cached.checkedAt < HEALTH_TTL_MS) {
      return cached.healthy;
    }

    const healthy = await provider.healthCheck().catch(() => false);
    this.healthCache.set(provider.name, { healthy, checkedAt: Date.now() });
    return healthy;
  }

  /** Invalidate the health cache entry for a given provider. */
  invalidate(providerName: string): void {
    this.healthCache.delete(providerName.toUpperCase());
  }

  // ── Provider selection ───────────────────────────────────────────────────

  /**
   * Return the first healthy provider that offers the given service type
   * and is in scope for the given project.
   *
   * @param serviceType     The IService type needed.
   * @param scope           The calling sub-project ('game', 'sports', …).
   * @param preferred       Optional preferred provider code (tried first).
   */
  async getBestProvider(
    serviceType: ServiceType,
    scope?: ProjectScope,
    preferred?: string,
  ): Promise<IProvider | null> {
    const registry   = ServiceRegistry.getInstance();
    let   candidates = registry.getProvidersByService(serviceType, scope);

    // Put preferred first
    if (preferred) {
      const upper = preferred.toUpperCase();
      candidates = [
        ...candidates.filter((p) => p.name === upper),
        ...candidates.filter((p) => p.name !== upper),
      ];
    }

    for (const provider of candidates) {
      if (await this.checkHealth(provider)) return provider;
    }

    return null;
  }

  // ── Failover call ─────────────────────────────────────────────────────────

  /**
   * Execute a service call with automatic failover.
   * Tries the preferred provider first; falls back to other healthy providers
   * that offer the same service type in the given scope.
   *
   * @param serviceType  Service to call.
   * @param payload      Payload to pass to IService.call().
   * @param prisma       Calling module's Prisma client (for wallet callbacks).
   * @param scope        Sub-project scope for provider selection.
   * @param preferred    Preferred provider code.
   */
  async callWithFallback(opts: {
    serviceType: ServiceType;
    payload:     unknown;
    prisma?:     unknown;
    scope?:      ProjectScope;
    preferred?:  string;
  }): Promise<unknown> {
    const { serviceType, payload, prisma, scope, preferred } = opts;
    const registry   = ServiceRegistry.getInstance();
    let   candidates = registry.getProvidersByService(serviceType, scope);

    if (preferred) {
      const upper = preferred.toUpperCase();
      candidates = [
        ...candidates.filter((p) => p.name === upper),
        ...candidates.filter((p) => p.name !== upper),
      ];
    }

    const errors: string[] = [];

    for (const provider of candidates) {
      const svc = provider.getService(serviceType);
      if (!svc) continue;

      try {
        const result = await svc.call(payload, prisma);
        if (provider.name !== preferred?.toUpperCase()) {
          logger.warn(`[Failover] used ${provider.name} instead of ${preferred}`);
        }
        return result;
      } catch (err: unknown) {
        const msg = (err as Error).message;
        errors.push(`${provider.name}: ${msg}`);
        logger.warn(`[Failover] ${provider.name} failed: ${msg} — trying next`);
        // Mark unhealthy so health cache is invalidated
        this.healthCache.set(provider.name, { healthy: false, checkedAt: Date.now() });
      }
    }

    throw new Error(
      `All providers failed for service "${serviceType}" [scope=${scope}].\n${errors.join('\n')}`,
    );
  }
}
