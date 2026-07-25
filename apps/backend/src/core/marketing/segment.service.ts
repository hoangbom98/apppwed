// @ts-nocheck
/**
 * core/marketing/segment.service.ts
 *
 * User segmentation engine — returns user IDs matching a named segment.
 * Segments are evaluated lazily against the project's Prisma client.
 *
 * Supported segment names (extend as needed):
 *   all_users | new_users | active_users | inactive_users |
 *   vip_users | high_value | first_deposit_pending | deposited_once
 *
 * Usage:
 *   const { SegmentService } = require('../../core/marketing/segment.service');
 *   const svc = new SegmentService(prisma, 'game');
 *   const ids = await svc.getUserIds(['active_users', 'vip_users']);
 */
'use strict';

const DAY = 24 * 60 * 60 * 1000;

class SegmentService {
  /**
   * @param {object} prisma      – project Prisma client
   * @param {string} projectCode
   */
  constructor(prisma, projectCode) {
    this.prisma      = prisma;
    this.projectCode = projectCode;
  }

  /**
   * Resolve a list of segment names to a deduplicated array of user IDs.
   * @param {string[]} segments
   * @returns {Promise<string[]>}
   */
  async getUserIds(segments) {
    if (!segments?.length) return [];

    const sets = await Promise.all(segments.map(s => this._resolveSegment(s)));
    // Union all sets
    const union = new Set();
    for (const set of sets) {
      for (const id of set) union.add(id);
    }
    return [...union];
  }

  /**
   * Resolve one segment to a Set of user IDs.
   * @param {string} segment
   * @returns {Promise<Set<string>>}
   */
  async _resolveSegment(segment) {
    const now = new Date();
    try {
      switch (segment) {
        case 'all_users': {
          const rows = await this.prisma.user.findMany({
            where:  { status: 'active' },
            select: { id: true },
          });
          return new Set(rows.map(r => r.id));
        }

        case 'new_users': {
          const rows = await this.prisma.user.findMany({
            where: {
              status:    'active',
              createdAt: { gte: new Date(now - 7 * DAY) },
            },
            select: { id: true },
          });
          return new Set(rows.map(r => r.id));
        }

        case 'active_users': {
          const rows = await this.prisma.user.findMany({
            where: {
              status:      'active',
              lastLoginAt: { gte: new Date(now - 7 * DAY) },
            },
            select: { id: true },
          });
          return new Set(rows.map(r => r.id));
        }

        case 'inactive_users': {
          const rows = await this.prisma.user.findMany({
            where: {
              status:      'active',
              lastLoginAt: { lte: new Date(now - 14 * DAY) },
            },
            select: { id: true },
          });
          return new Set(rows.map(r => r.id));
        }

        case 'vip_users': {
          const rows = await this.prisma.user.findMany({
            where: {
              status:   'active',
              vipLevel: { gte: 3 },
            },
            select: { id: true },
          });
          return new Set(rows.map(r => r.id));
        }

        case 'high_value': {
          const rows = await this.prisma.user.findMany({
            where: {
              status:  'active',
              balance: { gte: 1_000_000 },
            },
            select: { id: true },
          });
          return new Set(rows.map(r => r.id));
        }

        case 'deposited_once': {
          // Users who have at least one successful deposit
          const rows = await this.prisma.depositOrder.groupBy({
            by:    ['userId'],
            where: { status: 'approved' },
          });
          return new Set(rows.map(r => r.userId));
        }

        case 'first_deposit_pending': {
          // Registered but never deposited
          const deposited = await this.prisma.depositOrder.groupBy({
            by:    ['userId'],
            where: { status: 'approved' },
          });
          const depositedSet = new Set(deposited.map(r => r.userId));
          const all = await this.prisma.user.findMany({
            where:  { status: 'active' },
            select: { id: true },
          });
          return new Set(all.map(r => r.id).filter(id => !depositedSet.has(id)));
        }

        default:
          return new Set();
      }
    } catch {
      return new Set();
    }
  }
}

module.exports = { SegmentService };
