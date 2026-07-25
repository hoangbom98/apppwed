/**
 * rebate.worker.ts
 * Worker kết toán hoàn trả (Rebate/Fanshui) hàng ngày.
 */
import { Worker, type Job } from 'bullmq';
import { logger } from '../../shared/logger';
import { getPrismaClient } from '../../config/databases';

const QUEUE_NAME = 'rebate-settlement';

export interface RebateJobData {
  date: string; // YYYY-MM-DD
}

async function processRebate(job: Job<RebateJobData>): Promise<void> {
  const { date } = job.data;
  const gamePrisma = getPrismaClient('game');
  
  logger.info(`[RebateWorker] Processing rebate for ${date}`);
  
  // 1. Quét dữ liệu cược (bet_stats) của user trong ngày
  const stats = await gamePrisma.betStats.findMany({
    where: { date }
  });
  
  // 2. Tính hoàn trả theo cấp bậc VIP và cập nhật
  for (const stat of stats) {
    const user = await gamePrisma.user.findUnique({ where: { id: stat.userId } });
    if (!user) continue;

    // Lấy tỷ lệ hoàn trả dựa trên gameType và VIP level (đã có trong RebateController cũ)
    const rebateAmount = Number(stat.validBet) * 0.005; // Tỷ lệ mẫu 0.5%
    
    if (rebateAmount > 0) {
      await gamePrisma.$transaction([
        gamePrisma.rebate.create({
          data: {
            userId: stat.userId,
            betDate: date,
            gameType: stat.gameType,
            validBet: stat.validBet,
            rate: 0.005,
            amount: rebateAmount,
            status: 'claimable'
          }
        }),
        gamePrisma.user.update({
          where: { id: stat.userId },
          data: { balance: { increment: rebateAmount } }
        })
      ]);
    }
  }
}

export function startRebateWorker(): void {
  const worker = new Worker(QUEUE_NAME, processRebate, {
    connection: { host: '127.0.0.1', port: 6379 },
    concurrency: 1,
  });
  logger.info('[RebateWorker] Worker started');
}
