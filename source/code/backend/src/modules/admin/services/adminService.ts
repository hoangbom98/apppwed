// @ts-nocheck
'use strict';
/**
 * AdminService — cross-project user aggregation for the Admin domain.
 */
const { getPrismaClient } = require('../../../shared/config/databases');
const logger = require('../../../shared/services/logger');

const PROJECT_DBS = ['hub', 'game', 'dating', 'trade', 'sports'];

async function safeCount(model, where = {}) {
  try { return await model.count({ where }); } catch { return 0; }
}

async function safeSum(model, field, where = {}) {
  try {
    const r = await model.aggregate({ _sum: { [field]: true }, where });
    return Number(r._sum?.[field] || 0);
  } catch { return 0; }
}

module.exports = {
  async getUserCounts() {
    const results = await Promise.all(
      PROJECT_DBS.map(async (project) => {
        try {
          const prisma = getPrismaClient(project);
          return { project, count: await safeCount(prisma.user) };
        } catch {
          return { project, count: 0 };
        }
      })
    );
    const totals = results.reduce((acc, { project, count }) => ({ ...acc, [project]: count }), {});
    return { ...totals, total: Object.values(totals).reduce((a, b) => a + b, 0) };
  },

  safeCount,
  safeSum,
};
