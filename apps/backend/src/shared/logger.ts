'use strict';
/**
 * src/shared/logger.ts — Re-export shim.
 *
 * Several legacy files import from '../../shared/logger' (old path before v2.0).
 * This shim keeps them compiling without touching each legacy file.
 *
 * The canonical logger lives at src/shared/services/logger.ts.
 */
const _logger = require('./services/logger');
module.exports = _logger;

// Named export so `import { logger } from '../../shared/logger'` compiles.
export const logger = _logger;
