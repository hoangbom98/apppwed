// @ts-nocheck
'use strict';
/**
 * trade/jobs/profitDistribution.job.js
 *
 * Runs daily at 00:05 UTC — distributes daily profit for all ACTIVE investments.
 * When an investment has paid out its full expected profit (amount × dailyProfit × duration),
 * it is marked COMPLETED and the principal is returned to the user's wallet.
 *
 * Called from: cron.js (registered on app startup)
 */
const logger = require('../../../shared/services/logger');
const notifSvc = require('../../../shared/services/notificationService');

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {import('socket.io').Server|null} io
 */
async function runProfitDistribution(prisma, io = null) {
  const started = Date.now();
  logger.info('[ProfitJob] Starting daily profit distribution');

  const now = new Date();

  // Fetch all active investments that haven't been paid today
  const activeInvestments = await prisma.investment.findMany({
    where: {
      status:    'ACTIVE',
      endDate:   { gte: now },
    },
    include: { package: true },
  });

  if (!activeInvestments.length) {
    logger.info('[ProfitJob] No active investments to process');
    return;
  }

  let processed = 0;
  let completed = 0;

  for (const inv of activeInvestments) {
    try {
      const pkg         = inv.package;
      const dailyRate   = parseFloat(pkg.dailyProfit) / 100;     // e.g. 0.005 for 0.5%
      const dailyProfit = parseFloat((parseFloat(inv.amount) * dailyRate).toFixed(2));

      if (dailyProfit <= 0) continue;

      await prisma.$transaction(async (tx) => {
        // Credit daily profit to wallet
        const updatedWallet = await tx.wallet.upsert({
          where:  { userId: inv.userId },
          create: { userId: inv.userId, balance: dailyProfit, frozen: 0 },
          update: { balance: { increment: dailyProfit } },
        });

        // Update investment: increment profitPaid, set lastPaidAt
        const newProfitPaid = parseFloat(inv.profitPaid) + dailyProfit;
        const isCompleted   = new Date() >= new Date(inv.endDate);

        const updatedInv = await tx.investment.update({
          where: { id: inv.id },
          data: {
            profitPaid: newProfitPaid,
            lastPaidAt: now,
            status:     isCompleted ? 'COMPLETED' : 'ACTIVE',
          },
        });

        // Ledger entry
        await tx.transaction.create({
          data: {
            userId:        inv.userId,
            type:          'profit',
            amount:        dailyProfit,
            referenceId:   inv.id,
            referenceType: 'investment',
            note:          `Lãi ngày: gói ${pkg.name} (${pkg.dailyProfit}%/ngày)`,
            balanceAfter:  parseFloat(updatedWallet.balance),
          },
        });

        // If investment just completed, return principal
        if (isCompleted) {
          const principal = parseFloat(inv.amount);
          const walletAfterPrincipal = await tx.wallet.update({
            where: { userId: inv.userId },
            data:  { balance: { increment: principal } },
          });
          await tx.transaction.create({
            data: {
              userId:        inv.userId,
              type:          'trade_close',
              amount:        principal,
              referenceId:   inv.id,
              referenceType: 'investment_matured',
              note:          `Hoàn gốc đầu tư: ${pkg.name}`,
              balanceAfter:  parseFloat(walletAfterPrincipal.balance),
            },
          });
          completed++;

          notifSvc.sendToUser(inv.userId, 'notification', {
            title:   'Đầu tư đã đáo hạn',
            content: `Gói ${pkg.name} đã hoàn thành. Gốc ${principal} USD đã được hoàn trả.`,
          });

          if (io) {
            io.to(`user:${inv.userId}`).emit('investment:completed', {
              investmentId: inv.id,
              packageName:  pkg.name,
              principal,
            });
          }
        }
      });

      notifSvc.sendToUser(inv.userId, 'notification', {
        title:   'Nhận lãi đầu tư',
        content: `+${dailyProfit} USD lãi từ gói ${pkg.name}`,
      });

      if (io) {
        io.to(`user:${inv.userId}`).emit('balance:update', { userId: inv.userId });
      }

      processed++;
    } catch (err) {
      logger.error(`[ProfitJob] Error processing investment ${inv.id}: ${err.message}`);
    }
  }

  logger.info(`[ProfitJob] Done — processed=${processed}, completed=${completed}, elapsed=${Date.now() - started}ms`);
}

module.exports = { runProfitDistribution };
