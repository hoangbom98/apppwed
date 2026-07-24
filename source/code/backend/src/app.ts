/**
 * src/app.ts — Compatibility shim.
 *
 * The true Express app is assembled and exported by the root-level server.ts.
 * This file exists only so that any legacy tooling that does
 * `require('./src/app')` still gets the same { app, server, io } exports.
 */

export = require('../server');
