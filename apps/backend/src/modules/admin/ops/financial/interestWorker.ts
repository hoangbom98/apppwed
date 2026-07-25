// @ts-nocheck
'use strict';
/**
 * InterestWorker — Daily internal loan interest calculator.
 *
 * Runs once per day (scheduled from ops/jobs/index.ts at 00:05).
 *
 * Algorithm
 * ─────────
 *  1. Load all ProjectBalance rows where balance < 0 (sub-project owes group).
 *  2. For each negative balance, look up the active InternalLoan for that source.
 *     If none exists, auto-create one with the default rate from SystemConfig.
 *  3. Calculate daily interest: |balance| * interestRate.
 *  4. Record a Transaction (type: 'interest', source: 'ADMIN') to the Group Wallet.
 *  5. Debit the sub-project's ProjectBalance with the interest amount.
 *  6. Update InternalLoan.totalInterest.
 *  7. Emit an OpsAlert if any project's debt exceeds a warning threshold.
 *
 * Default interest rate: 0.05%/day (configurable via SystemConfig key 'internal_loan_rate').
 * Debt warning threshold: 10,000,000 VND (configurable via 'internal_loan_alert_threshold').
 */

const logger = require('../../../../shared/services/logger');

const DEFAULT_INTEREST_RATE  = 0.0005;   // 0.05% per day
const DEFAULT_ALERT_THRESHOLD = 10_000_000; // 10M VND

class InterestWorker {
  private admin: any;

  constructor(adminPrisma: any) {
    this.admin = adminPrisma;
  }

  /**
   * Run the daily interest calculation for all indebted sub-projects.
   * @returns Summary of what was processed.
   */
  async run(): Promise<{ processed: number; totalInterestCharged: number; alerts: string[] }> {
    const interestRate  = await this._getRate();
    const alertThreshold = await this._getAlertThreshold();
    const adminWalletId = process.env.GROUP_WALLET_USER_ID;
    const adminWallet   = adminWalletId
      ? await this.admin.wallet.findFirst({ where: { userId: adminWalletId }, select: { id: true } }).catch(() => null)
      : null;

    // Load all sub-project balances that are in debt (balance < 0)
    const debtors = await this.admin.projectBalance.findMany({
      where: { balance: { lt: 0 } },
    });

    let processed = 0;
    let totalInterestCharged = 0;
    const alerts: string[] = [];

    for (const pb of debtors) {
      try {
        const debt     = Math.abs(Number(pb.balance));
        const interest = Math.round(debt * interestRate);

        if (interest <= 0) continue;

        // Find or create the active InternalLoan for this source
        let loan = await this.admin.internalLoan.findFirst({
          where: { source: pb.source, status: 'ACTIVE' },
        });

        if (!loan) {
          loan = await this.admin.internalLoan.create({
            data: {
              source:       pb.source,
              amount:       debt,
              interestRate,
              status:       'ACTIVE',
              totalInterest: 0,
            },
          });
        }

        // Record interest transaction to Group Wallet (if wallet exists)
        if (adminWallet) {
          await this.admin.$transaction(async (tx: any) => {
            // Credit Group Wallet with interest
            await tx.wallet.update({
              where: { id: adminWallet.id },
              data:  { balance: { increment: interest } },
            });

            // Record the transaction
            await tx.transaction.create({
              data: {
                userId:      adminWalletId,
                walletId:    adminWallet.id,
                type:        'interest',
                source:      'ADMIN',
                amount:      interest,
                status:      'completed',
                description: `Lãi vay nội bộ ${pb.source} (${(interestRate * 100).toFixed(4)}%/ngày trên nợ ${debt.toLocaleString('vi-VN')}đ)`,
              },
            });

            // Debit the sub-project balance (making it more negative)
            await tx.projectBalance.update({
              where: { source: pb.source },
              data:  { balance: { decrement: interest } },
            });

            // Update loan total interest
            await tx.internalLoan.update({
              where: { id: loan.id },
              data:  { totalInterest: { increment: interest } },
            });
          });
        } else {
          // No group wallet configured — still update the books
          await this.admin.$transaction(async (tx: any) => {
            await tx.projectBalance.update({
              where: { source: pb.source },
              data:  { balance: { decrement: interest } },
            });
            await tx.internalLoan.update({
              where: { id: loan.id },
              data:  { totalInterest: { increment: interest } },
            });
          });
        }

        totalInterestCharged += interest;
        processed++;

        logger.info(
          `[InterestWorker] ${pb.source} debt=${debt} rate=${interestRate} interest=${interest}`,
        );

        // Alert if debt exceeds threshold
        const newDebt = debt + interest;
        if (newDebt >= alertThreshold) {
          const msg = `Nợ nội bộ ${pb.source}: ${newDebt.toLocaleString('vi-VN')}đ vượt ngưỡng cảnh báo`;
          alerts.push(msg);
          await this.admin.opsAlert.create({
            data: {
              type:     'internal_debt_high',
              message:  `⚠️ ${msg}`,
              severity: newDebt >= alertThreshold * 3 ? 'critical' : 'high',
            },
          }).catch(() => {});
        }
      } catch (err: any) {
        logger.error(`[InterestWorker] Error processing ${pb.source}: ${err.message}`);
      }
    }

    logger.info(
      `[InterestWorker] Done — processed=${processed} totalInterest=${totalInterestCharged}`,
    );

    return { processed, totalInterestCharged, alerts };
  }

  /** Load interest rate from SystemConfig or use default */
  private async _getRate(): Promise<number> {
    try {
      const cfg = await this.admin.systemConfig.findUnique({
        where:  { key: 'internal_loan_rate' },
        select: { value: true },
      });
      return cfg?.value ? parseFloat(cfg.value) : DEFAULT_INTEREST_RATE;
    } catch {
      return DEFAULT_INTEREST_RATE;
    }
  }

  /** Load debt alert threshold from SystemConfig or use default */
  private async _getAlertThreshold(): Promise<number> {
    try {
      const cfg = await this.admin.systemConfig.findUnique({
        where:  { key: 'internal_loan_alert_threshold' },
        select: { value: true },
      });
      return cfg?.value ? parseInt(cfg.value, 10) : DEFAULT_ALERT_THRESHOLD;
    } catch {
      return DEFAULT_ALERT_THRESHOLD;
    }
  }
}

module.exports = InterestWorker;
export { InterestWorker };
