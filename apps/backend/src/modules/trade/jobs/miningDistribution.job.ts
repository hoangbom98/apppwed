// @ts-nocheck
'use strict';
/**
 * miningDistribution.job.ts — Daily income payout for Mining Investments
 * Schedule: 0 1 * * * (01:00 UTC daily)
 *
 * Logic:
 * 1. Find all ACTIVE mining investments
 * 2. Credit dayIncome to user wallet
 * 3. Update profitPaid + lastPaidAt
 * 4. If endDate passed → return deposit, mark COMPLETED
 */

export async function runMiningDistribution(prisma: any, io?: any) {
  const now       = new Date();
  const yesterday = new Date(now.getTime() - 86400000);

  const investments = await prisma.miningInvestment.findMany({
    where:   { status: 'active' },
    include: { machine: true },
  });

  let paid = 0, completed = 0, errors = 0;

  for (const inv of investments) {
    try {
      // Skip if already paid today
      if (inv.lastPaidAt && inv.lastPaidAt > yesterday) continue;

      const income = parseFloat(inv.dayIncome);

      // Check if expired
      const isExpired = inv.endDate && inv.endDate <= now;

      await prisma.$transaction(async (tx: any) => {
        if (isExpired) {
          // Return deposit + final income
          const total = income + parseFloat(inv.deposit);
          const wallet = await tx.wallet.findUnique({ where: { userId: inv.userId } });
          const newBal = (wallet ? parseFloat(wallet.balance) : 0) + total;
          await tx.wallet.upsert({
            where:  { userId: inv.userId },
            update: { balance: { increment: total }, frozen: { decrement: parseFloat(inv.deposit) } },
            create: { userId: inv.userId, balance: total, frozen: 0 },
          });
          await tx.miningInvestment.update({
            where: { id: inv.id },
            data:  { status: 'completed', profitPaid: { increment: income }, lastPaidAt: now },
          });
          await tx.transaction.create({
            data: {
              userId:        inv.userId,
              type:          'mining_settle',
              amount:        total,
              balanceAfter:  newBal,
              referenceId:   inv.id,
              referenceType: 'mining_investment',
              note:          `Máy đào đáo hạn — hoàn cọc + thu nhập cuối: ${total.toFixed(2)}`,
            },
          });
          completed++;
        } else {
          // Regular daily income payout
          const wallet = await tx.wallet.findUnique({ where: { userId: inv.userId } });
          const newBal = (wallet ? parseFloat(wallet.balance) : 0) + income;
          await tx.wallet.upsert({
            where:  { userId: inv.userId },
            update: { balance: { increment: income } },
            create: { userId: inv.userId, balance: income, frozen: 0 },
          });
          await tx.miningInvestment.update({
            where: { id: inv.id },
            data:  { profitPaid: { increment: income }, lastPaidAt: now },
          });
          await tx.transaction.create({
            data: {
              userId:        inv.userId,
              type:          'mining_income',
              amount:        income,
              balanceAfter:  newBal,
              referenceId:   inv.id,
              referenceType: 'mining_investment',
              note:          `Thu nhập máy đào hàng ngày: ${income.toFixed(2)}`,
            },
          });
          paid++;
        }
      });

      // Notify user
      if (io) {
        io.to(`user:${inv.userId}`).emit('balance:update', { amount: income });
      }
    } catch (err: any) {
      console.error(`[miningDistribution] error for inv ${inv.id}:`, err.message);
      errors++;
    }
  }

  console.log(`[miningDistribution] paid=${paid}, completed=${completed}, errors=${errors}`);
  return { paid, completed, errors };
}
