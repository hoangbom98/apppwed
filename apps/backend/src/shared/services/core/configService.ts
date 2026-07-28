// @ts-nocheck
/**
 * ConfigService — shared service for reading/writing ProjectConfig (admin_db).
 *
 * Data model: ProjectConfig { projectCode, module, group, key, value (Json), type, ... }
 * Unique constraint: (projectCode, module, group, key)
 *
 * Hierarchy of cache keys:
 *   config:<projectCode>:<module>:<group>:<key>   – single value    (TTL 5 min)
 *   config:<projectCode>:<module>                 – module map      (TTL 5 min)
 *   config:project:<projectCode>[:<group>]        – public flat map (TTL 10 min)
 *
 * NOTE: Uses the shared redis singleton (src/config/redis) instead of creating
 * a dedicated ioredis client, so the process only maintains one Redis connection.
 */
const redis  = require('../../../config/redis');
const logger = require('./logger');

// ── Cache TTLs (seconds) ──────────────────────────────────────────────────────
const TTL_SINGLE  = 300;   // 5 min — individual key
const TTL_MODULE  = 300;   // 5 min — entire module map
const TTL_PROJECT = 600;   // 10 min — public flat map

class ConfigService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma – admin_db client
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // READ — single value
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get one config value.
   * @param {string} projectCode
   * @param {string} module
   * @param {string} group
   * @param {string} key
   * @param {*}      defaultValue  – returned when key is missing
   * @returns {Promise<*>}
   */
  async get(projectCode, module, group, key, defaultValue = null) {
    const cacheKey = `config:${projectCode}:${module}:${group}:${key}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null) return JSON.parse(cached);

      const record = await this.prisma.projectConfig.findFirst({
        where: { projectCode, module, group, key, status: 'active' },
      });
      const value = record !== null ? record.value : defaultValue;
      await redis.set(cacheKey, JSON.stringify(value), 'EX', TTL_SINGLE);
      return value;
    } catch (err) {
      logger.error(`[ConfigService] get(${projectCode}/${module}/${group}/${key}): ${err.message}`);
      return defaultValue;
    }
  }

  /**
   * Convenience: boolean feature flag.
   * Resolves the value via get() and coerces to bool.
   * @param {string}  projectCode
   * @param {string}  module
   * @param {string}  group
   * @param {string}  key
   * @param {boolean} defaultValue
   */
  async isEnabled(projectCode, module, group, key, defaultValue = true) {
    const value = await this.get(projectCode, module, group, key, defaultValue);
    if (value === null || value === undefined) return defaultValue;
    return value !== false && value !== 'false' && value !== 0 && value !== '0';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // READ — whole module / project
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Return all active rows for a module as a nested { group: { key: value } } map.
   * @param {string} projectCode
   * @param {string} module
   * @returns {Promise<Record<string, Record<string, *>>>}
   */
  async getModule(projectCode, module) {
    const cacheKey = `config:${projectCode}:${module}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null) return JSON.parse(cached);

      const rows = await this.prisma.projectConfig.findMany({
        where: { projectCode, module, status: 'active' },
      });
      const result = {};
      rows.forEach(r => {
        if (!result[r.group]) result[r.group] = {};
        result[r.group][r.key] = r.value;
      });
      await redis.set(cacheKey, JSON.stringify(result), 'EX', TTL_MODULE);
      return result;
    } catch (err) {
      logger.error(`[ConfigService] getModule(${projectCode}/${module}): ${err.message}`);
      return {};
    }
  }

  /**
   * Return all active non-secret rows for a project as a flat { key: value } map.
   * Optionally filtered by group.
   * Used by public /config API routes on each sub-project.
   * @param {string}      projectCode
   * @param {string|null} group  – optional filter
   * @returns {Promise<Record<string, *>>}
   */
  async getProjectConfigs(projectCode, group = null) {
    const cacheKey = `config:project:${projectCode}${group ? `:${group}` : ''}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null) return JSON.parse(cached);

      const where = { projectCode, status: 'active', isSecret: false };
      if (group) where.group = group;

      const rows = await this.prisma.projectConfig.findMany({
        where,
        select: { key: true, value: true },
        orderBy: [{ module: 'asc' }, { group: 'asc' }, { key: 'asc' }],
      });
      const result = {};
      rows.forEach(r => { result[r.key] = r.value; });
      await redis.set(cacheKey, JSON.stringify(result), 'EX', TTL_PROJECT);
      return result;
    } catch (err) {
      logger.error(`[ConfigService] getProjectConfigs(${projectCode}): ${err.message}`);
      return {};
    }
  }

  /**
   * Return all active rows for a project (with full metadata).
   * Used by admin dashboard.
   * @param {string}      projectCode
   * @param {string|null} module
   * @param {string|null} group
   * @returns {Promise<Array>}
   */
  async getProjectConfigsFull(projectCode, module = null, group = null) {
    try {
      const where = { projectCode, status: 'active' };
      if (module) where.module = module;
      if (group)  where.group  = group;
      return await this.prisma.projectConfig.findMany({
        where,
        orderBy: [{ module: 'asc' }, { group: 'asc' }, { key: 'asc' }],
      });
    } catch (err) {
      logger.error(`[ConfigService] getProjectConfigsFull(${projectCode}): ${err.message}`);
      return [];
    }
  }

  /**
   * Return all active rows for a project as a nested module→group→key map.
   * Secrets are hidden. Used by gameConfigController.getByProject.
   * @param {string} projectCode
   * @returns {Promise<Record<string, Record<string, Record<string, *>>>>}
   */
  async getProjectConfigMap(projectCode) {
    const rows = await this.getProjectConfigsFull(projectCode);
    return rows.reduce((acc, r) => {
      if (!acc[r.module])              acc[r.module]          = {};
      if (!acc[r.module][r.group])     acc[r.module][r.group] = {};
      acc[r.module][r.group][r.key]    = r.isSecret ? '[hidden]' : r.value;
      return acc;
    }, {});
  }

  // ══════════════════════════════════════════════════════════════════════════
  // READ — domain-specific helpers (payment)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Return full deposit config for a project.
   * Shape: { enabled, methods, minAmount, maxAmount, requireKYC, message }
   * @param {string} projectCode
   */
  async getDepositConfig(projectCode) {
    const g = await this.getModule(projectCode, 'payment');
    const d = g.deposit || {};
    return {
      enabled:    d.enabled    !== undefined ? Boolean(d.enabled)    : true,
      methods:    Array.isArray(d.methods)   ? d.methods             : [],
      minAmount:  Number(d.minAmount  ?? 0),
      maxAmount:  Number(d.maxAmount  ?? 999_000_000),
      requireKYC: d.requireKYC !== undefined ? Boolean(d.requireKYC) : false,
      message:    d.message    || null,
    };
  }

  /**
   * Return full withdraw config for a project.
   * Shape: { enabled, methods, minAmount, maxAmount, requireKYC, message }
   * @param {string} projectCode
   */
  async getWithdrawConfig(projectCode) {
    const g = await this.getModule(projectCode, 'payment');
    const w = g.withdraw || {};
    return {
      enabled:    w.enabled    !== undefined ? Boolean(w.enabled)    : true,
      methods:    Array.isArray(w.methods)   ? w.methods             : [],
      minAmount:  Number(w.minAmount  ?? 0),
      maxAmount:  Number(w.maxAmount  ?? 999_000_000),
      requireKYC: w.requireKYC !== undefined ? Boolean(w.requireKYC) : false,
      message:    w.message    || null,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WRITE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Upsert a single config value.
   */
  async set(projectCode, module, group, key, value) {
    try {
      await this.prisma.projectConfig.upsert({
        where:  { projectCode_module_group_key: { projectCode, module, group, key } },
        update: { value, updatedAt: new Date() },
        create: { projectCode, module, group, key, value, type: 'json' },
      });
      await this._bustSingle(projectCode, module, group, key);
    } catch (err) {
      logger.error(`[ConfigService] set(${projectCode}/${module}/${group}/${key}): ${err.message}`);
      throw err;
    }
  }

  /**
   * Bulk upsert config entries for a project.
   * @param {string} projectCode
   * @param {Array<{module,group,key,value,type?,description?,options?,isSecret?}>} updates
   */
  async bulkSet(projectCode, updates) {
    for (const item of updates) {
      const { module, group, key, value, type, description, options, isSecret } = item;
      await this.prisma.projectConfig.upsert({
        where:  { projectCode_module_group_key: { projectCode, module, group, key } },
        update: {
          value,
          updatedAt: new Date(),
          ...(type        !== undefined && { type }),
          ...(description !== undefined && { description }),
          ...(options     !== undefined && { options }),
          ...(isSecret    !== undefined && { isSecret }),
        },
        create: {
          projectCode,
          module,
          group,
          key,
          value,
          type:        type        ?? 'string',
          description: description ?? null,
          options:     options     ?? null,
          isSecret:    isSecret    ?? false,
          status:      'active',
        },
      });
    }
    await this.clearCache(projectCode);
    logger.info(`[ConfigService] bulkSet ${updates.length} keys for project=${projectCode}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // READ — domain-specific helpers (feature flags & maintenance)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Check if a specific feature flag is enabled for a project.
   * Reads from module='feature', group='feature', key=featureKey.
   *
   * @param {string}  projectCode
   * @param {string}  featureKey   – e.g. 'registration_enabled', 'live_streaming_enabled'
   * @param {boolean} [defaultValue=true]
   * @returns {Promise<boolean>}
   */
  async isFeatureEnabled(projectCode, featureKey, defaultValue = true) {
    return this.isEnabled(projectCode, 'feature', 'feature', featureKey, defaultValue);
  }

  /**
   * Check if a project is in maintenance mode.
   * Returns { mode: boolean, message: string|null }.
   *
   * @param {string} projectCode
   * @returns {Promise<{ mode: boolean, message: string|null }>}
   */
  async getMaintenance(projectCode) {
    const featureModule = await this.getModule(projectCode, 'feature');
    const f = featureModule.feature || {};
    const mode    = f.maintenance_mode !== undefined
      ? (f.maintenance_mode === true || f.maintenance_mode === 'true')
      : false;
    const message = f.maintenance_message ?? null;
    return { mode, message };
  }

  /**
   * Return site branding config for a project.
   * Shape: { site_name, site_slogan, logo_url, favicon_url, copyright_text,
   *           primary_color, secondary_color, accent_color }
   *
   * @param {string} projectCode
   */
  async getBrandConfig(projectCode) {
    const g = await this.getModule(projectCode, 'general');
    return {
      ...(g.brand  || {}),
      ...(g.colors || {}),
    };
  }

  /**
   * Return social / contact config for a project.
   * Shape: { facebook_url, telegram_url, zalo_url, youtube_url, hotline, support_email }
   *
   * @param {string} projectCode
   */
  async getSocialConfig(projectCode) {
    const g = await this.getModule(projectCode, 'social');
    return g.social || {};
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CACHE
  // ══════════════════════════════════════════════════════════════════════════

  /** Delete every cache key that belongs to projectCode. */
  async clearCache(projectCode) {
    try {
      const keys = await redis.keys(`config:${projectCode}:*`);
      const projectKeys = await redis.keys(`config:project:${projectCode}*`);
      const all = [...keys, ...projectKeys];
      if (all.length) await redis.del(all);
    } catch (err) {
      logger.error(`[ConfigService] clearCache(${projectCode}): ${err.message}`);
    }
  }

  /** Delete cache for one specific key. */
  async _bustSingle(projectCode, module, group, key) {
    try {
      await redis.del(
        `config:${projectCode}:${module}:${group}:${key}`,
        `config:${projectCode}:${module}`,
      );
      const projectKeys = await redis.keys(`config:project:${projectCode}*`);
      if (projectKeys.length) await redis.del(projectKeys);
    } catch (err) {
      logger.error(`[ConfigService] _bustSingle: ${err.message}`);
    }
  }
}

module.exports = ConfigService;
