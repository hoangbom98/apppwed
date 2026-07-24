// @ts-nocheck
'use strict';
/**
 * gameWorkers.ts — BullMQ workers for game background processing.
 * 
 * Learned from BoYue: long-running workers (Workerman) process tasks faster
 * and more reliably than cron — can handle sub-minute intervals with retries.
 *
 * Workers:
 *   game-bet-stats   — aggregate wager data into BetStats after each settled round
 *   game-rebate      — batch calculate + settle daily rebates
 *
 * Queue producers (call from game controllers after bet settles):
 *   enqueueBetStats(data)   — called by gscSeamlessController, TCGaming callback, lotteryController
 *
 * Usage:
 *   import { startGameWorkers, enqueueBetStats } from './gameWorkers';
 *   startGameWorkers(); // call once at server startup
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
          attempts:  3,
          backoff:   { type: 'exponential', delay: 2_000 },
          removeOnComplete: { count: 5_000 },
          removeOnFail:     { count:   500 },
        },
      });
    } catch (err: any) {
      logger.warn(`[GameWorkers] betStatsQueue init failed: ${err.message}`);
    }
  }
  return _betStatsQueue;
}

/**
 * Enqueue a bet stats update job.
 * Call this from any game callback after a round is settled.
 * The job is de-duplicated: if the same userId+date+gameType+aggregator is
 * already pending, BullMQ will coalesce (no duplicate DB writes).
 */
export async function enqueueBetStats(data: BetStatsJob): Promise<void> {
  const queue = getBetStatsQueue();
  if (!queue) {
    // Fallback: process inline if Redis unavailable
    logger.warn('[GameWorkers] betStatsQueue unavailable — processing inline');
    await processBetStatsInline(data);
    return;
  }
  const date  = data.date || new Date().toISOString().split('T')[0];
  const jobId = `betstats:${data.userId}:${date}:${data.gameType}:${data.aggregator}`;
  // Use a merge strategy: if job already exists with same id, update amounts
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
  } catch (err: any) {
    logger.error('[GameWorkers] inline processBetStats failed', { err: err.message });
  }
}

// ── Worker bootstrap ──────────────────────────────────────────────────────────

let _workersStarted = false;

/**
 * Start all game BullMQ workers.
 * Call once at server startup. Safe to call multiple times (idempotent).
 */
export function startGameWorkers(): void {
  if (_workersStarted || !REDIS_URL) return;
  _workersStarted = true;

  // Worker 1: game-bet-stats — aggregate bet data into BetStats table
  try {
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
      {
        connection:  getConn(),
        concurrency: 10, // handle 10 concurrent bet events
      },
    );
    logger.info('[GameWorkers] game-bet-stats worker started (concurrency=10)');
  } catch (err: any) {
    logger.warn(`[GameWorkers] game-bet-stats worker failed to start: ${err.message}`);
  }

  // Worker 2: game-rebate — triggered by cron to calculate/settle rebates
  try {
    new Worker(
      'game-rebate',
      async (job: Job) => {
        const { action, betDate } = job.data;
        const { getPrismaClient } = require('../../config/databases');
        const RebateService = require('../services/rebateService');
        const gamePrisma = getPrismaClient('game');
        const rebateSvc  = new RebateService(gamePrisma, logger);

        if (action === 'calculate') {
          const { created, totalAmount } = await rebateSvc.calculateDailyRebates(betDate);
          logger.info(`[RebateWorker] calculate job=${job.id} betDate=${betDate} created=${created} total=${totalAmount.toString()}`);
        } else if (action === 'settle') {
          const { settled, totalAmount } = await rebateSvc.settleDailyRebates(betDate);
          logger.info(`[RebateWorker] settle job=${job.id} betDate=${betDate} settled=${settled} total=${totalAmount.toString()}`);
        }
      },
      {
        connection:  getConn(),
        concurrency: 1, // rebate settlement is sequential — avoid double-settle
      },
    );
    logger.info('[GameWorkers] game-rebate worker started (concurrency=1)');
  } catch (err: any) {
    logger.warn(`[GameWorkers] game-rebate worker failed to start: ${err.message}`);
  }
}
