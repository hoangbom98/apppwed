// @ts-nocheck
const path = require('path');
const { applyEncryptionMiddleware } = require('../shared/prisma/encryptionMiddleware');

/** @type {Record<string, import('@prisma/client').PrismaClient>} */
const clients = {};

/**
 * Prisma multi-client factory — returns a singleton PrismaClient for `project`.
 *
 * Each project (hub, game, trade, dating, sports, admin) has its own generated
 * Prisma client stored under `node_modules/.prisma/<project>-client`.
 * Clients are cached in `clients` — one instance per project per process.
 *
 * CONNECTION POOLING NOTES
 * ────────────────────────
 * Prisma uses a built-in connection pool (via the Prisma query engine).
 * The pool size defaults to (num_physical_cpus * 2) + 1.
 *
 * To set an explicit pool limit append `?connection_limit=N` to the DB URL:
 *   GAME_DATABASE_URL=mysql://user:pass@127.0.0.1:3306/game_db?connection_limit=10
 *
 * Recommended per-project limit on a single VPS:
 *   - hub, trade, sports, dating:  5–8   (lower traffic)
 *   - game, admin:                 10–15 (higher query rate)
 *
 * MySQL 8 default max_connections = 151.
 * With 6 projects × 10 connections × max PM2 instances you can easily
 * approach this limit — tune accordingly.
 *
 * USAGE
 * ─────
 *   const { getPrismaClient } = require('../config/databases');
 *   const prisma = getPrismaClient('game');
 *   const users  = await prisma.user.findMany();
 *
 * @param {'hub'|'game'|'trade'|'dating'|'sports'|'admin'} project
 * @returns {import('@prisma/client').PrismaClient}
 */
function getPrismaClient(project) {
  if (!clients[project]) {
    // __dirname resolves differently under src/ vs dist/src/ — use project root.
    // Project root = apps/backend, which is always 2 levels above __dirname in
    // both src/config/ (dev) and dist/src/config/ (prod dist).
    // Prisma clients are generated into node_modules at the monorepo root:
    //   /var/LKVIP/node_modules/.prisma/<project>-client
    const projectRoot = path.resolve(__dirname, '..', '..', '..', '..', '..', 'node_modules', '.prisma', `${project}-client`);
    // Fallback: apps/backend/node_modules/.prisma (local install)
    const localPath   = path.resolve(__dirname, '..', '..', 'node_modules', '.prisma', `${project}-client`);
    const clientPath  = require('fs').existsSync(projectRoot) ? projectRoot : localPath;
    const { PrismaClient } = require(clientPath);
    const client = new PrismaClient();
    // Apply field-level encryption middleware for sensitive fields
    applyEncryptionMiddleware(client);
    clients[project] = client;
  }
  return clients[project];
}

/**
 * Gracefully disconnect all open Prisma clients.
 * Call this in your PM2 graceful-shutdown handler (SIGTERM).
 */
async function disconnectAll() {
  await Promise.all(Object.values(clients).map(c => c.$disconnect()));
}

module.exports = { getPrismaClient, disconnectAll };

// Named exports for TypeScript `import { getPrismaClient } from '...'` consumers
export { getPrismaClient, disconnectAll };
