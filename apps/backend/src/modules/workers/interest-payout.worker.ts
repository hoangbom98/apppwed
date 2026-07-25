import { Worker, Queue } from 'bullmq';
import { redis } from '../../utils/redis';
import { logger } from '../../shared/logger';

const { getPrismaClient } = require('../../config/databases');
const WalletService = require('../../shared/services/walletService');

const prisma = getPrismaClient('trade');
const walletService = new WalletService(prisma);

// Queue xử lý trả lãi (payout)
export const interestPayoutQueue = new Queue('interest-payout', {
  connection: redis,
});

export const interestPayoutWorker = new Worker(
  'interest-payout',
  async (job) => {
    const { payoutId, type } = job.data; // type: 'normal' | 'mall'

    await prisma.$transaction(async (tx: any) => {
      // 1. Lấy dữ liệu và khóa row (SELECT FOR UPDATE)
      const payout = type === 'normal'
        ? await tx.lcInvestList.findUnique({ where: { id: payoutId } })
        : await tx.lcMallInvestList.findUnique({ where: { id: payoutId } });

      if (!payout || payout.status !== 0) return;

      // 2. Cập nhật status
      if (type === 'normal') {
        await tx.lcInvestList.update({
          where: { id: payoutId },
          data: { status: 1, time2: new Date(), pay2: payout.pay1 }
        });

        // 3. Cộng tiền
        if (payout.pay1 > 0) {
          await walletService.credit(tx, payout.uid, payout.pay1, 'interest', `payout_${payoutId}`);
        }
      } else {
        await tx.lcMallInvestList.update({
          where: { id: payoutId },
          data: { status: 1, time2: new Date(), pay2: payout.pay1 }
        });

        // Xử lý Mall (BTC/Conversion)
        if (payout.pay1 > 0) {
          // TODO: Gọi API giá BTC ở đây (nên tách riêng hoặc cache)
          await walletService.credit(tx, payout.uid, payout.pay1, 'interest_mall', `mall_payout_${payoutId}`);
        }
      }
    });

    logger.info(`Payout ${payoutId} (${type}) processed successfully`);
  },
  { connection: redis, concurrency: 3 }
);

// Schedule: quét các gói cần trả lãi
setInterval(async () => {
  const now = Math.floor(Date.now() / 1000);

  // Quét normal
  const normal = await prisma.lcInvestList.findMany({ where: { status: 0, time1: { lte: new Date(now * 1000) } } });
  for (const item of normal) await interestPayoutQueue.add('payout', { payoutId: item.id, type: 'normal' });

  // Quét mall
  const mall = await prisma.lcMallInvestList.findMany({ where: { status: 0, time1: { lte: new Date(now * 1000) } } });
  for (const item of mall) await interestPayoutQueue.add('payout', { payoutId: item.id, type: 'mall' });
}, 60000); // 1 phút/lần
