// @ts-nocheck
'use strict';
/**
 * PromotionService — promotions/campaign management for the Admin domain.
 */
const { getPrismaClient } = require('../../../shared/config/databases');

const prisma = getPrismaClient('admin');

module.exports = {
  async list({ skip = 0, take = 20, where = {} } = {}) {
    const [data, total] = await Promise.all([
      prisma.promotion.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.promotion.count({ where }),
    ]);
    return { data, total };
  },

  async getActivePromotions() {
    return prisma.promotion.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  },
};
