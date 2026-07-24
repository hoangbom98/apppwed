// @ts-nocheck
'use strict';
/**
 * LotteryService — lottery draw management for the Admin domain.
 */
const { getPrismaClient } = require('../../../shared/config/databases');

const prisma = getPrismaClient('game');

module.exports = {
  async list({ skip = 0, take = 20, where = {} } = {}) {
    const [data, total] = await Promise.all([
      prisma.lotteryDraw.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.lotteryDraw.count({ where }),
    ]);
    return { data, total };
  },
};
