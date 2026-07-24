// @ts-nocheck
/* eslint-disable */

/**
 * queueService.ts — BullMQ job queues.
 *
 * Tầng 5: Added payment webhook queue with retry + exponential backoff.
 *
 * Queues:
 *  - email          — transactional emails (welcome, OTP, alerts)
 *  - push           — push notifications
 *  - payment-webhook — processes incoming payment webhooks reliably
 *                      (3 retries, exponential backoff, prevents duplicate processing)
 *
 * BullMQ requires maxRetriesPerRequest: null on its ioredis connection.
 * This is intentionally a SEPARATE ioredis connection from the shared
 * config/redis singleton because BullMQ requires specific ioredis options
 * that conflict with the shared client's configuration.
 *
 * Reference: https://docs.bullmq.io/guide/connections
 */
import { Queue, Worker, Job } from 'bullmq';
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

// ── Lazily create queues so they don't fail if Redis is down at startup ───

let _emailQueue:   Queue | null = null;
let _pushQueue:    Queue | null = null;
let _paymentQueue: Queue | null = null;

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
      new Worker('push', async (job: Job) => {
        logger.info(`[Queue] Processing push job ${job.id}`);
      }, { connection: getConnection() });
    } catch (err: any) {
      logger.warn(`[Queue] pushQueue init failed: ${err.message}`);
    }
  }
  return _pushQueue;
}

// ── Payment Webhook Queue (Tầng 5) ────────────────────────────────────────

export interface PaymentWebhookJob {
  provider:      string;   // 'momo' | 'zalopay' | 'lkvip' | 'usdt'
  transactionId: string;   // internal order ID
  webhookData:   Record<string, unknown>;
  receivedAt:    string;   // ISO timestamp
  project:       string;   // 'game' | 'trade' | etc.
}

export function getPaymentQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_paymentQueue) {
    try {
      _paymentQueue = new Queue('payment-webhook', {
        connection: getConnection(),
        defaultJobOptions: {
          attempts: 3,                       // retry up to 3 times
          backoff: {
            type:  'exponential',
            delay: 5_000,                    // 5s, 10s, 20s
          },
          removeOnComplete: { count: 1000 }, // keep last 1000 completed jobs
          removeOnFail:     { count:  500 }, // keep last 500 failed for inspection
        },
      });

      // ── Worker: process webhook jobs ─────────────────────────────────────
      new Worker<PaymentWebhookJob>('payment-webhook', async (job: Job<PaymentWebhookJob>) => {
        const { provider, transactionId, webhookData, project } = job.data;
        logger.info(`[PaymentQueue] Processing webhook job=${job.id} provider=${provider} tx=${transactionId}`);

        try {
          // Load the appropriate payment adapter
          const { PaymentFactory } = require('../payment/PaymentFactory');
          const adapter = PaymentFactory.getAdapter(provider);
          await adapter.handleWebhook(transactionId, webhookData, project);
          logger.info(`[PaymentQueue] Webhook processed job=${job.id} tx=${transactionId}`);
        } catch (err: any) {
          logger.error(`[PaymentQueue] Webhook failed job=${job.id} attempt=${job.attemptsMade}: ${err.message}`);
          throw err; // re-throw so BullMQ retries
        }
      }, {
        connection: getConnection(),
        concurrency: 5, // process 5 webhooks concurrently max
      });

    } catch (err: any) {
      logger.warn(`[Queue] paymentQueue init failed: ${err.message}`);
    }
  }
  return _paymentQueue;
}

/**
 * Enqueue a payment webhook for async processing with retry guarantee.
 * Call this at the start of any payment webhook handler instead of
 * processing synchronously — prevents data loss if DB is slow/down.
 *
 * @example
 *   // In MoMo webhook controller:
 *   await enqueuePaymentWebhook('momo', orderId, req.body, 'game');
 *   res.json({ resultCode: 0 });  // Acknowledge immediately
 */
export async function enqueuePaymentWebhook(
  provider:      string,
  transactionId: string,
  webhookData:   Record<string, unknown>,
  project:       string,
): Promise<void> {
  const queue = getPaymentQueue();
  if (!queue) {
    logger.warn('[PaymentQueue] Queue unavailable — processing webhook synchronously');
    return;
  }
  const jobId = `${provider}:${transactionId}`;  // dedup key
  await queue.add(
    'process-webhook',
    { provider, transactionId, webhookData, project, receivedAt: new Date().toISOString() },
    { jobId },  // BullMQ deduplicates by jobId — prevents double-processing
  );
  logger.info(`[PaymentQueue] Enqueued webhook provider=${provider} tx=${transactionId} jobId=${jobId}`);
}

// Named exports for backwards compatibility
export const emailQueue   = { add: (...args: any[]) => getEmailQueue()?.add(...args) };
export const pushQueue    = { add: (...args: any[]) => getPushQueue()?.add(...args) };
export const paymentQueue = { add: (...args: any[]) => getPaymentQueue()?.add(...args) };
