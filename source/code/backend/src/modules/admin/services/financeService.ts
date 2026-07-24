// @ts-nocheck
'use strict';
/**
 * FinanceService — financial aggregations for the Admin domain.
 */
const { getPrismaClient } = require('../../../shared/config/databases');

const prisma = getPrismaClient('admin');

module.exports = {
  async getSummary() {
    return prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: true,
    });
  },
};
