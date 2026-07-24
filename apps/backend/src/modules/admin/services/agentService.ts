// @ts-nocheck
'use strict';
/**
 * AgentService — agent management for the Admin domain.
 */
const { getPrismaClient } = require('../../../shared/config/databases');

const prisma = getPrismaClient('admin');

module.exports = {
  async list({ skip = 0, take = 20, where = {} } = {}) {
    const [data, total] = await Promise.all([
      prisma.adminUser.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.adminUser.count({ where }),
    ]);
    return { data, total };
  },
};
