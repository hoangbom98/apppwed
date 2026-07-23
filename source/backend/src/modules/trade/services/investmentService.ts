// @ts-nocheck
'use strict';
/**
 * trade/services/investmentService.js
 *
 * Core investment business logic:
 * - Daily profit distribution for active investments
 * - Investment completion checking
 * - Commission calculation for referrers
 */
const logger = require('../../../shared/services/logger');

class InvestmentService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Distribute daily profits to all active investments.
   * Called by the daily cron job.
   * @returns {{ processed: number, totalPaid: number }}
   */
  async distributeDailyProfits() {
    const activeInvestments = await this.prisma.investment.findMany({
      where:   { status: 'active' },
      include: { package: true },
    });

    let processed = 0;
    let totalPaid = 0;

    for (const inv of activeInvestments) {
      try {
        const dailyProfit = parseFloat(inv.amount) * (parseFloat(inv.package.dailyProfit) / 100);
        const now = new Date();

        // Credit profit to wallet
        const wallet = await this.prisma.wallet.findUnique({ where: { userId: inv.userId } });
        const newBal = (wallet ? parseFloat(wallet.balance) : 0) + dailyProfit;

        const newProfitPaid = parseFloat(inv.profitPaid) + dailyProfit;
        const maxProfit = parseFloat(inv.amount) * (parseFloat(inv.package.totalReturn) / 100);
        const isCompleted = newProfitPaid >= maxProfit || now >= inv.endDate;

        await this.prisma.$transaction(async (tx) => {
          // Credit wallet
          await tx.wallet.upsert({
            where:  { userId: inv.userId },
            create: { userId: inv.userId, balance: dailyProfit, frozen: 0 },
            update: { balance: { increment: dailyProfit } },
          });
          // Transaction log
          await tx.transaction.create({
            data: {
              userId:        inv.userId,
              type:          'profit',
              amount:        dailyProfit,
              balanceAfter:  newBal,
              referenceId:   inv.id,
              referenceType: 'investment',
              note:          `Lợi nhuận hàng ngày từ gói ${inv.package.name}`,
            },
          });
          // Update investment
          await tx.investment.update({
            where: { id: inv.id },
            data: {
              profitPaid: newProfitPaid,
              lastPaidAt: now,
              status:     isCompleted ? 'completed' : 'active',
            },
          });
        });

        // Calculate referral commission
        await this._payReferralCommission(inv.userId, dailyProfit, 'investment', inv.id);

        processed++;
        totalPaid += dailyProfit;
      } catch (err) {
        logger.error(`[InvestmentService] profit distribution error for investment ${inv.id}: ${err.message}`);
      }
    }

    logger.info(`[InvestmentService] Daily profits: ${processed} investments, ${totalPaid.toFixed(2)} USD paid`);
    return { processed, totalPaid };
  }

  /**
   * Pay referral commissions to F1/F2 referrers.
   * F1 = 5%, F2 = 2% of daily profit (config-driven).
   */
  async _payReferralCommission(userId, amount, source, sourceId) {
    try {
      // F1 referrer
      const f1ref = await this.prisma.referral.findUnique({
        where: { referredId: userId },
      });
      if (!f1ref) return;

      const f1Rate = 0.05; // 5% commission for F1
      const f1Amt  = amount * f1Rate;

      if (f1Amt > 0) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId: f1ref.referrerId } });
        const newBal = (wallet ? parseFloat(wallet.balance) : 0) + f1Amt;

        await this.prisma.$transaction([
          this.prisma.wallet.upsert({
            where:  { userId: f1ref.referrerId },
            create: { userId: f1ref.referrerId, balance: f1Amt, frozen: 0 },
            update: { balance: { increment: f1Amt } },
          }),
          this.prisma.commissionLog.create({
            data: {
              userId:     f1ref.referrerId,
              fromUserId: userId,
              amount:     f1Amt,
              level:      1,
              source,
              sourceId,
              status:     'paid',
              paidAt:     new Date(),
            },
          }),
          this.prisma.transaction.create({
            data: {
              userId:        f1ref.referrerId,
              type:          'commission',
              amount:        f1Amt,
              balanceAfter:  newBal,
              referenceId:   sourceId,
              referenceType: 'commission_f1',
              note:          `Hoa hồng F1 từ đầu tư của ${userId}`,
            },
          }),
        ]);

        // F2 referrer (referrer of f1ref)
        const f2ref = await this.prisma.referral.findUnique({
          where: { referredId: f1ref.referrerId },
        });
        if (f2ref) {
          const f2Rate = 0.02; // 2% commission for F2
          const f2Amt  = amount * f2Rate;
          if (f2Amt > 0) {
            const w2 = await this.prisma.wallet.findUnique({ where: { userId: f2ref.referrerId } });
            const nb2 = (w2 ? parseFloat(w2.balance) : 0) + f2Amt;
            await this.prisma.$transaction([
              this.prisma.wallet.upsert({
                where:  { userId: f2ref.referrerId },
                create: { userId: f2ref.referrerId, balance: f2Amt, frozen: 0 },
                update: { balance: { increment: f2Amt } },
              }),
              this.prisma.commissionLog.create({
                data: {
                  userId:     f2ref.referrerId,
                  fromUserId: userId,
                  amount:     f2Amt,
                  level:      2,
                  source,
                  sourceId,
                  status:     'paid',
                  paidAt:     new Date(),
                },
              }),
              this.prisma.transaction.create({
                data: {
                  userId:        f2ref.referrerId,
                  type:          'commission',
                  amount:        f2Amt,
                  balanceAfter:  nb2,
                  referenceId:   sourceId,
                  referenceType: 'commission_f2',
                  note:          `Hoa hồng F2 từ đầu tư của ${userId}`,
                },
              }),
            ]);
          }
        }
      }
    } catch (err) {
      logger.error(`[InvestmentService] referral commission error for user ${userId}: ${err.message}`);
    }
  }
}

module.exports = InvestmentService;
