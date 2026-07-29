import { interestPayoutQueue } from '../../modules/workers/interest-payout.worker';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require('../logger');
const { getPrismaClient } = require('../databases');
const prisma = getPrismaClient('trade');

export const registerInterestPayoutCron = () => {
  // Use node-cron as per the rest of the system
  const cron = require('node-cron');

  cron.schedule('* * * * *', async () => {
    logger.info('[InterestPayoutCron] Starting payout scan');
    const now = Math.floor(Date.now() / 1000);

    // Scan normal
    const normal = await prisma.lcInvestList.findMany({ 
      where: { status: 0, time1: { lte: new Date(now * 1000) } } 
    });
    for (const item of normal) {
      await interestPayoutQueue.add('payout', { payoutId: item.id, type: 'normal' });
    }

    // Scan mall
    const mall = await prisma.lcMallInvestList.findMany({ 
      where: { status: 0, time1: { lte: new Date(now * 1000) } } 
    });
    for (const item of mall) {
      await interestPayoutQueue.add('payout', { payoutId: item.id, type: 'mall' });
    }
    
    logger.info(`[InterestPayoutCron] Enqueued ${normal.length + mall.length} payouts`);
  });
};
