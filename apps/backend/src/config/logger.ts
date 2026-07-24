'use strict';
/**
 * Logger config re-export.
 *
 * The Winston logger is fully implemented in services/logger.js.
 * This file re-exports it so that modules in config/ can import from
 * a consistent config/ path rather than reaching into services/.
 *
 * Usage (from any file in shared/config/):
 *   const logger = require('./logger');
 *
 * Usage (from anywhere else — use the services/ path directly):
 *   const logger = require('../services/logger');
 */
module.exports = require('../shared/services/logger');
