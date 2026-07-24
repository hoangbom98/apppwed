'use strict';
/**
 * src/config/index.ts — Config barrel — exports all shared config modules.
 *
 * NOTE: `database.js` and `db.config.js` were legacy Sequelize stubs.
 * The production stack uses Prisma via `databases.ts` → getPrismaClient().
 * Those legacy files have been removed. This index no longer exports them.
 */
module.exports = {
  cron:      require('./cron'),
  databases: require('./databases'),   // ← Prisma multi-client factory (production)
  i18n:      require('./i18n'),
  logger:    require('./logger'),
  redis:     require('./redis'),
  socket:    require('./socket'),       // ← centralised Socket.IO singleton (setIo/getIo)
  swagger:   require('./swagger'),
};
