/**
 * robot-bet.worker.ts
 *
 * BullMQ worker — giả lập đặt cược tự động bởi tài khoản robot.
 *
 * Mục đích: tạo thanh khoản giả trên các kỳ xổ số đang mở để bảng bet
 * không trống, giúp giao diện game trông sống động hơn.
 *
 * Queue producer:
 *   enqueueRobotBet(botId)  — call from cron.ts every N seconds
 *
 * Worker consumer:
 *   startRobotBetWorker()   — call at server startup
 *
 * Bot users must be seeded in game_db with isRobot=true.
 * Worker only places bets when an open (isClosed=false) draw exists.
 */
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger }          from '../../shared/logger';
import { getPrismaClient } from '../../config/databases';

const QUEUE_NAME = 'robot-bet';
const REDIS_URL  = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// ── Shared BullMQ connection ──────────────────────────────────────────────────
let _conn: IORedis | null = null;

function getConn(): IORedis {
  if (!_conn) {
    _conn = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      lazyConnect: true,
    });
    _conn.on('error', (err: Error) =>
      logger.warn(`[RobotBet] Redis error: ${err.message}`),
    );
    _conn.connect().catch((err: Error) =>
      logger.warn(`[RobotBet] Redis connect failed: ${err.message}`),
    );
  }
  return _conn;
}

// ── Queue instance ────────────────────────────────────────────────────────────
let _queue: Queue | null = null;

function getQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_queue) {
    try {
      _queue = new Queue(QUEUE_NAME, {
        connection: getConn(),
        defaultJobOptions: {
          attempts: 2,
          backoff: { type: 'fixed', delay: 3_000 },
          removeOnComplete: { count: 500 },
          removeOnFail:     { count: 100 },
        },
      });
    } catch (err: any) {
      logger.warn(`[RobotBet] Queue init failed: ${err.message}`);
    }
  }
  return _queue;
}

// ── Job data shape ────────────────────────────────────────────────────────────
export interface RobotBetJobData {
  /** userId of the robot account */
  botId: string;
}

// ── Producer ──────────────────────────────────────────────────────────────────
/**
 * Enqueue a random-bet action for a specific bot.
 * Called from cron.ts on a short interval (e.g. every 30s per bot).
 */
export async function enqueueRobotBet(botId: string): Promise<void> {
  const queue = getQueue();
  if (!queue) {
    // Redis not available — run inline (dev only)
    logger.warn('[RobotBet] Queue unavailable — placing bet inline');
    await _placeBet(botId);
    return;
  }
  await queue.add('place-bet', { botId });
  logger.debug(`[RobotBet] Enqueued bet for botId=${botId}`);
}

/**
 * Enqueue bets for ALL active robot accounts.
 * Convenience helper called from cron.ts.
 */
export async function enqueueAllRobotBets(): Promise<void> {
  const gamePrisma = getPrismaClient('game');
  try {
    const bots = await gamePrisma.user.findMany({
      where:  { isRobot: true, status: 'active' },
      select: { id: true },
      take:   20, // cap at 20 bots per tick to avoid overload
    });
    if (bots.length === 0) {
      logger.debug('[RobotBet] No active robot accounts found');
      return;
    }
    for (const bot of bots) {
      await enqueueRobotBet(bot.id);
    }
  } catch (err: any) {
    logger.error(`[RobotBet] enqueueAllRobotBets failed: ${err.message}`);
  }
}

// ── Job processor ─────────────────────────────────────────────────────────────
async function processRobotBet(job: Job<RobotBetJobData>): Promise<void> {
  await _placeBet(job.data.botId);
}

async function _placeBet(botId: string): Promise<void> {
  const gamePrisma = getPrismaClient('game');

  // Pick a random active lottery type
  const types = await gamePrisma.lotteryType.findMany({
    where:  { active: true },
    select: { id: true },
  });
  if (types.length === 0) return;

  const type   = types[Math.floor(Math.random() * types.length)];

  // Find current open draw for that type
  const draw = await gamePrisma.lotteryDraw.findFirst({
    where:   { typeId: type.id, isClosed: false },
    orderBy: { drawTime: 'asc' },
    select:  { id: true },
  });
  if (!draw) return;

  // Randomise bet: 2-digit number 00–99, amount 10k–100k in 10k increments
  const betChoice  = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  const amountStep = 10_000;
  const amount     = amountStep * (1 + Math.floor(Math.random() * 10));

  await gamePrisma.lotteryBet.create({
    data: {
      userId:    botId,
      drawId:    draw.id,
      typeId:    type.id,
      betType:   'de',
      betChoice,
      amount,
      status:    'PENDING',
    },
  });

  logger.debug(`[RobotBet] botId=${botId} placed de bet ${betChoice} amount=${amount} drawId=${draw.id}`);
}

// ── Worker bootstrap ──────────────────────────────────────────────────────────
let _started = false;

/**
 * Start the robot-bet BullMQ worker.
 * Idempotent — safe to call multiple times.
 */
export function startRobotBetWorker(): void {
  if (_started || !REDIS_URL) return;
  _started = true;

  new Worker<RobotBetJobData>(QUEUE_NAME, processRobotBet, {
    connection:  getConn(),
    concurrency: 5, // 5 bots can place concurrently
  });

  logger.info('[RobotBet] Worker started (concurrency=5)');
}
