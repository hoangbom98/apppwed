'use strict';
/**
 * shared/config/databases.ts — Re-export of the central Prisma multi-client factory.
 *
 * The canonical source lives at src/config/databases.ts.
 * This stub exists so that modules under src/shared/ and src/prisma/seeds/
 * can import via a consistent relative path without counting back to
 * src/config/ themselves.
 *
 * Usage:
 *   const { getPrismaClient } = require('../config/databases');        // from src/shared/…
 *   const { getPrismaClient } = require('../../shared/config/databases'); // from src/prisma/seeds/…
 */
module.exports = require('../../config/databases');
