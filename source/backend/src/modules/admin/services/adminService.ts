// @ts-nocheck
/* eslint-disable */

/**
 * AdminService — Refactored to extend BaseService.
 * Maintains cross-project aggregation logic while leveraging BaseService for CRUD.
 */
import { BaseService } from '../../../shared/base/BaseService';
import { PrismaClient } from '@prisma/client';
const { getPrismaClient } = require('../../../shared/config/databases');
const logger = require('../../../shared/services/logger');

const PROJECT_DBS = ['hub', 'game', 'dating', 'trade', 'sports'] as const;

export class AdminService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'adminUser');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private async safeCount(model: any, where: object = {}) {
    try {
      return await model.count({ where });
    } catch {
      return 0;
    }
  }

  private async safeSum(model: any, field: string, where: object = {}) {
    try {
      const r = await model.aggregate({ _sum: { [field]: true }, where });
      return Number(r._sum?.[field] || 0);
    } catch {
      return 0;
    }
  }

  // ── Cross-project user aggregation ───────────────────────────────────────────

  async getUserCounts() {
    const results = await Promise.all(
      PROJECT_DBS.map(async (project) => {
        try {
          const prisma = getPrismaClient(project);
          return { project, count: await this.safeCount(prisma.user) };
        } catch {
          return { project, count: 0 };
        }
      })
    );
    
    const totals = results.reduce((acc, curr) => ({ ...acc, [curr.project]: curr.count }), {} as any);
    return { ...totals, total: Object.values(totals).reduce((a: any, b: any) => a + b, 0) };
  }

  // Add more aggregation methods here as needed...
}
