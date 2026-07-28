'use strict';
/**
 * gameWorkers.ts — BullMQ workers for game background processing.
 *
 * Workers:
 *   game-bet-stats   — aggregate wager data into BetStats after each settled round
 *   game-rebate      — batch calculate + settle daily rebates
 *
 * Queue producers:
 *   enqueueBetStats(data) — called by gscSeamlessController, TCGaming callback, lotteryController
 */

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const logger = require('../services/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// ── Shared BullMQ connection ──────────────────────────────────────────────────
let _conn: IORedis | null = null;
function getConn(): IORedis {
  if (!_conn) {
    _conn = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      lazyConnect: true,
    });
    _conn.on('error', (err: Error) => logger.warn(`[GameWorkers] Redis error: ${err.message}`));
    _conn.connect().catch((err: Error) =>
      logger.warn(`[GameWorkers] Redis connect failed: ${err.message}`),
    );
  }
  return _conn;
}

// ── Queue definitions ─────────────────────────────────────────────────────────

export interface BetStatsJob {
  userId:     string;
  gameType:   string;   // live | slot | lottery | sports
  aggregator: string;   // GSC | GOLDGATE | TCGAMING
  validBet:   number;
  totalBet:   number;
  totalWin:   number;
  date?:      string;   // "YYYY-MM-DD" — defaults to today if omitted
}

let _betStatsQueue: Queue | null = null;

export function getBetStatsQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (!_betStatsQueue) {
    try {
      _betStatsQueue = new Queue('game-bet-stats', {
        connection: getConn(),
        defaultJobOptions: {
          attempts: 3,
          backoff:  { type: 'exponential', delay: 2_000 },
          removeOnComplete: { count: 5_000 },
          removeOnFail:     { count:   500 },
        },
      });
    } catch (err: unknown) {
      logger.warn(`[GameWorkers] betStatsQueue init failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  return _betStatsQueue;
}

/**
 * Enqueue a bet stats update job.
 * De-duplicated: same userId+date+gameType+aggregator coalesces into one job.
 */
export async function enqueueBetStats(data: BetStatsJob): Promise<void> {
  const queue = getBetStatsQueue();
  if (!queue) {
    logger.warn('[GameWorkers] betStatsQueue unavailable — processing inline');
    await processBetStatsInline(data);
    return;
  }
  const date  = data.date || new Date().toISOString().split('T')[0];
  const jobId = `betstats:${data.userId}:${date}:${data.gameType}:${data.aggregator}`;
  await queue.add('update-bet-stats', { ...data, date }, { jobId, removeOnComplete: { count: 2000 } });
}

// ── Inline fallback (when Redis is down) ─────────────────────────────────────
async function processBetStatsInline(data: BetStatsJob): Promise<void> {
  try {
    const { getPrismaClient } = require('../../config/databases');
    const RebateService = require('../services/rebateService');
    const gamePrisma = getPrismaClient('game');
    const rebateSvc  = new RebateService(gamePrisma, logger);
    await rebateSvc.trackBet(
      data.userId,
      data.gameType,
      data.validBet,
      data.totalBet,
      data.totalWin,
      data.aggregator,
      data.date,
    );
  } catch (err: unknown) {
    logger.error('[GameWorkers] inline processBetStats failed', { err: err instanceof Error ? err.message : err });
  }
}

// ── Worker bootstrap ──────────────────────────────────────────────────────────

let _workersStarted = false;

/**
 * Start all game BullMQ workers.
 * Call once at server startup — idempotent.
 */
export function startGameWorkers(): void {
  if (_workersStarted || !REDIS_URL) return;
  _workersStarted = true;

  const tryStart = (name: string, fn: () => void): void => {
    try {
      fn();
      logger.info(`[GameWorkers] ${name} started`);
    } catch (err: unknown) {
      logger.warn(`[GameWorkers] ${name} failed to start: ${err instanceof Error ? err.message : err}`);
    }
  };

  tryStart('game-rebate', () => {
    const { startRebateWorker } = require('../../modules/workers/rebate.worker');
    startRebateWorker();
  });

  tryStart('game-yuebao-interest', () => {
    const { startYuebaoInterestWorker } = require('../../modules/workers/yuebao-interest.worker');
    startYuebaoInterestWorker();
  });

  tryStart('lottery-settlement', () => {
    const { startLotterySettlementWorker } = require('../../modules/workers/lottery-settlement.worker');
    startLotterySettlementWorker();
  });

  tryStart('lkvip-webhook-retry', () => {
    const { startLkvipWebhookWorker } = require('../../modules/workers/lkvip-webhook-retry.worker');
    startLkvipWebhookWorker();
  });

  tryStart('agent-settlement', () => {
    const { startAgentSettlementWorker } = require('../../modules/workers/agent-settlement.worker');
    startAgentSettlementWorker();
  });

  tryStart('robot-bet', () => {
    const { startRobotBetWorker } = require('../../modules/workers/robot-bet.worker');
    startRobotBetWorker();
  });

  // Worker: game-bet-stats
  tryStart('game-bet-stats (concurrency=10)', () => {
    new Worker<BetStatsJob>(
      'game-bet-stats',
      async (job: Job<BetStatsJob>) => {
        const { userId, gameType, validBet, totalBet, totalWin, aggregator, date } = job.data;
        const { getPrismaClient } = require('../../config/databases');
        const RebateService = require('../services/rebateService');
        const gamePrisma = getPrismaClient('game');
        const rebateSvc  = new RebateService(gamePrisma, logger);
        await rebateSvc.trackBet(userId, gameType, validBet, totalBet, totalWin, aggregator, date);
        logger.debug(`[BetStatsWorker] Processed job=${job.id} userId=${userId} gameType=${gameType} validBet=${validBet}`);
      },
      { connection: getConn(), concurrency: 10 },
    );
  });
}
