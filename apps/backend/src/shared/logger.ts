'use strict';
/**
 * src/shared/logger.ts — Re-export shim.
 *
 * Several legacy files in src/services/ and src/middlewares/ import from
 * '../../shared/logger' (the old path used before v2.0 restructuring).
 * This shim keeps them compiling without touching each legacy file.
 *
 * The canonical logger lives at src/shared/services/logger.ts.
 */
module.exports = require('./services/logger');
