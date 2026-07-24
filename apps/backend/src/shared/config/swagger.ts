'use strict';
/**
 * shared/config/swagger.ts — Re-export of the canonical Swagger config.
 *
 * The full Swagger setup (graceful fallback, spec generation, mount helper)
 * lives at src/config/swagger.ts.  This shim exists so that modules under
 * src/shared/ can import via a short relative path without counting back to
 * src/config/ manually.
 *
 * Usage:
 *   const { mount } = require('../config/swagger');   // from src/shared/…
 */
module.exports = require('../../config/swagger');
