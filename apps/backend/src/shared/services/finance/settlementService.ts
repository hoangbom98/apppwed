// @ts-nocheck
/**
 * settlementService.ts — Engine 5: Transaction Settlement & Reconciliation
 *
 * Handles end-of-day financial reconciliation across all projects.
 * Responsibilities:
 *  - Mark PENDING transactions as COMPLETED or FAILED after timeout
 *  - Generate daily settlement reports (total deposits, withdrawals, net flow)
 *  - Detect discrepancies between wallet balances and transaction ledger sums
 *  - Create ReconciliationLog entries for audit
 *
 * USAGE
 * ─────
 *   // Called by cron at end of day:
 *   const svc = new SettlementService(prisma, 'game');
 *   await svc.settlePendingTransactions();
 *   const report = await svc.generateDailyReport(new Date());
 *   const issues = await svc.reconcileBalances();
 *
 * CRON schedule (add to cron.ts):
 *   schedule('0 23 * * *', 'settlement-pending',   () => svc.settlePendingTransactions());
 *   schedule('5 0 * * *',  'settlement-report',    () => svc.generateDailyReport(yesterday));
 *   schedule('0 2 * * 0',  'settlement-reconcile', () => svc.reconcileBalances());
 */

'use strict';

const logger = require('../logger');

// Transactions still PENDING after this many minutes are auto-failed
const PENDING_TIMEOUT_MINUTES = 60;

class SettlementService {
  private prisma:   any;
  private project:  string;

  constructor(prisma: any, project: string) {
    this.prisma   = prisma;
    this.project  = project;
  }

  // ── Settle stale PENDING transactions ────────────────────────────────────

  /**
   * Auto-expire transactions that have been PENDING > PENDING_TIMEOUT_MINUTES.
   * Returns count of transactions expired.
   */
  async settlePendingTransactions(): Promise<number> {
    const cutoff = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60_000);
    try {
      const { count } = await this.prisma.transaction.updateMany({
        where: {
          status:    'pending',
          createdAt: { lt: cutoff },
          type:      { notIn: ['deposit', 'withdraw'] }, // keep payment orders pending longer
        },
        data: { status: 'failed', note: `Auto-expired after ${PENDING_TIMEOUT_MINUTES}min` },
      });
      if (count > 0) logger.info(`[Settlement] Auto-expired ${count} pending transactions (${this.project})`);
      return count;
    } catch (err: any) {
      logger.error(`[Settlement] settlePendingTransactions failed (${this.project}): ${err.message}`);
      return 0;
    }
  }

  // ── Daily Settlement Report ───────────────────────────────────────────────

  /**
   * Generate a daily financial summary for a given date.
   * Returns totals for deposits, withdrawals, bonuses, net flow.
   */
  async generateDailyReport(date: Date): Promise<Record<string, unknown>> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const where = { createdAt: { gte: start, lte: end }, status: 'completed' };

    try {
      const [
        totalDeposit,
        totalWithdraw,
        totalBonus,
        totalCommission,
        txCount,
        newUsers,
      ] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'deposit' },
          _sum: { amount: true }, _count: true,
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'withdraw' },
          _sum: { amount: true }, _count: true,
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: { in: ['bonus', 'reward', 'checkin'] } },
          _sum: { amount: true }, _count: true,
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'commission' },
          _sum: { amount: true }, _count: true,
        }),
        this.prisma.transaction.count({ where }),
        this.prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);

      const depositAmt    = Number(totalDeposit._sum.amount    ?? 0);
      const withdrawAmt   = Math.abs(Number(totalWithdraw._sum.amount  ?? 0));
      const bonusAmt      = Number(totalBonus._sum.amount      ?? 0);
      const commissionAmt = Number(totalCommission._sum.amount ?? 0);
      const netFlow       = depositAmt - withdrawAmt - bonusAmt - commissionAmt;

      const report = {
        project:         this.project,
        date:            start.toISOString().slice(0, 10),
        deposits:        { amount: depositAmt,    count: totalDeposit._count    ?? 0 },
        withdrawals:     { amount: withdrawAmt,   count: totalWithdraw._count   ?? 0 },
        bonuses:         { amount: bonusAmt,      count: totalBonus._count      ?? 0 },
        commissions:     { amount: commissionAmt, count: totalCommission._count ?? 0 },
        netFlow,
        totalTxCount:    txCount,
        newUsers,
        generatedAt:     new Date().toISOString(),
      };

      logger.info(`[Settlement] Daily report generated ${this.project} ${start.toISOString().slice(0, 10)}: net=${netFlow}`);
      return report;
    } catch (err: any) {
      logger.error(`[Settlement] generateDailyReport failed (${this.project}): ${err.message}`);
      throw err;
    }
  }

  // ── Balance Reconciliation ─────────────────────────────────────────────────

  /**
   * Detect users whose wallet.balance differs from the sum of their transactions.
   * Returns array of discrepancies for admin review.
   *
   * This is a HEAVY query — run weekly or on demand, not in real-time.
   * @param limit  max users to check per run (default 500)
   */
  async reconcileBalances(limit = 500): Promise<Array<{
    userId: string; walletBalance: number; txSum: number; diff: number;
  }>> {
    try {
      // Get users with highest balance (most likely to have discrepancies)
      const users = await this.prisma.user.findMany({
        orderBy: { balance: 'desc' },
        take:    limit,
        select:  { id: true, balance: true },
      });

      const discrepancies: any[] = [];

      for (const user of users) {
        const agg = await this.prisma.transaction.aggregate({
          where:  { userId: user.id, status: 'completed' },
          _sum:   { amount: true },
        });
        const txSum         = Number(agg._sum.amount ?? 0);
        const walletBalance = Number(user.balance);
        const diff          = walletBalance - txSum;

        if (Math.abs(diff) > 0.01) { // tolerance 0.01 VND
          discrepancies.push({ userId: user.id, walletBalance, txSum, diff });
          logger.warn(`[Settlement] Reconcile discrepancy userId=${user.id} wallet=${walletBalance} txSum=${txSum} diff=${diff}`);
        }
      }

      logger.info(`[Settlement] Reconciliation complete (${this.project}): checked=${users.length} discrepancies=${discrepancies.length}`);
      return discrepancies;
    } catch (err: any) {
      logger.error(`[Settlement] reconcileBalances failed (${this.project}): ${err.message}`);
      return [];
    }
  }

  // ── Finance Engine: P&L summary ────────────────────────────────────────────

  /**
   * Calculate platform P&L for a date range.
   * Revenue = fees collected + unclaimed bonuses
   * Cost    = bonuses paid + commissions paid
   */
  async getPnL(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    try {
      const where = { createdAt: { gte: startDate, lte: endDate }, status: 'completed' };

      const [fees, bonuses, commissions] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'fee' }, _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: { in: ['bonus', 'reward', 'checkin', 'profit'] } },
          _sum:  { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'commission' }, _sum: { amount: true },
        }),
      ]);

      const revenue = Math.abs(Number(fees._sum.amount ?? 0));
      const cost    = Math.abs(Number(bonuses._sum.amount ?? 0)) + Math.abs(Number(commissions._sum.amount ?? 0));
      return { revenue, cost, profit: revenue - cost, project: this.project };
    } catch (err: any) {
      logger.error(`[Settlement] getPnL failed: ${err.message}`);
      return { revenue: 0, cost: 0, profit: 0, project: this.project };
    }
  }
}

module.exports = SettlementService;
