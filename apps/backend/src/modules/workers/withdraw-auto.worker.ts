import { Worker, Queue } from 'bullmq';
import { redis } from '../../utils/redis';
import { logger } from '../../shared/logger';

const { getPrismaClient } = require('../../config/databases');
const WalletService       = require('../../shared/services/walletService');
const notif               = require('../../shared/services/notificationService');
const riskService         = require('../../shared/services/riskService');
const tg                  = require('../../shared/services/telegramAlertService');
const PaymentFactory      = require('../../shared/payment/PaymentFactory');

const prisma      = getPrismaClient('game');
const adminPrisma = getPrismaClient('admin');
const walletService = new WalletService(prisma);

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
      type: 'withdraw',
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
      await tg.alertWithLevel('HIGH', `Withdraw Manual Review`, {
        'Withdraw ID': withdrawId,
        'User ID':     withdraw.userId,
        Amount:        withdraw.amount,
        Score:         riskResult.score,
      });
    }
  },
  { connection: redis, concurrency: 5 }
);

/**
 * Tự động xử lý lệnh rút cho user low-risk.
 * Gọi PaymentAdapter tương ứng với phương thức rút của user.
 */
async function processAutomatedWithdrawal(withdraw: any) {
  try {
    const factory = new PaymentFactory(adminPrisma);
    const adapter = await factory.getAdapter(withdraw.method ?? 'lkvip', prisma);

    const result = await adapter.processWithdraw({
      id:          withdraw.id,
      amount:      withdraw.amount,
      currency:    withdraw.currency ?? 'VND',
      address:     withdraw.address ?? null,
      bankInfo:    withdraw.bankInfo ?? null,
      processedBy: null, // automated
    });

    if (result.success) {
      await prisma.withdraw.update({
        where: { id: withdraw.id },
        data:  { status: 'completed', txId: result.txId ?? null, completedAt: new Date() },
      });
      notif.sendToUser(withdraw.userId, 'withdraw_success', {
        username: withdraw.user.username,
        amount:   withdraw.amount,
        time:     new Date(),
      });
      logger.info(`Withdraw ${withdraw.id} auto-processed via ${withdraw.method ?? 'lkvip'}`);
    } else {
      // Nếu adapter trả về lỗi, đẩy lên manual review
      await prisma.withdraw.update({
        where: { id: withdraw.id },
        data:  { status: 'manual_review', reason: result.error ?? 'Adapter returned failure' },
      });
      logger.warn(`Withdraw ${withdraw.id} fallback to manual_review: ${result.error}`);
    }
  } catch (err: any) {
    logger.error(`Withdraw ${withdraw.id} automated processing error: ${err.message}`);
    await prisma.withdraw.update({
      where: { id: withdraw.id },
      data:  { status: 'manual_review', reason: `System error: ${err.message}` },
    });
  }
}

/**
 * Gửi yêu cầu xác thực bổ sung (OTP / Email) cho lệnh rút medium-risk.
 */
async function requestAdditionalVerification(withdraw: any) {
  await prisma.withdraw.update({
    where: { id: withdraw.id },
    data:  { status: 'pending_verification' },
  });
  notif.sendToUser(withdraw.userId, 'withdraw_verify_required', {
    username: withdraw.user.username,
    amount:   withdraw.amount,
  });
  logger.info(`Requesting additional verification for withdrawal ${withdraw.id}`);
}
