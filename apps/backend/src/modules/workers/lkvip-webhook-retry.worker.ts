/**
 * lkvip-webhook-retry.worker.ts
 *
 * BullMQ worker — xử lý LKvip webhook với retry tự động + frozen balance auto-expire.
 *
 * Giải quyết 2 vấn đề thực tế:
 *
 *  PROBLEM 1 — Webhook callback fail (mạng chậm, DB tạm thời down):
 *    Hiện tại webhookController xử lý đồng bộ trong HTTP handler.
 *    Nếu DB chậm → gateway timeout → gateway gọi lại → duplicate credit.
 *    → Fix: acknowledge gateway ngay (200 OK), enqueue job, worker retry với exponential backoff.
 *
 *  PROBLEM 2 — Frozen balance bị kẹt vĩnh viễn:
 *    Khi tạo withdrawal, balance bị freeze trong User.frozen.
 *    Nếu admin không xử lý, balance bị kẹt mãi.
 *    → Fix: cron mỗi 5 phút quét virtualAccount/withdrawalRequest quá hạn → tự động cancel + unfreeze.
 *
 * Queues:
 *   lkvip-deposit-webhook   — retry deposit webhook confirmation
 *   lkvip-momo-webhook      — retry MoMo IPN processing
 *   lkvip-frozen-expire     — triggered by cron để expire frozen balances
 *
 * Sử dụng:
 *   // server startup
 *   import { startLkvipWebhookWorker } from './lkvip-webhook-retry.worker';
 *   startLkvipWebhookWorker();
 *
 *   // webhookController — thay vì xử lý inline:
 *   import { enqueueLkvipDepositWebhook, enqueueLkvipMomoWebhook } from './lkvip-webhook-retry.worker';
 *   await enqueueLkvipDepositWebhook({ vaNumber, amount, transactionRef });
 *   res.json({ success: true }); // 200 OK ngay lập tức
 */
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../../shared/logger';
import { getPrismaClient } from '../../config/databases';

// ── Constants ──────────────────────────────────────────────────────────────────
const REDIS_URL              = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const FROZEN_EXPIRE_MINUTES  = parseInt(process.env.LKVIP_FROZEN_EXPIRE_MIN  || '5',  10);
const WEBHOOK_RETRY_ATTEMPTS = parseInt(process.env.LKVIP_WEBHOOK_MAX_RETRY  || '5',  10);

// ── BullMQ Redis connection ────────────────────────────────────────────────────
let _conn: IORedis | null = null;

function getConn(): IORedis {
  if (!_conn) {
    _conn = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    _conn.on('error', (err: Error) =>
      logger.warn(`[LkvipWorker] Redis error: ${err.message}`)
    );
    _conn.connect().catch((err: Error) =>
      logger.warn(`[LkvipWorker] Redis connect failed: ${err.message}`)
    );
  }
  return _conn;
}

// ── Queue factory ──────────────────────────────────────────────────────────────
const QUEUE_OPTS = {
  defaultJobOptions: {
    attempts: WEBHOOK_RETRY_ATTEMPTS,
    backoff: { type: 'exponential' as const, delay: 5_000 }, // 5s → 10s → 20s → 40s → 80s
    removeOnComplete: { count: 2_000 },
    removeOnFail:     { count:   500 },
  },
};

let _depositQueue: Queue | null = null;
let _momoQueue:    Queue | null = null;
let _expireQueue:  Queue | null = null;

function getDepositQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_depositQueue) {
    try { _depositQueue = new Queue('lkvip-deposit-webhook', { connection: getConn(), ...QUEUE_OPTS }); }
    catch (e: any) { logger.warn(`[LkvipWorker] depositQueue init failed: ${e.message}`); }
  }
  return _depositQueue;
}

function getMomoQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_momoQueue) {
    try { _momoQueue = new Queue('lkvip-momo-webhook', { connection: getConn(), ...QUEUE_OPTS }); }
    catch (e: any) { logger.warn(`[LkvipWorker] momoQueue init failed: ${e.message}`); }
  }
  return _momoQueue;
}

function getExpireQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_expireQueue) {
    try { _expireQueue = new Queue('lkvip-frozen-expire', { connection: getConn(), ...QUEUE_OPTS }); }
    catch (e: any) { logger.warn(`[LkvipWorker] expireQueue init failed: ${e.message}`); }
  }
  return _expireQueue;
}

// ── Job data shapes ────────────────────────────────────────────────────────────
export interface LkvipDepositWebhookJob {
  vaNumber:       string;
  amount:         number;
  transactionRef: string;
  receivedAt:     string;
}

export interface LkvipMomoWebhookJob {
  orderId:     string;
  userId:      string;
  amount:      number;
  partnerCode: string;
  requestId:   string;
  receivedAt:  string;
}

// ── Producers ──────────────────────────────────────────────────────────────────

/**
 * Enqueue a LKvip deposit webhook for reliable async processing.
 * Call this from webhookController.handleDepositWebhook BEFORE any DB work.
 * De-duplicated by transactionRef.
 */
export async function enqueueLkvipDepositWebhook(data: LkvipDepositWebhookJob): Promise<void> {
  const queue = getDepositQueue();
  if (!queue) {
    logger.warn('[LkvipWorker] depositQueue unavailable — processing inline');
    await processDepositWebhook({ data } as any);
    return;
  }
  const jobId = `lkvip:deposit:${data.transactionRef}`;
  await queue.add('confirm-deposit', data, { jobId });
  logger.info(`[LkvipWorker] Enqueued deposit vaNumber=${data.vaNumber} ref=${data.transactionRef}`);
}

/**
 * Enqueue a MoMo IPN for reliable async processing.
 * Call this from webhookController.handleMomoWebhook BEFORE any DB work.
 * De-duplicated by orderId.
 */
export async function enqueueLkvipMomoWebhook(data: LkvipMomoWebhookJob): Promise<void> {
  const queue = getMomoQueue();
  if (!queue) {
    logger.warn('[LkvipWorker] momoQueue unavailable — processing inline');
    await processMomoWebhook({ data } as any);
    return;
  }
  const jobId = `lkvip:momo:${data.orderId}`;
  await queue.add('process-momo', data, { jobId });
  logger.info(`[LkvipWorker] Enqueued MoMo orderId=${data.orderId} userId=${data.userId}`);
}

/**
 * Trigger a frozen balance expiry scan immediately (on-demand).
 * Also called by cron every 5 minutes.
 */
export async function triggerFrozenExpiry(): Promise<void> {
  const queue = getExpireQueue();
  if (!queue) {
    await processFrozenExpiry({ data: {} } as any);
    return;
  }
  await queue.add('expire-frozen', {}, { jobId: `lkvip:frozen:${Date.now()}` });
}

// ── Worker processors ──────────────────────────────────────────────────────────

/** Confirm a VA deposit — credits user balance, creates transaction record */
async function processDepositWebhook(job: Job<LkvipDepositWebhookJob>): Promise<void> {
  const { vaNumber, amount, transactionRef } = job.data;
  const prisma = getPrismaClient('game');

  logger.info(`[LkvipWorker] Deposit confirm vaNumber=${vaNumber} amount=${amount} attempt=${(job as any).attemptsMade ?? 0}`);

  // Idempotency: check if this transactionRef was already processed
  const existing = await prisma.lkvipTransaction.findFirst({
    where: { referenceId: vaNumber, referenceType: 'va', status: 'completed' },
  });
  if (existing) {
    logger.info(`[LkvipWorker] Deposit already processed vaNumber=${vaNumber} — skip`);
    return;
  }

  // Find the pending VA
  const va = await prisma.virtualAccount.findFirst({
    where: { vaNumber, status: 'pending' },
    include: { user: true },
  });
  if (!va) {
    logger.warn(`[LkvipWorker] VA not found or already processed: ${vaNumber}`);
    return;
  }

  // Check expiry
  if (new Date() > va.expiredAt) {
    await prisma.virtualAccount.update({ where: { id: va.id }, data: { status: 'expired' } });
    logger.warn(`[LkvipWorker] VA expired: ${vaNumber}`);
    return; // do not retry
  }

  // Atomic: complete VA + credit balance + create transaction
  await prisma.$transaction(async (tx: any) => {
    await tx.virtualAccount.update({
      where: { id: va.id },
      data:  { status: 'completed', actualAmount: amount, transactionRef },
    });
    await tx.user.update({
      where: { id: va.userId },
      data:  { balance: { increment: amount }, totalDeposit: { increment: amount } },
    });
    await tx.lkvipTransaction.create({
      data: {
        userId:        va.userId,
        type:          'deposit',
        amount,
        referenceType: 'va',
        referenceId:   vaNumber,
        description:   `Nạp tiền tự động qua VA ${vaNumber}`,
        status:        'completed',
      },
    });
  });

  // Realtime push to user
  try {
    const { emitToUser } = require('../../config/socket');
    emitToUser(va.userId, 'balance:update', { balance: null }); // client refetches balance
    emitToUser(va.userId, 'notification', {
      title:   'Nạp tiền thành công',
      content: `${amount.toLocaleString('vi-VN')} VND đã được cộng vào tài khoản`,
    });
  } catch (e: any) {
    logger.warn(`[LkvipWorker] Socket push failed: ${e.message}`);
  }

  logger.info(`[LkvipWorker] Deposit confirmed vaNumber=${vaNumber} userId=${va.userId} amount=${amount}`);
}

/** Process a MoMo IPN — credits user balance, creates transaction record */
async function processMomoWebhook(job: Job<LkvipMomoWebhookJob>): Promise<void> {
  const { orderId, userId, amount } = job.data;
  const prisma = getPrismaClient('game');

  logger.info(`[LkvipWorker] MoMo IPN orderId=${orderId} userId=${userId} attempt=${(job as any).attemptsMade ?? 0}`);

  // Idempotency: check if this orderId was already processed
  const existing = await prisma.lkvipTransaction.findFirst({
    where: { referenceId: orderId, referenceType: 'momo', status: 'completed' },
  });
  if (existing) {
    logger.info(`[LkvipWorker] MoMo already processed orderId=${orderId} — skip`);
    return;
  }

  // Atomic: credit balance + create transaction
  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data:  { balance: { increment: amount }, totalDepositToday: { increment: amount } },
    });
    await tx.lkvipTransaction.create({
      data: {
        userId,
        type:          'deposit',
        amount,
        referenceType: 'momo',
        referenceId:   orderId,
        description:   `Nạp tiền MoMo orderId=${orderId}`,
        status:        'completed',
      },
    });
  });

  // Realtime push
  try {
    const { emitToUser } = require('../../config/socket');
    emitToUser(userId, 'balance:update', { balance: null });
  } catch (e: any) {
    logger.warn(`[LkvipWorker] Socket push failed: ${e.message}`);
  }

  logger.info(`[LkvipWorker] MoMo IPN confirmed orderId=${orderId} userId=${userId} amount=${amount}`);
}

/**
 * Scan for expired pending entities and release frozen balances.
 *  - VirtualAccount: status=pending + expiredAt < now → set expired (no balance change needed)
 *  - WithdrawalRequest: status=pending + createdAt > FROZEN_EXPIRE_MINUTES ago → auto-cancel + unfreeze
 */
async function processFrozenExpiry(job: Job): Promise<void> {
  const prisma    = getPrismaClient('game');
  const now       = new Date();
  const cutoff    = new Date(now.getTime() - FROZEN_EXPIRE_MINUTES * 60_000);

  // 1. Expire stale virtual accounts
  const { count: vaExpired } = await prisma.virtualAccount.updateMany({
    where:  { status: 'pending', expiredAt: { lt: now } },
    data:   { status: 'expired' },
  });
  if (vaExpired > 0) {
    logger.info(`[LkvipWorker] Expired ${vaExpired} stale virtual accounts`);
  }

  // 2. Auto-cancel withdrawal requests frozen > FROZEN_EXPIRE_MINUTES
  const staleWithdrawals = await prisma.withdrawalRequest.findMany({
    where: { status: 'pending', createdAt: { lt: cutoff } },
    select: { id: true, userId: true, amount: true },
  });

  for (const w of staleWithdrawals) {
    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.withdrawalRequest.update({
          where: { id: w.id },
          data:  { status: 'cancelled', rejectionReason: `Auto-expired after ${FROZEN_EXPIRE_MINUTES}min` },
        });
        // Unfreeze: return amount to available balance
        await tx.user.update({
          where: { id: w.userId },
          data:  {
            balance: { increment: w.amount },
            frozen:  { decrement: w.amount },
          },
        });
      });

      logger.info(`[LkvipWorker] Auto-cancelled withdrawal ${w.id} userId=${w.userId} amount=${w.amount}`);

      // Alert admin
      try {
        const { emitAdminEvent } = require('../../config/socket');
        emitAdminEvent('game', 'admin:withdrawal_auto_cancelled', {
          withdrawalId: w.id,
          userId:       w.userId,
          amount:       w.amount,
          reason:       `Auto-expired after ${FROZEN_EXPIRE_MINUTES}min`,
        });
      } catch (_) { /* non-fatal */ }

    } catch (err: any) {
      logger.error(`[LkvipWorker] Failed to auto-cancel withdrawal ${w.id}: ${err.message}`);
    }
  }

  if (staleWithdrawals.length > 0) {
    logger.info(`[LkvipWorker] Frozen expiry: cancelled ${staleWithdrawals.length} stale withdrawals`);
  }
}

// ── Worker bootstrap ───────────────────────────────────────────────────────────
let _started = false;

/**
 * Start all LKvip BullMQ workers.
 * Also registers a setInterval every 5 minutes to trigger frozen-balance expiry scans.
 * Idempotent — safe to call multiple times.
 */
export function startLkvipWebhookWorker(): void {
  if (_started || !REDIS_URL) return;
  _started = true;

  // Ensure queues exist before workers bind
  getDepositQueue();
  getMomoQueue();
  getExpireQueue();

  // Worker: deposit webhook retry
  new Worker<LkvipDepositWebhookJob>('lkvip-deposit-webhook', processDepositWebhook, {
    connection:  getConn(),
    concurrency: 5,
  });

  // Worker: MoMo IPN retry
  new Worker<LkvipMomoWebhookJob>('lkvip-momo-webhook', processMomoWebhook, {
    connection:  getConn(),
    concurrency: 5,
  });

  // Worker: frozen balance expiry
  new Worker('lkvip-frozen-expire', processFrozenExpiry, {
    connection:  getConn(),
    concurrency: 1, // serial — one expiry scan at a time
  });

  // Schedule: trigger frozen expiry every 5 minutes
  setInterval(() => {
    triggerFrozenExpiry().catch((e: Error) =>
      logger.warn(`[LkvipWorker] triggerFrozenExpiry failed: ${e.message}`)
    );
  }, FROZEN_EXPIRE_MINUTES * 60_000);

  logger.info(
    `[LkvipWorker] Workers started — deposit/momo (concurrency=5), ` +
    `frozen-expire (every ${FROZEN_EXPIRE_MINUTES}min)`
  );
}
