import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redis } from '../../utils/redis';
import { WalletService } from '../../shared/services/walletService';
import { NotificationService } from '../../shared/services/notificationService';
import { logger } from '../../shared/logger';

const prisma = new PrismaClient();
const walletService = new WalletService();
const notif = new NotificationService();

// Queue xử lý deposit
export const depositQueue = new Queue('deposit-processing', {
  connection: redis,
});

export const depositWorker = new Worker(
  'deposit-processing',
  async (job) => {
    const { depositId } = job.data;
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { user: true },
    });
    if (!deposit || deposit.status !== 'pending') return;

    // TODO: Implement checkExternalTransaction logic based on payment gateway
    // const matched = await checkExternalTransaction(deposit);
    const matched = null; // Placeholder

    if (!matched) {
      if (deposit.createdAt < new Date(Date.now() - 30 * 60 * 1000)) {
        await prisma.deposit.update({
          where: { id: depositId },
          data: { status: 'expired' },
        });
        logger.warn(`Deposit ${depositId} expired`);
      }
      return;
    }

    // Xử lý thành công
    await prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          txId: matched.txId,
        },
      });

      await walletService.credit(
        deposit.userId,
        deposit.amount,
        `deposit_${depositId}`,
        'BANK_AUTO',
        tx
      );

      // Check bonus
      const isFirstDeposit = await tx.deposit.count({
        where: { userId: deposit.userId, status: 'completed' },
      }) <= 1;
      if (isFirstDeposit) {
        await walletService.credit(
          deposit.userId,
          deposit.amount * 0.1, // 10% bonus
          `first_deposit_bonus_${depositId}`,
          'BONUS',
          tx
        );
      }
    });

    await notif.sendNotification('deposit_success', {
      username: deposit.user.username,
      amount: deposit.amount,
      time: new Date(),
    }, { telegram: deposit.user.telegramChatId, email: deposit.user.email });

    logger.info(`Deposit ${depositId} auto-processed`);
  },
  { connection: redis, concurrency: 5 }
);

// Schedule: chạy mỗi 30s
setInterval(async () => {
  const pending = await prisma.deposit.findMany({
    where: { status: 'pending' },
    take: 100,
  });
  for (const dep of pending) {
    await depositQueue.add('process', { depositId: dep.id });
  }
}, 30000);
