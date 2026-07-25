// @ts-nocheck
'use strict';
/**
 * GroupFinanceService — Engine for "Gộp Vốn, Tách Lợi Nhuận"
 * (Pool Capital, Split Profit)
 *
 * This is the single authoritative service for all cross-project financial flows.
 * Sub-projects (game, sports, trade, dating) call this instead of managing
 * their own wallet mutations when they need Group-level accounting.
 *
 * Core responsibilities
 * ─────────────────────
 *  1. Apply dynamic transaction fees and route them to the Group Wallet.
 *  2. Maintain per-project balance books (ProjectBalance).
 *  3. Record fee logs (FeeLog) for easy reconciliation.
 *  4. Expose debit / credit helpers that wrap LedgerService with fee logic.
 *
 * GROUP_WALLET_USER_ID
 * ────────────────────
 *  The "Group Wallet" is a virtual user in admin_db whose ID is stored in
 *  the environment variable GROUP_WALLET_USER_ID.  All fees collected are
 *  credited to this user's wallet.  Seed this user via:
 *    npx ts-node prisma/seeds/admin.seed.ts
 *
 * USAGE
 * ─────
 *  const gf = new GroupFinanceService(adminPrisma);
 *
 *  // When a user places a BET in the game module:
 *  const result = await gf.debitWithFee(userId, amount, 'GAME', 'bet', refId, adminWalletId);
 *  // result.netAmount  — amount actually deducted from user (= amount, fee added on top for debit)
 *  // result.fee        — fee deducted and sent to group
 *
 *  // When a user WINs in the game module:
 *  const result = await gf.creditWithFee(userId, amount, 'GAME', 'win', refId, adminWalletId);
 *  // result.netAmount  — amount the user actually receives (= gross - fee)
 *  // result.fee        — fee retained by group
 */

const logger = require('../../../shared/services/logger');
const cache  = require('../../../shared/services/cacheService');

/** Cache TTL for fee configs (2 minutes) */
const FEE_CACHE_TTL = 120;

/** Virtual user that represents the Group Wallet / tập đoàn */
const GROUP_WALLET_USER_ID = (): string => {
  const id = process.env.GROUP_WALLET_USER_ID;
  if (!id) throw new Error('[GroupFinance] GROUP_WALLET_USER_ID env var is not set');
  return id;
};

/** All valid project source codes */
export type TransactionSource = 'GAME' | 'SPORTS' | 'TRADE' | 'DATING' | 'HUB' | 'ADMIN' | 'SYSTEM';

/** Directions that can carry a fee */
type FeeTxType = 'BET' | 'WIN' | 'WITHDRAW' | 'DEPOSIT';

interface FeeConfigRow {
  feeType:   string;
  value:     number;
  minAmount: number | null;
  maxAmount: number | null;
  maxFee:    number | null;
}

interface FeeResult {
  grossAmount: number;
  fee:         number;
  netAmount:   number;
  feeApplied:  boolean;
}

export interface FinancialMoveResult extends FeeResult {
  txId:     string;
  balance:  number;
}

class GroupFinanceService {
  private prisma: any;

  constructor(adminPrisma: any) {
    this.prisma = adminPrisma;
  }

  // ── Fee resolution ──────────────────────────────────────────────────────

  /**
   * Load the active FeeConfig for a (source, txType) pair.
   * Result is cached in Redis for FEE_CACHE_TTL seconds.
   */
  async getFeeConfig(source: TransactionSource, txType: FeeTxType): Promise<FeeConfigRow | null> {
    const cacheKey = `feeconfig:${source}:${txType}`;
    return cache.remember(cacheKey, FEE_CACHE_TTL, async () => {
      const now = new Date();
      const row = await this.prisma.feeConfig.findFirst({
        where: {
          source,
          txType,
          isActive: true,
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
          AND: [
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
        select: {
          feeType: true,
          value:   true,
          minAmount: true,
          maxAmount: true,
          maxFee:  true,
        },
      }).catch(() => null);

      if (!row) return null;
      return {
        feeType:   row.feeType,
        value:     Number(row.value),
        minAmount: row.minAmount ? Number(row.minAmount) : null,
        maxAmount: row.maxAmount ? Number(row.maxAmount) : null,
        maxFee:    row.maxFee    ? Number(row.maxFee)    : null,
      };
    });
  }

  /**
   * Calculate the fee for a given (source, txType, amount) combination.
   */
  async calculateFee(
    amount:  number,
    source:  TransactionSource,
    txType:  FeeTxType,
  ): Promise<FeeResult> {
    const cfg = await this.getFeeConfig(source, txType);

    if (!cfg) {
      return { grossAmount: amount, fee: 0, netAmount: amount, feeApplied: false };
    }

    // Check min/max amount gates
    if (cfg.minAmount !== null && amount < cfg.minAmount) {
      return { grossAmount: amount, fee: 0, netAmount: amount, feeApplied: false };
    }
    if (cfg.maxAmount !== null && amount > cfg.maxAmount) {
      return { grossAmount: amount, fee: 0, netAmount: amount, feeApplied: false };
    }

    let fee: number;
    if (cfg.feeType === 'PERCENTAGE') {
      fee = Math.round((amount * cfg.value) / 100);
    } else {
      // FIXED
      fee = Math.round(cfg.value);
    }

    // Apply fee cap
    if (cfg.maxFee !== null && fee > cfg.maxFee) {
      fee = Math.round(cfg.maxFee);
    }

    // Fee cannot exceed the transaction amount
    fee = Math.min(fee, amount);

    return {
      grossAmount: amount,
      fee,
      netAmount: amount - fee,
      feeApplied: fee > 0,
    };
  }

  // ── Core fee-aware wallet mutations ────────────────────────────────────

  /**
   * Credit a user (WIN scenario).
   * Gross amount is paid out; fee is deducted and routed to Group Wallet.
   * User receives: grossAmount - fee
   */
  async creditWithFee(
    userWalletId:  string,
    userId:        string,
    grossAmount:   number,
    source:        TransactionSource,
    txType:        FeeTxType,
    referenceId:   string,
    adminWalletId: string,
  ): Promise<FinancialMoveResult> {
    const { fee, netAmount } = await this.calculateFee(grossAmount, source, txType);

    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Credit net amount to user wallet
      const userWallet = await tx.wallet.update({
        where: { id: userWalletId },
        data:  { balance: { increment: netAmount } },
        select: { balance: true },
      });

      // 2. Record user transaction
      const userTx = await tx.transaction.create({
        data: {
          userId,
          walletId:     userWalletId,
          type:         txType.toLowerCase(),
          source,
          amount:       netAmount,
          fee,
          status:       'completed',
          referenceId,
          description:  `${source} ${txType} (phí: ${fee.toLocaleString('vi-VN')}đ)`,
        },
      });

      // 3. If there is a fee, route it to Group Wallet
      if (fee > 0) {
        await tx.wallet.update({
          where: { id: adminWalletId },
          data:  { balance: { increment: fee } },
        });

        await tx.transaction.create({
          data: {
            userId:      GROUP_WALLET_USER_ID(),
            walletId:    adminWalletId,
            type:        'fee',
            source:      'ADMIN',
            amount:      fee,
            status:      'completed',
            referenceId,
            description: `Fee from ${source} ${txType} (userId: ${userId})`,
          },
        });

        // 4. Log fee for reconciliation
        await tx.feeLog.create({
          data: {
            userId,
            source,
            txType,
            grossAmount,
            feeAmount:  fee,
            netAmount,
            referenceId,
          },
        });
      }

      // 5. Update ProjectBalance book
      await tx.projectBalance.upsert({
        where:  { source },
        create: { source, balance: -grossAmount, totalWin: grossAmount, totalFee: fee },
        update: {
          balance:  { decrement: grossAmount },
          totalWin: { increment: grossAmount },
          totalFee: { increment: fee },
        },
      });

      return { balance: Number(userWallet.balance), txId: userTx.id };
    });

    logger.info(
      `[GroupFinance] CREDIT userId=${userId} source=${source} gross=${grossAmount} fee=${fee} net=${netAmount}`,
    );

    return { grossAmount, fee, netAmount, feeApplied: fee > 0, ...result };
  }

  /**
   * Debit a user (BET scenario).
   * Full amount is debited; an additional fee may be collected on top.
   * Throws if balance is insufficient (amount + fee > balance).
   */
  async debitWithFee(
    userWalletId:  string,
    userId:        string,
    amount:        number,
    source:        TransactionSource,
    txType:        FeeTxType,
    referenceId:   string,
    adminWalletId: string,
  ): Promise<FinancialMoveResult> {
    const { fee } = await this.calculateFee(amount, source, txType);
    const totalDeduct = amount + fee;

    const result = await this.prisma.$transaction(async (tx: any) => {
      // Atomic debit — fails if balance insufficient
      const affected = await tx.$executeRaw`
        UPDATE wallets
        SET balance = balance - ${totalDeduct}, updatedAt = NOW()
        WHERE id = ${userWalletId} AND balance >= ${totalDeduct}
      `;
      if (affected === 0) {
        const w = await tx.wallet.findUnique({ where: { id: userWalletId }, select: { balance: true } });
        throw Object.assign(
          new Error(`Số dư không đủ (hiện có: ${Number(w?.balance ?? 0).toLocaleString('vi-VN')}đ)`),
          { status: 400, code: 'INSUFFICIENT_BALANCE' },
        );
      }

      const updatedWallet = await tx.wallet.findUnique({
        where:  { id: userWalletId },
        select: { balance: true },
      });

      // Record user debit transaction
      const userTx = await tx.transaction.create({
        data: {
          userId,
          walletId:    userWalletId,
          type:        txType.toLowerCase(),
          source,
          amount:      -amount,
          fee,
          status:      'completed',
          referenceId,
          description: `${source} ${txType}${fee > 0 ? ` (phí: ${fee.toLocaleString('vi-VN')}đ)` : ''}`,
        },
      });

      // Route fee to Group Wallet
      if (fee > 0) {
        await tx.wallet.update({
          where: { id: adminWalletId },
          data:  { balance: { increment: fee } },
        });

        await tx.transaction.create({
          data: {
            userId:      GROUP_WALLET_USER_ID(),
            walletId:    adminWalletId,
            type:        'fee',
            source:      'ADMIN',
            amount:      fee,
            status:      'completed',
            referenceId,
            description: `Fee from ${source} ${txType} (userId: ${userId})`,
          },
        });

        await tx.feeLog.create({
          data: {
            userId,
            source,
            txType,
            grossAmount: amount,
            feeAmount:   fee,
            netAmount:   amount,  // user pays full amount; fee is on top
            referenceId,
          },
        });
      }

      // Update ProjectBalance book
      await tx.projectBalance.upsert({
        where:  { source },
        create: { source, balance: amount, totalBet: amount, totalFee: fee },
        update: {
          balance:  { increment: amount },
          totalBet: { increment: amount },
          totalFee: { increment: fee },
        },
      });

      return { balance: Number(updatedWallet?.balance ?? 0), txId: userTx.id };
    });

    logger.info(
      `[GroupFinance] DEBIT userId=${userId} source=${source} amount=${amount} fee=${fee} total=${totalDeduct}`,
    );

    return { grossAmount: amount, fee, netAmount: amount, feeApplied: fee > 0, ...result };
  }

  /**
   * Invalidate cached fee config for a given source+type pair.
   * Call this after admin updates a FeeConfig row.
   */
  async invalidateFeeCache(source: TransactionSource, txType: FeeTxType): Promise<void> {
    await cache.del(`feeconfig:${source}:${txType}`);
  }
}

module.exports = GroupFinanceService;
export { GroupFinanceService };
