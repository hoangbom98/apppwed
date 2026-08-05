import { Worker, Queue } from 'bullmq';
import { redis } from '../../utils/redis';
import { logger } from '../../shared/logger';

const { getPrismaClient } = require('../../config/databases');
const WalletService = require('../../shared/services/walletService');
const notif = require('../../shared/services/notificationService');
const PaymentFactory = require('../../shared/payment/PaymentFactory');

const prisma = getPrismaClient('game');
const adminPrisma = getPrismaClient('admin');
const walletService = new WalletService(prisma);

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

    // Xác minh giao dịch qua PaymentAdapter tương ứng
    let matched: { success: boolean; txId?: string; amount?: number } | null = null;
    try {
      const factory = new PaymentFactory(adminPrisma);
      const adapter = await factory.getAdapter(deposit.method ?? 'lkvip', prisma);
      const result  = await adapter.checkStatus(deposit.txRef ?? deposit.id);
      if (result.status === 'completed' || result.status === 'success' || result.status === 'paid') {
        matched = { success: true, txId: result.txId ?? deposit.txRef };
      }
    } catch (err: any) {
      logger.warn(`Deposit ${depositId}: payment adapter check failed — ${err.message}`);
    }

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
    await prisma.$transaction(async (tx: any) => {
      await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          txId: matched!.txId ?? null,
        },
      });

      await walletService.credit(
        tx,
        deposit.userId,
        deposit.amount,
        'deposit',
        `deposit_${depositId}`,
      );

      // Check bonus nạp lần đầu
      const isFirstDeposit = await tx.deposit.count({
        where: { userId: deposit.userId, status: 'completed' },
      }) <= 1;
      if (isFirstDeposit) {
        await walletService.credit(
          tx,
          deposit.userId,
          deposit.amount * 0.1, // 10% bonus
          'bonus',
          `first_deposit_bonus_${depositId}`,
        );
      }
    });

    notif.sendToUser(deposit.userId, 'deposit_success', {
      username: deposit.user.username,
      amount: deposit.amount,
      time: new Date(),
    });

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
