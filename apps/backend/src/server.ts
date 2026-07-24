/**
 * src/server.ts — Compatibility shim.
 *
 * The true HTTP server + Socket.IO is assembled in the root-level server.ts.
 * This file exists only so that legacy code inside src/ that does
 * `require('./server')` or `import … from './server'` still works.
 *
 * Path: src/ → one level up → backend/server.ts
 */

export = require('../server');
