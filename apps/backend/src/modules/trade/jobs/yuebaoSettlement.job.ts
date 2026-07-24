// @ts-nocheck
'use strict';
/**
 * yuebaoSettlement.job.ts — Auto-settle matured Yuebao investments
 * Schedule: 0 2 * * * (02:00 UTC daily)
 *
 * Logic:
 * 1. Find ACTIVE investments where endDate <= now
 * 2. Calculate profit = amount * interestRate / 100
 * 3. Return principal + profit to user wallet
 * 4. Mark as COMPLETED
 */

export async function runYuebaoSettlement(prisma: any, io?: any) {
  const now = new Date();

  const matured = await prisma.yuebaoInvestment.findMany({
    where:   { status: 'active', endDate: { lte: now } },
    include: { product: true },
  });

  let settled = 0, errors = 0;

  for (const inv of matured) {
    try {
      const profit  = parseFloat(inv.amount) * parseFloat(inv.product.interestRate) / 100;
      const total   = parseFloat(inv.amount) + profit;

      await prisma.$transaction(async (tx: any) => {
        await tx.yuebaoInvestment.update({
          where: { id: inv.id },
          data:  { status: 'completed', profitPaid: profit, settledAt: now },
        });
        const wallet = await tx.wallet.findUnique({ where: { userId: inv.userId } });
        const newBal = (wallet ? parseFloat(wallet.balance) : 0) + total;
        await tx.wallet.upsert({
          where:  { userId: inv.userId },
          update: { balance: { increment: total }, frozen: { decrement: parseFloat(inv.amount) } },
          create: { userId: inv.userId, balance: total, frozen: 0 },
        });
        await tx.transaction.create({
          data: {
            userId:        inv.userId,
            type:          'yuebao_settle',
            amount:        total,
            balanceAfter:  newBal,
            referenceId:   inv.id,
            referenceType: 'yuebao_investment',
            note:          `Yuebao đáo hạn: ${inv.product.title} — lãi ${profit.toFixed(2)}`,
          },
        });
      });

      if (io) {
        io.to(`user:${inv.userId}`).emit('notification', {
          title:   'Yuebao đáo hạn',
          content: `Nhận ${total.toFixed(2)} (gốc + lãi ${profit.toFixed(2)})`,
        });
      }
      settled++;
    } catch (err: any) {
      console.error(`[yuebaoSettlement] error for inv ${inv.id}:`, err.message);
      errors++;
    }
  }

  console.log(`[yuebaoSettlement] settled=${settled}, errors=${errors}`);
  return { settled, errors };
}
