// @ts-nocheck
/**
 * core/marketing/ab-testing.service.ts
 *
 * A/B testing engine — deterministic bucket assignment based on userId hash.
 * Experiments are defined in admin_db (or in-memory for lightweight use).
 *
 * Deterministic assignment: given the same userId + experimentKey, the same
 * variant is always returned. No state is required per-user.
 *
 * Usage:
 *   const { ABTestingService } = require('../../core/marketing/ab-testing.service');
 *   const svc = new ABTestingService(adminPrisma, 'game');
 *   const variant = await svc.getVariant(userId, 'onboarding_flow');
 *   // variant: 'A' | 'B' | 'C' | null (if experiment not found / inactive)
 */
'use strict';

const crypto       = require('crypto');
const logger       = require('../../shared/services/logger');
const cacheService = require('../../shared/services/cacheService');

class ABTestingService {
  /**
   * @param {object} adminPrisma  – admin_db Prisma client
   * @param {string} projectCode
   */
  constructor(adminPrisma, projectCode) {
    this.prisma      = adminPrisma;
    this.projectCode = projectCode;
  }

  /**
   * Get the variant (A/B/C…) assigned to a user for an experiment.
   * Returns null if the experiment doesn't exist or is inactive.
   *
   * @param {string} userId
   * @param {string} experimentKey  – e.g. 'onboarding_flow', 'promo_banner_v2'
   * @returns {Promise<string|null>}
   */
  async getVariant(userId, experimentKey) {
    const experiment = await this._loadExperiment(experimentKey);
    if (!experiment || !experiment.isActive) return null;

    const bucket = this._hashToBucket(userId, experimentKey, experiment.variants.length);
    const variant = experiment.variants[bucket];

    // Track exposure (fire-and-forget)
    this._trackExposure(userId, experiment.id, variant).catch(() => {});

    return variant;
  }

  /**
   * Check if a specific variant is active for the user.
   * Convenience wrapper around getVariant().
   * @param {string} userId
   * @param {string} experimentKey
   * @param {string} variantName
   */
  async isVariant(userId, experimentKey, variantName) {
    const v = await this.getVariant(userId, experimentKey);
    return v === variantName;
  }

  /**
   * Admin: create or update an experiment.
   * @param {object} data
   * @param {string}   data.key       – unique key, e.g. 'checkout_cta'
   * @param {string}   data.name      – human-readable name
   * @param {string[]} data.variants  – e.g. ['A', 'B'] or ['control', 'treatment']
   * @param {boolean}  [data.isActive=true]
   */
  async upsertExperiment(data) {
    return this.prisma.abExperiment.upsert({
      where:  { key_project: { key: data.key, project: this.projectCode } },
      update: {
        name:     data.name,
        variants: data.variants,
        isActive: data.isActive !== false,
        updatedAt: new Date(),
      },
      create: {
        key:      data.key,
        project:  this.projectCode,
        name:     data.name,
        variants: data.variants || ['A', 'B'],
        isActive: data.isActive !== false,
      },
    });
  }

  /**
   * Get exposure counts per variant for an experiment.
   * @param {string} experimentKey
   */
  async getExposureStats(experimentKey) {
    const experiment = await this._loadExperiment(experimentKey);
    if (!experiment) return null;

    const rows = await this.prisma.abExposure.groupBy({
      by:    ['variant'],
      where: { experimentId: experiment.id },
      _count: { userId: true },
    });

    return {
      experiment: { key: experiment.key, name: experiment.name },
      variants: rows.map(r => ({ variant: r.variant, count: r._count.userId })),
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  async _loadExperiment(key) {
    const cacheKey = `ab:${this.projectCode}:${key}`;
    return cacheService.remember(cacheKey, 300, async () => {
      return this.prisma.abExperiment.findFirst({
        where: { key, project: this.projectCode },
      });
    });
  }

  /**
   * Deterministic hash of (userId + experimentKey) → bucket index.
   * @param {string} userId
   * @param {string} key
   * @param {number} numVariants
   * @returns {number}
   */
  _hashToBucket(userId, key, numVariants) {
    const hash  = crypto.createHash('sha256').update(`${userId}:${key}`).digest('hex');
    const value = parseInt(hash.slice(0, 8), 16);
    return value % numVariants;
  }

  async _trackExposure(userId, experimentId, variant) {
    await this.prisma.abExposure.upsert({
      where:  { userId_experimentId: { userId, experimentId } },
      create: { userId, experimentId, variant },
      update: {},  // idempotent — first exposure wins
    });
  }
}

module.exports = { ABTestingService };
