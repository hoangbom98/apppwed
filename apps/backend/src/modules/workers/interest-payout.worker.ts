import { Worker, Queue } from 'bullmq';
import { redis } from '../../utils/redis';
import { logger } from '../../shared/logger';
import Decimal from 'decimal.js';

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
    const { payoutId, type } = job.data;

    await prisma.$transaction(async (tx: any) => {
      // 1. Lấy dữ liệu và khóa row (SELECT FOR UPDATE)
      let payout;
      if (type === 'normal') {
          payout = await tx.lcInvestList.findUnique({ where: { id: payoutId } });
      } else {
          payout = await tx.lcMallInvestList.findUnique({ where: { id: payoutId } });
      }

      if (!payout || payout.status !== 0) return;

      // Lock row
      if (type === 'normal') {
          await tx.lcInvestList.update({ where: { id: payoutId }, data: { status: 1 } });
      } else {
          await tx.lcMallInvestList.update({ where: { id: payoutId }, data: { status: 1 } });
      }

      // 2. Cộng tiền với Decimal.js
      const pay1 = new Decimal(payout.pay1);

      if (pay1.gt(0)) {
          if (type === 'normal') {
            await walletService.credit(tx, payout.uid, pay1.toNumber(), 'interest', `payout_${payoutId}`);
          } else {
            // Xử lý Mall
            await walletService.credit(tx, payout.uid, pay1.toNumber(), 'interest_mall', `mall_payout_${payoutId}`);
          }
      }

      // 3. Finalize update
      if (type === 'normal') {
        await tx.lcInvestList.update({
          where: { id: payoutId },
          data: { time2: new Date(), pay2: pay1.toNumber() }
        });
      } else {
        await tx.lcMallInvestList.update({
          where: { id: payoutId },
          data: { time2: new Date(), pay2: pay1.toNumber() }
        });
      }
    });

    logger.info(`Payout ${payoutId} (${type}) processed successfully`);
  },
  { connection: redis, concurrency: 3 }
);
