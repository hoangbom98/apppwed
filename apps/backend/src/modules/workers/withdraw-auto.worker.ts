import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redis } from '../../utils/redis';
import { WalletService } from '../../shared/services/walletService';
import { NotificationService } from '../../shared/services/notificationService';
import * as riskService from '../../shared/services/riskService';
import { logger } from '../../shared/logger';

const prisma = new PrismaClient();
const walletService = new WalletService();
const notif = new NotificationService();

// Queue xử lý rút tiền
export const withdrawQueue = new Queue('withdraw-processing', {
  connection: redis,
});

export const withdrawWorker = new Worker(
  'withdraw-processing',
  async (job) => {
    const { withdrawId } = job.data;
    
    // Fetch withdraw request
    const withdraw = await prisma.withdraw.findUnique({
      where: { id: withdrawId },
      include: { user: true },
    });
    
    if (!withdraw || withdraw.status !== 'pending') return;

    // 1. Kiểm tra KYC cơ bản
    if (!withdraw.user.kycVerified) {
      await prisma.withdraw.update({
        where: { id: withdrawId },
        data: { status: 'rejected', reason: 'KYC_PENDING' },
      });
      return;
    }

    // 2. Risk Engine Assessment
    const riskResult = await riskService.evaluate(prisma, {
        userId: withdraw.userId,
        amount: withdraw.amount,
        type: 'withdraw'
    });

    // 3. Phân luồng dựa trên điểm rủi ro
    if (riskResult.risk === 'low') {
        // Tự động duyệt cho user uy tín (low risk)
        await processAutomatedWithdrawal(withdraw);
    } else if (riskResult.risk === 'medium') {
        // Cần xác thực thêm (OTP/Email)
        await requestAdditionalVerification(withdraw);
    } else {
        // High Risk: Đẩy vào hàng đợi chờ Admin kiểm duyệt thủ công
        await prisma.withdraw.update({
          where: { id: withdrawId },
          data: { status: 'manual_review', reason: `High risk: ${riskResult.flags.join(', ')}` },
        });
        logger.warn(`Withdraw ${withdrawId} pushed to manual review. Score: ${riskResult.score}`);
    }
  },
  { connection: redis, concurrency: 5 }
);

async function processAutomatedWithdrawal(withdraw: any) {
    // Logic gọi API ngân hàng/đối tác chuyển tiền ở đây
    logger.info(`Processing automated withdrawal for ${withdraw.id}`);
    // ...
}

async function requestAdditionalVerification(withdraw: any) {
    // Logic gửi OTP/Email xác thực
    logger.info(`Requesting additional verification for withdrawal ${withdraw.id}`);
    await prisma.withdraw.update({
        where: { id: withdraw.id },
        data: { status: 'pending_verification' }
    });
}
