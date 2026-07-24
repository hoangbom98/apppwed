// @ts-nocheck
/**
 * prismaReplica.ts — Tầng 1.3: Read Replica support
 *
 * Provides WRITE (master) and READ (replica) Prisma clients per project.
 * Falls back to the same master URL when no replica is configured.
 *
 * SETUP
 * ─────
 * 1. Set up MySQL replication (master → replica) on your VPS.
 *    Quick guide: https://dev.mysql.com/doc/refman/8.0/en/replication.html
 *
 * 2. Add replica URLs to .env (one per project):
 *      GAME_REPLICA_DATABASE_URL=mysql://reader:pass@replica:3306/game_db?connection_limit=5
 *      TRADE_REPLICA_DATABASE_URL=...
 *    If a replica URL is not set, reads fall back to master (safe default).
 *
 * USAGE
 * ─────
 *   const { getWriteClient, getReadClient } = require('../config/prismaReplica');
 *
 *   // Heavy read (report, history, dashboard stats)
 *   const users = await getReadClient('game').user.findMany({ ... });
 *
 *   // Write / mutation — always use master
 *   const tx = await getWriteClient('game').transaction.create({ ... });
 *
 * RULES
 * ─────
 *  - ALL writes (create, update, delete, $transaction) MUST use getWriteClient()
 *  - Reads inside a $transaction MUST use the write client (replica lag safety)
 *  - Dashboard stats, export, analytics, history → safe to use getReadClient()
 *  - Balance reads MUST use write client or Redis cache (avoid stale replica read)
 */

'use strict';

const path = require('path');

/** Singleton registry — write (master) clients */
const writeClients: Record<string, any> = {};
/** Singleton registry — read (replica) clients */
const readClients:  Record<string, any>  = {};

const PROJECTS = ['hub', 'game', 'trade', 'dating', 'sports', 'admin'] as const;
type Project = typeof PROJECTS[number];

/** ENV var name for the master DB URL */
const masterUrlKey  = (p: Project) => `${p.toUpperCase()}_DATABASE_URL`;
/** ENV var name for the replica DB URL (optional) */
const replicaUrlKey = (p: Project) => `${p.toUpperCase()}_REPLICA_DATABASE_URL`;

function loadClient(project: Project, url: string): any {
  // Try backend-local node_modules first (code/backend/node_modules/.prisma/<x>-client),
  // fall back to workspace-root node_modules (source/node_modules/.prisma/<x>-client).
  const primary  = path.join(__dirname, '../../node_modules/.prisma', `${project}-client`);
  const fallback = path.join(__dirname, '../../../node_modules/.prisma', `${project}-client`);
  let PrismaClient: any;
  try {
    PrismaClient = require(primary).PrismaClient;
  } catch {
    PrismaClient = require(fallback).PrismaClient;
  }
  return new PrismaClient({
    datasources: { db: { url } },
  });
}

/**
 * Returns the WRITE (master) Prisma client for the given project.
 * Use for all mutations and $transactions.
 */
export function getWriteClient(project: Project): any {
  if (!writeClients[project]) {
    const url = process.env[masterUrlKey(project)];
    if (!url) throw new Error(`[Replica] Missing env var: ${masterUrlKey(project)}`);
    writeClients[project] = loadClient(project, url);
  }
  return writeClients[project];
}

/**
 * Returns the READ (replica) Prisma client for the given project.
 * Falls back to master if no replica URL is configured.
 * Use for: dashboard stats, history queries, exports, analytics.
 */
export function getReadClient(project: Project): any {
  if (!readClients[project]) {
    const replicaUrl = process.env[replicaUrlKey(project)];
    const masterUrl  = process.env[masterUrlKey(project)];
    const url = replicaUrl || masterUrl;  // safe fallback to master
    if (!url) throw new Error(`[Replica] Missing env var: ${masterUrlKey(project)}`);
    readClients[project] = loadClient(project, url);
    if (!replicaUrl) {
      // Log once at startup so ops team knows replica is not configured
      const logger = require('../shared/services/logger');
      logger.info(`[Replica] No replica URL for "${project}" — reads fall back to master`);
    }
  }
  return readClients[project];
}

/** Gracefully disconnect all replica + write clients */
export async function disconnectAllReplicas(): Promise<void> {
  await Promise.all([
    ...Object.values(writeClients).map((c: any) => c.$disconnect()),
    ...Object.values(readClients).map((c: any) => c.$disconnect()),
  ]);
}

module.exports = { getWriteClient, getReadClient, disconnectAllReplicas };
