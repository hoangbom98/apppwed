import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redis } from '../../utils/redis';
import { logger } from '../../shared/logger';

const prisma = new PrismaClient();

// Worker chạy định kỳ để quét gian lận
export const fraudWorker = new Worker(
  'fraud-detection',
  async (job) => {
    // Lấy danh sách user chưa bị khóa
    const users = await prisma.user.findMany({
      where: { isLocked: false },
      select: { id: true, ip: true },
    });

    for (const user of users) {
      const fraudScore = await calculateFraudScore(user.id, user.ip || '');
      
      if (fraudScore >= 80) {
        // Tự động khóa tài khoản
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isLocked: true,
            lockReason: `Suspected fraud, score=${fraudScore}`,
            lockedAt: new Date(),
          },
        });
        logger.warn(`User ${user.id} auto-locked. Fraud score: ${fraudScore}`);
        // TODO: Gửi alert cho admin
      } else if (fraudScore >= 50) {
        // Gửi cảnh báo cho admin
        logger.info(`User ${user.id} has high fraud risk. Score: ${fraudScore}`);
        // TODO: Gửi alert cho admin
      }
    }
  },
  { connection: redis, concurrency: 1 }
);

async function calculateFraudScore(userId: string, ip: string): Promise<number> {
  let score = 0;

  // 1. Kiểm tra số lượng tài khoản cùng IP
  const usersWithSameIp = await prisma.user.count({ where: { ip } });
  if (usersWithSameIp > 5) score += (usersWithSameIp - 5) * 10;

  // 2. Kiểm tra số lần đăng nhập thất bại từ Redis (giả định có lưu key này)
  const failedAttempts = await redis.get(`login:fail:${userId}`);
  if (failedAttempts && parseInt(failedAttempts) > 5) score += parseInt(failedAttempts) * 5;

  // 3. Tỷ lệ thắng bất thường (Ví dụ: > 90% trên 50 giao dịch)
  const totalTxs = await prisma.walletTransaction.count({ where: { userId, type: 'bet' } });
  if (totalTxs > 50) {
    const winTxs = await prisma.walletTransaction.count({ where: { userId, type: 'win' } });
    const winRate = winTxs / totalTxs;
    if (winRate > 0.9) score += 40;
  }

  return Math.min(score, 100);
}
