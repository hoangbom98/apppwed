// @ts-nocheck
/* eslint-disable */

/**
 * queueService.ts — BullMQ job queues (email, push notifications).
 *
 * BullMQ requires maxRetriesPerRequest: null on its ioredis connection.
 * This is intentionally a SEPARATE ioredis connection from the shared
 * config/redis singleton because BullMQ requires specific ioredis options
 * that conflict with the shared client's configuration.
 *
 * Reference: https://docs.bullmq.io/guide/connections
 */
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const logger = require('../services/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// BullMQ requires its own connection with maxRetriesPerRequest: null
let _connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,  // required by BullMQ
      retryStrategy: (times: number) => {
        if (times > 5) return null; // stop retrying
        return Math.min(times * 50, 2000);
      },
      lazyConnect: true,
    });
    _connection.on('error', (err: Error) => logger.warn(`[Queue] Redis error: ${err.message}`));
    _connection.connect().catch((err: Error) =>
      logger.warn(`[Queue] Redis connect failed: ${err.message} — queues disabled`),
    );
  }
  return _connection;
}

// Lazily create queues so they don't fail if Redis is down at startup
let _emailQueue: Queue | null = null;
let _pushQueue: Queue | null  = null;

export function getEmailQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_emailQueue) {
    try {
      _emailQueue = new Queue('email', { connection: getConnection() });
    } catch (err: any) {
      logger.warn(`[Queue] emailQueue init failed: ${err.message}`);
    }
  }
  return _emailQueue;
}

export function getPushQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_pushQueue) {
    try {
      _pushQueue = new Queue('push', { connection: getConnection() });
      // Start push worker
      new Worker('push', async (job) => {
        logger.info(`[Queue] Processing push job ${job.id}`);
      }, { connection: getConnection() });
    } catch (err: any) {
      logger.warn(`[Queue] pushQueue init failed: ${err.message}`);
    }
  }
  return _pushQueue;
}

// Named exports for backwards compatibility
export const emailQueue = { add: (...args: any[]) => getEmailQueue()?.add(...args) };
export const pushQueue  = { add: (...args: any[]) => getPushQueue()?.add(...args) };
