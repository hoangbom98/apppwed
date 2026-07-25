/**
 * savingsVault-interest.worker.ts — BullMQ Worker: SavingsVault Daily Interest
 *
 * Queue name: "game-savingsVault-interest"
 *
 * Job payload:
 *   { holdingId: string }  → tính và cộng lãi suất ngày cho 1 holding cụ thể
 *
 * Flow:
 *   1. Cron 00:05 → scanAndDispatch() quét tất cả holdings active, đưa vào queue
 *   2. Worker xử lý từng holding: tính interest = amount × (interestRate / 365)
 *   3. Cộng vào balance user + cập nhật holding.profitPaid + ghi transaction
 *   4. Nếu holding đến ngày maturity (endDate ≤ today) → trả gốc + lãi ngày cuối
 *
 * Cron schedule (đăng ký trong src/config/cron.ts):
 *   5 0 * * *  → gọi dispatchSavingsVaultInterest() (00:05 hàng ngày)
 *
 * Được khởi động qua startSavingsVaultInterestWorker() tại server startup.
 */
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../../shared/logger';

const REDIS_URL  = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const QUEUE_NAME = 'game-savingsVault-interest';
const CONCURRENCY = 5; // 5 concurrent — safe vì mỗi holding độc lập

// ── Redis connection ──────────────────────────────────────────────────────────
let _conn: IORedis | null = null;
function getConn(): IORedis {
  if (!_conn) {
    _conn = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect:         true,
      enableReadyCheck:    false,
    });
    _conn.on('error', (err: Error) =>
      logger.warn(`[SavingsVaultWorker] Redis error: ${err.message}`),
    );
    _conn.connect().catch((err: Error) =>
      logger.warn(`[SavingsVaultWorker] Redis connect failed: ${err.message}`),
    );
  }
  return _conn;
}

// ── Queue singleton ───────────────────────────────────────────────────────────
let _queue: Queue | null = null;
function getQueue(): Queue | null {
  if (_queue) return _queue;
  try {
    _queue = new Queue(QUEUE_NAME, {
      connection: getConn(),
      defaultJobOptions: {
        attempts:         3,
        backoff:          { type: 'exponential', delay: 3_000 },
        removeOnComplete: { count: 5_000 },
        removeOnFail:     { count:   500 },
      },
    });
    return _queue;
  } catch (err: any) {
    logger.warn(`[SavingsVaultWorker] Queue init failed: ${err.message}`);
    return null;
  }
}

// ── Job payload type ──────────────────────────────────────────────────────────
export interface SavingsVaultInterestJobData {
  holdingId: string;
  date:      string; // "YYYY-MM-DD" — ngày tính lãi
}

// ── Core processor ────────────────────────────────────────────────────────────
async function processSavingsVaultInterestJob(job: Job<SavingsVaultInterestJobData>): Promise<void> {
  const { holdingId, date } = job.data;
  const { getPrismaClient } = require('../../config/databases');
  const gamePrisma          = getPrismaClient('game');

  // 1. Load holding + product
  const holding = await gamePrisma.savingsVaultHolding.findUnique({
    where:   { id: holdingId },
    include: { product: { select: { title: true, interestRate: true, days: true } } },
  });

  if (!holding || holding.status !== 'active') {
    logger.debug(`[SavingsVaultWorker] skip holdingId=${holdingId} status=${holding?.status ?? 'not found'}`);
    return;
  }

  const principal    = Number(holding.amount);
  const annualRate   = Number(holding.product.interestRate ?? 0);
  const dailyInterest = parseFloat((principal * annualRate / 365).toFixed(8));

  if (dailyInterest <= 0) {
    logger.debug(`[SavingsVaultWorker] zero interest holdingId=${holdingId} — skipping`);
    return;
  }

  // 2. Kiểm tra đã maturity chưa
  const today    = date;
  const endDate  = holding.endDate ? new Date(holding.endDate).toISOString().split('T')[0] : null;
  const matured  = holding.product.days > 0 && endDate !== null && today >= endDate;

  // 3. Lấy balance trước khi cộng
  const user = await gamePrisma.user.findUnique({
    where:  { id: holding.userId },
    select: { balance: true },
  });
  if (!user) {
    logger.warn(`[SavingsVaultWorker] user not found for holdingId=${holdingId}`);
    return;
  }

  const balanceBefore = Number(user.balance);
  const creditAmount  = matured
    ? dailyInterest + principal + Number(holding.profitPaid ?? 0) // trả gốc + lãi hôm nay (không tính lãi đã trả)
    : dailyInterest;

  // Trả gốc: amount = principal, profitPaid đã tích luỹ riêng
  const totalCredit = matured ? dailyInterest + principal : dailyInterest;
  const balanceAfter = balanceBefore + totalCredit;

  await gamePrisma.$transaction([
    // Credit user
    gamePrisma.user.update({
      where: { id: holding.userId },
      data:  { balance: { increment: totalCredit } },
    }),
    // Update holding
    gamePrisma.savingsVaultHolding.update({
      where: { id: holdingId },
      data:  {
        profitPaid: { increment: dailyInterest },
        status:     matured ? 'completed' : 'active',
        ...(matured ? { completedAt: new Date() } : {}),
      },
    }),
    // Transaction record
    gamePrisma.transaction.create({
      data: {
        userId:        holding.userId,
        type:          matured ? 'savingsVault_maturity' : 'savingsVault_interest',
        amount:        totalCredit,
        balanceBefore,
        balanceAfter,
        referenceId:   holdingId,
        referenceType: 'savingsVault_holding',
        note:          matured
          ? `Đáo hạn Số dư Bảo: ${holding.product.title} (gốc ${principal.toLocaleString('vi')} + lãi ${dailyInterest.toLocaleString('vi')} VND)`
          : `Lãi Số dư Bảo ngày ${date}: ${holding.product.title} +${dailyInterest.toLocaleString('vi')} VND`,
      },
    }),
    // Log for 7-day yield
    gamePrisma.savingsVaultHistory.create({
      data: {
        userId: holding.userId,
        holdingId,
        amount: dailyInterest,
        date: new Date(date)
      }
    })
  ]);

  logger.info(
    `[SavingsVaultWorker] holdingId=${holdingId} userId=${holding.userId} ` +
    `daily=${dailyInterest} matured=${matured} date=${date}`,
  );
}

// ── Worker singleton ──────────────────────────────────────────────────────────
let _worker: Worker | null = null;

/**
 * Khởi động SavingsVault interest worker.
 * Idempotent — safe to call nhiều lần.
 */
export function startSavingsVaultInterestWorker(): void {
  if (_worker) return;
  try {
    _worker = new Worker<SavingsVaultInterestJobData>(
      QUEUE_NAME,
      processSavingsVaultInterestJob,
      {
        connection:  getConn(),
        concurrency: CONCURRENCY,
      },
    );

    _worker.on('completed', (job) =>
      logger.debug(`[SavingsVaultWorker] job=${job.id} holdingId=${job.data.holdingId} completed`),
    );
    _worker.on('failed', (job, err) =>
      logger.error(`[SavingsVaultWorker] job=${job?.id} holdingId=${job?.data?.holdingId} failed: ${err.message}`),
    );
    _worker.on('error', (err) =>
      logger.error(`[SavingsVaultWorker] worker error: ${err.message}`),
    );

    logger.info(`[SavingsVaultWorker] Started — queue="${QUEUE_NAME}" concurrency=${CONCURRENCY}`);
  } catch (err: any) {
    logger.warn(`[SavingsVaultWorker] Failed to start: ${err.message}`);
  }
}

// ── Scan & dispatch (called by cron at 00:05) ─────────────────────────────────

/**
 * Quét tất cả savingsVaultHolding đang active, dispatch 1 job mỗi holding.
 * Gọi từ cron.ts: schedule('5 0 * * *', 'savingsVault-interest', dispatchSavingsVaultInterest)
 *
 * Fallback inline khi Redis không sẵn sàng.
 */
export async function dispatchSavingsVaultInterest(date?: string): Promise<void> {
  const today = date ?? new Date().toISOString().split('T')[0];
  const { getPrismaClient } = require('../../config/databases');
  const gamePrisma          = getPrismaClient('game');

  const holdings = await gamePrisma.savingsVaultHolding.findMany({
    where:  { status: 'active' },
    select: { id: true },
  });

  if (holdings.length === 0) {
    logger.info(`[SavingsVaultWorker] No active holdings on ${today}`);
    return;
  }

  const q = getQueue();
  if (q) {
    // Batch add to BullMQ — unique jobId prevents double-credit on same day
    const jobs = holdings.map((h: { id: string }) => ({
      name: 'interest',
      data: { holdingId: h.id, date: today } as SavingsVaultInterestJobData,
      opts: {
        jobId:            `savingsVault:${h.id}:${today}`, // dedup
        removeOnComplete: { count: 2_000 },
      },
    }));
    await q.addBulk(jobs);
    logger.info(`[SavingsVaultWorker] Dispatched ${holdings.length} interest jobs for ${today}`);
  } else {
    // Fallback: process inline sequentially
    logger.warn('[SavingsVaultWorker] Redis unavailable — processing inline');
    let processed = 0;
    for (const h of holdings) {
      try {
        await processSavingsVaultInterestJob({
          id:   `inline:${h.id}:${today}`,
          data: { holdingId: h.id, date: today },
        } as unknown as Job<SavingsVaultInterestJobData>);
        processed++;
      } catch (err: any) {
        logger.error(`[SavingsVaultWorker] inline failed holdingId=${h.id}: ${err.message}`);
      }
    }
    logger.info(`[SavingsVaultWorker] Inline processed ${processed}/${holdings.length} holdings`);
  }
}
