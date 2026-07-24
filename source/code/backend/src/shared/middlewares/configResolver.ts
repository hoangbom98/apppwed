/**
 * configResolver middleware
 * Injects req.configService — a per-request ConfigService bound to the
 * admin Prisma client (ProjectConfig lives in admin_db).
 *
 * Usage in controllers:
 *   const value = await req.configService.get('hub', 'payment', 'deposit', 'minAmount', 50);
 */
const ConfigService       = require('../services/configService');
const { getPrismaClient } = require('../../config/databases');

module.exports = (req, _res, next) => {
  // ConfigService reads from admin_db (ProjectConfig table)
  const adminPrisma = getPrismaClient('admin');
  req.configService = new ConfigService(adminPrisma);
  next();
};
