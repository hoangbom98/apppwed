// @ts-nocheck
/**
 * whiteLabelService.ts — Engine 16: White Label / Multi-Tenant Engine
 *
 * Enables each sub-project to have its own branding, domain, and feature set.
 * A "tenant" is a branded instance of a sub-project (e.g. different game sites
 * using the same backend but different logos, colors, and feature flags).
 *
 * Tenant resolution priority:
 *  1. X-Tenant-ID header (API clients)
 *  2. Hostname subdomain matching (e.g. brand1.game.com → tenant 'brand1')
 *  3. Default tenant for the project
 *
 * Tenant config is stored in admin_db.ProjectConfig under:
 *   projectCode=<tenantCode> module='brand' group='colors|logo|social|feature'
 *
 * USAGE
 * ─────
 *   const wl = new WhiteLabelService(adminPrisma);
 *
 *   // Resolve tenant from request
 *   const tenant = await wl.resolveTenant(req);
 *
 *   // Get branding config for a tenant
 *   const brand = await wl.getBrand('brand1');
 *
 *   // Check feature flag per tenant
 *   const enabled = await wl.isFeatureEnabled('brand1', 'live_betting');
 *
 *   // Apply to middleware (sets req.tenant)
 *   app.use(wl.middleware());
 */

'use strict';

const logger = require('./logger');
const cache  = require('./cacheService');

// Known subdomain → tenant mapping (also loaded from DB at startup)
const DOMAIN_MAP_TTL = 300; // 5 min cache

class WhiteLabelService {
  private adminPrisma: any;
  private ConfigService: any;

  constructor(adminPrisma: any) {
    this.adminPrisma  = adminPrisma;
    this.ConfigService = require('./configService');
  }

  // ── Tenant resolution ────────────────────────────────────────────────────

  /**
   * Resolve which tenant is making the request.
   * Returns the tenant code (e.g. 'game', 'game_brand2') or null if unknown.
   */
  async resolveTenant(req: any): Promise<string | null> {
    // 1. Explicit header (for internal tools, mobile apps)
    const headerTenant = req.headers['x-tenant-id'];
    if (headerTenant) return String(headerTenant);

    // 2. Hostname-based resolution
    const host = req.hostname || req.headers.host || '';
    const tenantFromHost = await this._getTenantByDomain(host);
    if (tenantFromHost) return tenantFromHost;

    // 3. Default: use req.project (set by projectResolver)
    return req.project ?? null;
  }

  private async _getTenantByDomain(domain: string): Promise<string | null> {
    const cacheKey = `wl:domain:${domain}`;
    return cache.remember(cacheKey, DOMAIN_MAP_TTL, async () => {
      try {
        const config = await this.adminPrisma.systemConfig.findFirst({
          where: { key: `domain.tenant.${domain}` },
          select: { value: true },
        });
        return config?.value ?? null;
      } catch { return null; }
    });
  }

  // ── Brand config ─────────────────────────────────────────────────────────

  /**
   * Get full branding config for a tenant.
   * Returns: { siteName, logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, ... }
   */
  async getBrand(tenantCode: string): Promise<Record<string, any>> {
    const cacheKey = `wl:brand:${tenantCode}`;
    return cache.remember(cacheKey, 600, async () => {
      const configSvc = new this.ConfigService(this.adminPrisma);
      const [brand, colors, social, contact] = await Promise.all([
        configSvc.getModule(tenantCode, 'general').then((m: any) => m.brand   || {}),
        configSvc.getModule(tenantCode, 'general').then((m: any) => m.colors  || {}),
        configSvc.getModule(tenantCode, 'social').then((m: any)  => m.social  || {}),
        configSvc.getModule(tenantCode, 'general').then((m: any) => m.contact || {}),
      ]);
      return { ...brand, ...colors, social, contact, tenantCode };
    });
  }

  /**
   * Update branding for a tenant (admin action).
   * @param tenantCode  e.g. 'game'
   * @param brandData   { siteName, logoUrl, primaryColor, ... }
   */
  async updateBrand(tenantCode: string, brandData: Record<string, any>): Promise<void> {
    const configSvc = new this.ConfigService(this.adminPrisma);
    const updates = Object.entries(brandData).map(([key, value]) => ({
      module: 'general',
      group:  key.includes('color') ? 'colors' : 'brand',
      key,
      value,
    }));
    await configSvc.bulkSet(tenantCode, updates);
    await cache.del(`wl:brand:${tenantCode}`);
    logger.info(`[WhiteLabel] Brand updated for tenant=${tenantCode}`);
  }

  // ── Feature flags per tenant ──────────────────────────────────────────────

  /**
   * Check if a feature is enabled for a specific tenant.
   * Falls back to the base project config if tenant-specific config not found.
   */
  async isFeatureEnabled(tenantCode: string, featureKey: string, defaultValue = true): Promise<boolean> {
    const cacheKey = `wl:feature:${tenantCode}:${featureKey}`;
    return cache.remember(cacheKey, 300, async () => {
      const configSvc = new this.ConfigService(this.adminPrisma);
      return configSvc.isFeatureEnabled(tenantCode, featureKey, defaultValue);
    });
  }

  // ── Express middleware ────────────────────────────────────────────────────

  /**
   * Returns Express middleware that resolves and attaches req.tenant + req.brand.
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const tenantCode = await this.resolveTenant(req);
        req.tenant = tenantCode;
        if (tenantCode) {
          req.brand = await this.getBrand(tenantCode);
        }
      } catch (err: any) {
        logger.warn(`[WhiteLabel] middleware error: ${err.message}`);
      }
      next();
    };
  }

  // ── Tenant listing ────────────────────────────────────────────────────────

  /**
   * Get all registered tenant codes.
   */
  async getAllTenants(): Promise<string[]> {
    return cache.remember('wl:tenants:all', 300, async () => {
      try {
        const projects = await this.adminPrisma.project.findMany({
          where:  { status: 'active' },
          select: { code: true },
        });
        return projects.map((p: any) => p.code);
      } catch { return []; }
    });
  }
}

module.exports = WhiteLabelService;
