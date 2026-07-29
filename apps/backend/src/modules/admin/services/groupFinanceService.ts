'use strict';
/**
 * GroupFinanceService — Engine for "Gộp Vốn, Tách Lợi Nhuận"
 * (Pool Capital, Split Profit)
 */

const logger = require('../../../shared/services/logger');
const cache  = require('../../../shared/services/cacheService');
const { Decimal } = require('@lkvip/utils');

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
  value:     Decimal;
  minAmount: Decimal | null;
  maxAmount: Decimal | null;
  maxFee:    Decimal | null;
}

interface FeeResult {
  grossAmount: Decimal;
  fee:         Decimal;
  netAmount:   Decimal;
  feeApplied:  boolean;
}

export interface FinancialMoveResult extends FeeResult {
  txId:     string;
  balance:  Decimal;
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
        value:     new Decimal(row.value.toString()),
        minAmount: row.minAmount ? new Decimal(row.minAmount.toString()) : null,
        maxAmount: row.maxAmount ? new Decimal(row.maxAmount.toString()) : null,
        maxFee:    row.maxFee    ? new Decimal(row.maxFee.toString())    : null,
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
    const amtDec = new Decimal(amount);
    const cfg = await this.getFeeConfig(source, txType);

    if (!cfg) {
      return { grossAmount: amtDec, fee: new Decimal(0), netAmount: amtDec, feeApplied: false };
    }

    // Check min/max amount gates
    if (cfg.minAmount !== null && amtDec.lt(cfg.minAmount)) {
      return { grossAmount: amtDec, fee: new Decimal(0), netAmount: amtDec, feeApplied: false };
    }
    if (cfg.maxAmount !== null && amtDec.gt(cfg.maxAmount)) {
      return { grossAmount: amtDec, fee: new Decimal(0), netAmount: amtDec, feeApplied: false };
    }

    let fee: Decimal;
    if (cfg.feeType === 'PERCENTAGE') {
      fee = amtDec.times(cfg.value).div(100).toDecimalPlaces(4);
    } else {
      // FIXED
      fee = cfg.value;
    }

    // Apply fee cap
    if (cfg.maxFee !== null && fee.gt(cfg.maxFee)) {
      fee = cfg.maxFee;
    }

    // Fee cannot exceed the transaction amount
    fee = Decimal.min(fee, amtDec);

    return {
      grossAmount: amtDec,
      fee,
      netAmount: amtDec.minus(fee),
      feeApplied: fee.gt(0),
    };
  }

  // ── Core fee-aware wallet mutations ────────────────────────────────────

  /**
   * Credit a user (WIN scenario).
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
    const grossDec = new Decimal(grossAmount);

    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Credit net amount to user wallet
      const userWallet = await tx.wallet.update({
        where: { id: userWalletId },
        data:  { balance: { increment: netAmount.toNumber() } },
        select: { balance: true },
      });

      // 2. Record user transaction
      const userTx = await tx.transaction.create({
        data: {
          userId,
          walletId:     userWalletId,
          type:         txType.toLowerCase(),
          source,
          amount:       netAmount.toNumber(),
          fee:          fee.toNumber(),
          status:       'completed',
          referenceId,
          description:  `${source} ${txType} (phí: ${fee.toString()}đ)`,
        },
      });

      // 3. If there is a fee, route it to Group Wallet
      if (fee.gt(0)) {
        await tx.wallet.update({
          where: { id: adminWalletId },
          data:  { balance: { increment: fee.toNumber() } },
        });

        await tx.transaction.create({
          data: {
            userId:      GROUP_WALLET_USER_ID(),
            walletId:    adminWalletId,
            type:        'fee',
            source:      'ADMIN',
            amount:      fee.toNumber(),
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
            grossAmount: grossDec.toNumber(),
            feeAmount:   fee.toNumber(),
            netAmount:   netAmount.toNumber(),
            referenceId,
          },
        });
      }

      // 5. Update ProjectBalance book
      await tx.projectBalance.upsert({
        where:  { source },
        create: { source, balance: grossDec.neg().toNumber(), totalWin: grossDec.toNumber(), totalFee: fee.toNumber() },
        update: {
          balance:  { decrement: grossDec.toNumber() },
          totalWin: { increment: grossDec.toNumber() },
          totalFee: { increment: fee.toNumber() },
        },
      });

      return { balance: new Decimal(userWallet.balance.toString()), txId: userTx.id };
    });

    logger.info(
      `[GroupFinance] CREDIT userId=${userId} source=${source} gross=${grossDec.toString()} fee=${fee.toString()} net=${netAmount.toString()}`,
    );

    return { grossAmount: grossDec, fee, netAmount, feeApplied: fee.gt(0), ...result };
  }

  /**
   * Debit a user (BET scenario).
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
    const amtDec = new Decimal(amount);
    const totalDeduct = amtDec.plus(fee);

    const result = await this.prisma.$transaction(async (tx: any) => {
      // Atomic debit — fails if balance insufficient
      const affected = await tx.$executeRaw`
        UPDATE wallets
        SET balance = balance - ${totalDeduct.toNumber()}, updatedAt = NOW()
        WHERE id = ${userWalletId} AND balance >= ${totalDeduct.toNumber()}
      `;
      if (affected === 0) {
        const w = await tx.wallet.findUnique({ where: { id: userWalletId }, select: { balance: true } });
        throw Object.assign(
          new Error(`Số dư không đủ (hiện có: ${new Decimal(w?.balance?.toString() ?? 0).toString()}đ)`),
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
          amount:      amtDec.neg().toNumber(),
          fee:         fee.toNumber(),
          status:      'completed',
          referenceId,
          description: `${source} ${txType}${fee.gt(0) ? ` (phí: ${fee.toString()}đ)` : ''}`,
        },
      });

      // Route fee to Group Wallet
      if (fee.gt(0)) {
        await tx.wallet.update({
          where: { id: adminWalletId },
          data:  { balance: { increment: fee.toNumber() } },
        });

        await tx.transaction.create({
          data: {
            userId:      GROUP_WALLET_USER_ID(),
            walletId:    adminWalletId,
            type:        'fee',
            source:      'ADMIN',
            amount:      fee.toNumber(),
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
            grossAmount: amtDec.toNumber(),
            feeAmount:   fee.toNumber(),
            netAmount:   amtDec.toNumber(),  // user pays full amount; fee is on top
            referenceId,
          },
        });
      }

      // Update ProjectBalance book
      await tx.projectBalance.upsert({
        where:  { source },
        create: { source, balance: amtDec.toNumber(), totalBet: amtDec.toNumber(), totalFee: fee.toNumber() },
        update: {
          balance:  { increment: amtDec.toNumber() },
          totalBet: { increment: amtDec.toNumber() },
          totalFee: { increment: fee.toNumber() },
        },
      });

      return { balance: new Decimal(updatedWallet?.balance.toString() ?? 0), txId: userTx.id };
    });

    logger.info(
      `[GroupFinance] DEBIT userId=${userId} source=${source} amount=${amtDec.toString()} fee=${fee.toString()} total=${totalDeduct.toString()}`,
    );

    return { grossAmount: amtDec, fee, netAmount: amtDec, feeApplied: fee.gt(0), ...result };
  }

  /**
   * Invalidate cached fee config for a given source+type pair.
   */
  async invalidateFeeCache(source: TransactionSource, txType: FeeTxType): Promise<void> {
    await cache.del(`feeconfig:${source}:${txType}`);
  }
}

module.exports = GroupFinanceService;
export { GroupFinanceService };
