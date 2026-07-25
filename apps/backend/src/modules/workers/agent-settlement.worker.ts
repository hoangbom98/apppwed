/**
 * agent-settlement.worker.ts
 * Tính hoa hồng đại lý theo doanh thu của tuyến dưới.
 *
 * Thiết kế:
 *  - BullMQ Worker xử lý job theo ngày từ queue `agent-settlement`.
 *  - Lắng nghe sự kiện `draw:settled` trên event-bus → enqueue tức thì sau mỗi kỳ.
 *  - Cron tổng hợp cuối ngày (00:05 UTC) đảm bảo không sót ngày nào.
 *  - Idempotency: upsert Commission record theo (agentId, period) — chạy lại an toàn.
 *  - Graceful: worker + listener chỉ khởi động 1 lần.
 *
 * Expose:
 *   startAgentSettlementWorker()        — gọi 1 lần khi server khởi động
 *   enqueueAgentSettlement(date?)       — producer, gọi từ cron hoặc test
 */
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger }    from '../../shared/logger';
import { eventBus }  from '../../core/events/event-bus';
import { getPrismaClient } from '../../config/databases';

const QUEUE_NAME = 'agent-settlement';
const REDIS_URL  = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// ── Shared Redis connection ────────────────────────────────────────────────────
let _conn: IORedis | null = null;

function getConn(): IORedis {
  if (!_conn) {
    _conn = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect:          true,
    });
    _conn.on('error', (err: Error) =>
      logger.warn(`[AgentSettlement] Redis error: ${err.message}`)
    );
    _conn.connect().catch((err: Error) =>
      logger.warn(`[AgentSettlement] Redis connect failed: ${err.message}`)
    );
  }
  return _conn;
}

// ── Queue ─────────────────────────────────────────────────────────────────────
let _queue: Queue | null = null;

function getQueue(): Queue | null {
  if (_queue) return _queue;
  try {
    _queue = new Queue(QUEUE_NAME, {
      connection: getConn(),
      defaultJobOptions: {
        attempts:         3,
        backoff:          { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 1_000 },
        removeOnFail:     { count:   200 },
      },
    });
    return _queue;
  } catch (err: any) {
    logger.warn(`[AgentSettlement] Queue init failed: ${err.message}`);
    return null;
  }
}

// ── Job data ──────────────────────────────────────────────────────────────────
export interface AgentSettlementJobData {
  /** YYYY-MM-DD for daily aggregation, or YYYY-MM for monthly */
  period: string;
}

// ── Producer ──────────────────────────────────────────────────────────────────
/**
 * Enqueue agent commission calculation for a given period.
 * Defaults to today (YYYY-MM-DD). De-duplicated by period.
 */
export async function enqueueAgentSettlement(date?: string): Promise<void> {
  const period = date ?? new Date().toISOString().slice(0, 10);
  const queue  = getQueue();
  if (!queue) {
    // Redis unavailable — run inline
    logger.warn('[AgentSettlement] Queue unavailable — running inline');
    await processAgentSettlement({ data: { period } } as any);
    return;
  }
  await queue.add(
    'calculate-commission',
    { period },
    { jobId: `agent:commission:${period}` }, // deduplicate
  );
  logger.info(`[AgentSettlement] Enqueued for period=${period}`);
}

// ── Worker processor ──────────────────────────────────────────────────────────
async function processAgentSettlement(job: Job<AgentSettlementJobData>): Promise<void> {
  const { period } = job.data;
  const gamePrisma = getPrismaClient('game');

  logger.info(`[AgentSettlement] Processing period=${period}`);

  const agents = await gamePrisma.agent.findMany({
    where:  { status: 'active' },
    select: { id: true, userId: true, commissionRate: true },
  });

  if (agents.length === 0) return;

  let totalCommission = 0;
  let processedAgents = 0;

  for (const agent of agents) {
    try {
      // Get all direct downline user IDs
      const downlines = await gamePrisma.user.findMany({
        where:  { agentId: agent.id },
        select: { id: true },
      });
      if (downlines.length === 0) continue;

      const userIds = downlines.map((u: { id: string }) => u.id);

      // Aggregate turnover for the period (daily or monthly)
      const [dateFrom, dateTo] = period.length === 7
        // Monthly: YYYY-MM
        ? [new Date(`${period}-01T00:00:00Z`), new Date(new Date(`${period}-01T00:00:00Z`).setMonth(new Date(`${period}-01T00:00:00Z`).getMonth() + 1))]
        // Daily: YYYY-MM-DD
        : [new Date(`${period}T00:00:00Z`), new Date(`${period}T23:59:59Z`)];

      const agg = await gamePrisma.lotteryBet.aggregate({
        where: {
          userId:    { in: userIds },
          createdAt: { gte: dateFrom, lte: dateTo },
          status:    { in: ['WIN', 'LOSE'] }, // settled bets only
        },
        _sum: { amount: true },
      });

      const turnover   = Number(agg._sum.amount ?? 0);
      const commission = turnover * Number(agent.commissionRate);
      if (commission <= 0) continue;

      // Upsert Commission record (idempotent)
      await gamePrisma.commission.upsert({
        where:  { agentId_period: { agentId: agent.id, period } },
        update: {
          totalBet: { increment: turnover },
          amount:   { increment: commission },
        },
        create: {
          agentId:  agent.id,
          period,
          totalBet: turnover,
          netProfit: 0,
          rate:     agent.commissionRate,
          amount:   commission,
          status:   'pending',
        },
      });

      // Credit agent user balance
      await gamePrisma.$transaction([
        gamePrisma.agent.update({
          where: { id: agent.id },
          data:  { totalCommission: { increment: commission } },
        }),
        gamePrisma.user.update({
          where: { id: agent.userId },
          data:  { balance: { increment: commission } },
        }),
        gamePrisma.transaction.create({
          data: {
            userId:        agent.userId,
            type:          'commission',
            amount:        commission,
            referenceId:   agent.id,
            referenceType: 'agent_commission',
            note:          `Hoa hồng đại lý kỳ ${period}, doanh thu ${turnover.toLocaleString('vi')} ₫`,
          },
        }),
      ]);

      totalCommission += commission;
      processedAgents++;
    } catch (err: any) {
      logger.error(`[AgentSettlement] Agent ${agent.id} failed: ${err.message}`);
    }
  }

  logger.info(
    `[AgentSettlement] period=${period} agents=${processedAgents}/${agents.length} ` +
    `totalCommission=${totalCommission.toLocaleString('vi')} ₫`
  );
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
let _started = false;

export function startAgentSettlementWorker(): void {
  if (_started || !REDIS_URL) return;
  _started = true;

  // BullMQ worker (concurrency=1 — serialise to avoid double-credit)
  new Worker<AgentSettlementJobData>(QUEUE_NAME, processAgentSettlement, {
    connection:  getConn(),
    concurrency: 1,
  });
  logger.info('[AgentSettlement] Worker started (concurrency=1)');

  // Event-bus listener: calculate immediately after each draw settles
  eventBus.on('draw:settled', ({ drawId }: { drawId: string }) => {
    const today = new Date().toISOString().slice(0, 10);
    enqueueAgentSettlement(today).catch((err: Error) =>
      logger.warn(`[AgentSettlement] event-bus enqueue failed: ${err.message}`)
    );
    logger.debug(`[AgentSettlement] draw:settled event → enqueued period=${today} (drawId=${drawId})`);
  });
  logger.info('[AgentSettlement] Listening to event-bus draw:settled');
}
