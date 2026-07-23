// @ts-nocheck
/**
 * sharding.ts — Tầng 1.1: User-based DB Sharding (trade_db)
 *
 * Sharding strategy for trade_db: Hash-based partition by userId.
 * Default: SHARD_COUNT = 4 shards (trade_db_shard_0 … trade_db_shard_3)
 *
 * WHEN TO USE
 * ───────────
 * Apply when a single trade_db grows beyond ~100M rows in transactions/orders.
 * For the current single-VPS setup, use MySQL partitioning (already implemented)
 * instead. Enable sharding when scaling to multiple DB servers.
 *
 * SETUP (when ready to shard)
 * ───────────────────────────
 * 1. Create N MySQL databases: trade_db_shard_0 … trade_db_shard_N-1
 * 2. Run Prisma migrations on each shard DB
 * 3. Set env vars: TRADE_DB_SHARD_0_URL, TRADE_DB_SHARD_1_URL, ...
 * 4. Set TRADE_SHARD_COUNT=4 in .env
 * 5. Replace getPrismaClient('trade') calls with getShardClient(userId)
 *
 * CURRENT STATUS
 * ──────────────
 * TRADE_SHARD_COUNT is not set → sharding is DISABLED (returns standard client).
 * This file provides the API so migration is a one-line env var change.
 *
 * USAGE
 * ─────
 *   const { getShardClient, getShardIndex } = require('./sharding');
 *
 *   // In trade service methods:
 *   const prisma = getShardClient(userId);
 *   await prisma.order.create({ data });
 */

'use strict';

import path from 'path';

const SHARD_COUNT = parseInt(process.env.TRADE_SHARD_COUNT || '0', 10);

/** Singleton registry per shard */
const shardClients: Record<string, any> = {};

/**
 * Compute shard index for a given userId.
 * Uses djb2 hash for string IDs (CUIDs) for even distribution.
 */
export function getShardIndex(userId: string): number {
  if (SHARD_COUNT <= 1) return 0;
  // djb2 hash — works for both numeric strings and CUID strings
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) + hash) ^ userId.charCodeAt(i);
  }
  return Math.abs(hash) % SHARD_COUNT;
}

/**
 * Returns the Prisma client for the shard that owns `userId`.
 * Falls back to the standard trade_db client if sharding is disabled.
 */
export function getShardClient(userId: string): any {
  // Sharding disabled — use standard client
  if (SHARD_COUNT <= 1) {
    const { getPrismaClient } = require('../config/databases');
    return getPrismaClient('trade');
  }

  const idx    = getShardIndex(userId);
  const dbName = `trade_db_shard_${idx}`;

  if (!shardClients[dbName]) {
    const urlKey = `TRADE_DB_SHARD_${idx}_URL`;
    const url    = process.env[urlKey];
    if (!url) throw new Error(`[Sharding] Missing env var: ${urlKey}`);

    const clientPath = path.join(
      __dirname, '../../../../node_modules/.prisma', 'trade-client',
    );
    const { PrismaClient } = require(clientPath);
    shardClients[dbName] = new PrismaClient({ datasources: { db: { url } } });
  }
  return shardClients[dbName];
}

/**
 * Returns the shard DB name for a userId (useful for debugging / admin tools).
 */
export function getShardDbName(userId: string): string {
  if (SHARD_COUNT <= 1) return 'trade_db';
  return `trade_db_shard_${getShardIndex(userId)}`;
}

/** Disconnect all shard clients (for graceful shutdown) */
export async function disconnectAllShards(): Promise<void> {
  await Promise.all(
    Object.values(shardClients).map((c: any) => c.$disconnect()),
  );
}

module.exports = { getShardIndex, getShardClient, getShardDbName, disconnectAllShards };
