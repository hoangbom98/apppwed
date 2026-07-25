/**
 * lottery-settlement.worker.ts
 *
 * BullMQ worker — trả thưởng xổ số bất đồng bộ, tách hoàn toàn khỏi HTTP request cycle.
 *
 * Nâng cấp so với baseline:
 *  1. Queue producer `enqueueLotterySettlement()` — lotteryController gọi thay vì settle inline.
 *  2. Idempotency: skip nếu draw chưa ở trạng thái DRAWN hoặc đã settled.
 *  3. Atomic transaction: settle tất cả bets + credit winners trong 1 Prisma $transaction.
 *  4. Socket.IO realtime push `lottery:result` sau khi settle xong.
 *  5. Proper BullMQ Redis connection (REDIS_URL from env, maxRetriesPerRequest: null).
 *
 * Sử dụng:
 *   // server startup
 *   import { startLotterySettlementWorker } from './lottery-settlement.worker';
 *   startLotterySettlementWorker();
 *
 *   // lotteryController.setResult
 *   import { enqueueLotterySettlement } from './lottery-settlement.worker';
 *   await enqueueLotterySettlement(drawId);
 */
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../../shared/logger';
import { getPrismaClient } from '../../config/databases';

const QUEUE_NAME = 'lottery-settlement';
const REDIS_URL  = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// ── BullMQ requires a dedicated connection (maxRetriesPerRequest: null) ────────
let _conn: IORedis | null = null;

function getConn(): IORedis {
  if (!_conn) {
    _conn = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    _conn.on('error', (err: Error) =>
      logger.warn(`[LotterySettlement] Redis error: ${err.message}`)
    );
    _conn.connect().catch((err: Error) =>
      logger.warn(`[LotterySettlement] Redis connect failed: ${err.message}`)
    );
  }
  return _conn;
}

// ── Queue instance (lazy) ─────────────────────────────────────────────────────
let _queue: Queue | null = null;

function getQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_queue) {
    try {
      _queue = new Queue(QUEUE_NAME, {
        connection: getConn(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3_000 }, // 3s → 6s → 12s
          removeOnComplete: { count: 5_000 },
          removeOnFail:     { count:   500 },
        },
      });
    } catch (err: any) {
      logger.warn(`[LotterySettlement] Queue init failed: ${err.message}`);
    }
  }
  return _queue;
}

// ── Job data shape ─────────────────────────────────────────────────────────────
export interface LotterySettlementJobData {
  drawId:  string;
  project: string; // always 'game'
}

// ── Producer ───────────────────────────────────────────────────────────────────
/**
 * Enqueue settlement for a draw.
 * De-duplicated by drawId — safe to call multiple times (BullMQ dedup by jobId).
 *
 * @example
 *   await enqueueLotterySettlement(drawId);
 *   res.json({ success: true });  // respond immediately, settlement happens async
 */
export async function enqueueLotterySettlement(drawId: string): Promise<void> {
  const queue = getQueue();
  if (!queue) {
    // Redis unavailable — fall back to inline settlement
    logger.warn('[LotterySettlement] Queue unavailable — settling inline');
    await processLotterySettlement({ data: { drawId, project: 'game' } } as any);
    return;
  }
  await queue.add(
    'settle-draw',
    { drawId, project: 'game' },
    { jobId: `lottery:settle:${drawId}` }, // deduplicate
  );
  logger.info(`[LotterySettlement] Enqueued drawId=${drawId}`);
}

// ── Worker processor ───────────────────────────────────────────────────────────
async function processLotterySettlement(job: Job<LotterySettlementJobData>): Promise<void> {
  const { drawId } = job.data;
  const gamePrisma = getPrismaClient('game');

  logger.info(`[LotterySettlement] Start settle drawId=${drawId} attempt=${(job as any).attemptsMade ?? 0}`);

  // 1. Guard: draw must be DRAWN with a result
  const draw = await gamePrisma.lotteryDraw.findUnique({ where: { id: drawId } });
  if (!draw || draw.status !== 'DRAWN' || !draw.resultOfficial) {
    logger.warn(`[LotterySettlement] Draw ${drawId} not ready — status=${draw?.status} result=${draw?.resultOfficial}`);
    return; // not an error, just skip
  }

  // 2. Fetch only PENDING bets (idempotency: already settled bets are ignored)
  const bets = await gamePrisma.lotteryBet.findMany({ where: { drawId, status: 'PENDING' } });
  if (bets.length === 0) {
    logger.info(`[LotterySettlement] No pending bets for draw ${drawId} — already settled`);
    return;
  }

  // 3. Resolve odds multiplier
  const oddsSetting = await gamePrisma.oddsSetting
    .findFirst({ where: { typeId: draw.typeId } })
    .catch(() => null);
  const multiplier = Number(oddsSetting?.rate ?? 2);

  // 4. Atomic settle: update all bets + credit winners in one transaction
  const winners: Array<{ userId: string; payout: number; betId: string }> = [];

  await gamePrisma.$transaction(
    bets.flatMap((bet) => {
      const won    = String(bet.betChoice) === String(draw.resultOfficial);
      const payout = won ? Number(bet.amount) * multiplier : 0;

      if (won) {
        winners.push({ userId: bet.userId, payout, betId: bet.id });
      }

      const ops: any[] = [
        gamePrisma.lotteryBet.update({
          where: { id: bet.id },
          data:  { status: won ? 'WIN' : 'LOSE', payout, settledAt: new Date() },
        }),
      ];

      if (won) {
        ops.push(
          gamePrisma.user.update({
            where: { id: bet.userId },
            data:  { balance: { increment: payout } },
          }),
          gamePrisma.transaction.create({
            data: {
              userId:        bet.userId,
              type:          'lottery_win',
              amount:        payout,
              referenceId:   bet.id,
              referenceType: 'lottery_bet',
              note:          `Thắng cược xổ số kỳ ${draw.period}`,
            },
          }),
        );
      }
      return ops;
    }),
  );

  // 5. Realtime push: notify each winner + broadcast draw result to all game users
  try {
    const { emitToUser, emitToProject } = require('../../config/socket');

    // Push to every winner individually
    for (const w of winners) {
      emitToUser(w.userId, 'lottery:win', {
        drawId,
        period:  draw.period,
        result:  draw.resultOfficial,
        payout:  w.payout,
        betId:   w.betId,
      });
    }

    // Broadcast result to all users in the game project room
    emitToProject('game', 'lottery:result', {
      drawId,
      period:   draw.period,
      result:   draw.resultOfficial,
      settledAt: new Date().toISOString(),
      winners:  winners.length,
    });
  } catch (socketErr: any) {
    // Non-fatal — settlement is already committed to DB
    logger.warn(`[LotterySettlement] Socket push failed: ${socketErr.message}`);
  }

  logger.info(
    `[LotterySettlement] Complete drawId=${drawId} period=${draw.period} ` +
    `bets=${bets.length} winners=${winners.length}`
  );
}

// ── Worker bootstrap ───────────────────────────────────────────────────────────
let _started = false;

/**
 * Start the lottery settlement BullMQ worker.
 * Idempotent — safe to call multiple times.
 */
export function startLotterySettlementWorker(): void {
  if (_started || !REDIS_URL) return;
  _started = true;

  // Ensure queue is created before worker
  getQueue();

  new Worker<LotterySettlementJobData>(QUEUE_NAME, processLotterySettlement, {
    connection:  getConn(),
    concurrency: 3, // 3 draws can settle concurrently
  });

  logger.info('[LotterySettlement] Worker started (concurrency=3)');
}
