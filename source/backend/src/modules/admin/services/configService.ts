// @ts-nocheck
'use strict';
/**
 * Admin Config Service
 *
 * Wraps ProjectConfig CRUD with Redis cache invalidation.
 * Used by uiConfigController.js via req.configService (injected in middleware).
 */
const cache  = require('../../shared/services/cacheService');
const logger = require('../../shared/services/logger');

const CACHE_TTL = 300; // 5 min
const cacheKey  = (project) => `ui_config:${project}`;

class ConfigService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma – admin DB
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  /**
   * Return all config rows for a project (with optional module/group filter).
   * Results are cached per-project.
   */
  async getProjectConfigsFull(project, module = null, group = null) {
    const key = cacheKey(project);
    const cached = await cache.get(key).catch(() => null);
    let rows;

    if (cached) {
      rows = JSON.parse(cached);
    } else {
      rows = await this.prisma.projectConfig.findMany({
        where:   { projectCode: project, status: 'active' },
        orderBy: [{ module: 'asc' }, { group: 'asc' }, { key: 'asc' }],
      });
      await cache.set(key, JSON.stringify(rows), CACHE_TTL).catch(() => {});
    }

    if (module) rows = rows.filter((r) => r.module === module);
    if (group)  rows = rows.filter((r) => r.group === group);
    return rows;
  }

  /**
   * Return a nested module→group→key map for a project (used by gameConfigController).
   * Secrets are hidden.
   */
  async getProjectConfigMap(project) {
    const rows = await this.getProjectConfigsFull(project);
    return rows.reduce((acc, r) => {
      if (!acc[r.module])              acc[r.module]          = {};
      if (!acc[r.module][r.group])     acc[r.module][r.group] = {};
      acc[r.module][r.group][r.key]    = r.isSecret ? '[hidden]' : r.value;
      return acc;
    }, {});
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Bulk upsert config entries for a project.
   * @param {string} project
   * @param {Array<{module,group,key,value,type?,description?}>} updates
   */
  async bulkSet(project, updates) {
    for (const item of updates) {
      const { module, group, key, value, type, description, options, isSecret } = item;
      await this.prisma.projectConfig.upsert({
        where: { projectCode_module_group_key: { projectCode: project, module, group, key } },
        create: {
          projectCode: project,
          module,
          group,
          key,
          value:       String(value ?? ''),
          type:        type        ?? 'string',
          description: description ?? null,
          options:     options     ?? null,
          isSecret:    isSecret    ?? false,
          status:      'active',
        },
        update: {
          value:       String(value ?? ''),
          ...(type        !== undefined && { type }),
          ...(description !== undefined && { description }),
          ...(options     !== undefined && { options }),
          ...(isSecret    !== undefined && { isSecret }),
          updatedAt: new Date(),
        },
      });
    }
    await this.clearCache(project);
    logger.info(`[ConfigService] Bulk set ${updates.length} keys for project=${project}`);
  }

  /**
   * Invalidate the cache for a project.
   */
  async clearCache(project) {
    await cache.del(cacheKey(project)).catch(() => {});
  }
}

module.exports = ConfigService;
