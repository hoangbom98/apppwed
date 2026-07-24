// @ts-nocheck
/**
 * ledgerService.ts — Engine 3: Double-Entry Accounting Ledger
 *
 * Every balance mutation must pass through this service.
 * Implements the Ledger pattern:
 *   1. Create a PENDING Ledger entry
 *   2. Create an immutable Transaction record
 *   3. Update the Wallet atomically
 *   4. Settle the Ledger entry to SETTLED
 *
 * Rules (MUST follow):
 *  - NEVER update wallet.balance directly outside this service.
 *  - NEVER delete or modify a Transaction record.
 *  - To reverse a transaction, create a new REVERSAL transaction.
 *  - All operations run inside Prisma $transaction (atomic).
 *
 * Wallet types supported (multi-wallet):
 *   main | invest | commission | reward | saving | locked | escrow
 *
 * USAGE
 * ─────
 *   const ledger = new LedgerService(prisma, 'game');
 *
 *   // Credit user's main wallet
 *   await ledger.credit(userId, 100000, 'main', 'deposit', 'Nạp tiền ngân hàng', { refId: orderId });
 *
 *   // Debit user's main wallet
 *   await ledger.debit(userId, 50000, 'main', 'withdraw', 'Rút tiền', { refId: withdrawId });
 *
 *   // Transfer between wallets
 *   await ledger.transfer(userId, 20000, 'main', 'invest', 'Chuyển sang ví đầu tư');
 *
 *   // Reverse a transaction
 *   await ledger.reverse(originalTxId, userId, 'Hoàn tiền do giao dịch lỗi');
 */

'use strict';

const logger = require('./logger');
const cache  = require('./cacheService');

// Supported wallet types
const WALLET_FIELDS = ['main', 'invest', 'commission', 'reward', 'saving', 'locked', 'escrow'] as const;
type WalletType = typeof WALLET_FIELDS[number];

// Transaction types
type TxType =
  | 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out'
  | 'investment' | 'profit' | 'commission' | 'bonus' | 'refund'
  | 'reversal' | 'fee' | 'reward' | 'checkin';

export interface LedgerEntry {
  userId:      string;
  amount:      number;
  type:        TxType;
  wallet:      WalletType;
  description: string;
  referenceId?: string;
  referenceType?: string;
  metadata?:   Record<string, unknown>;
}

class LedgerService {
  private prisma:      any;
  private project:     string;

  constructor(prisma: any, project: string) {
    this.prisma   = prisma;
    this.project  = project;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _balanceCacheKey(userId: string) {
    return `balance:${this.project}:${userId}`;
  }

  private async _invalidateCache(userId: string) {
    await cache.del(this._balanceCacheKey(userId));
  }

  private _assertWallet(wallet: string) {
    if (!WALLET_FIELDS.includes(wallet as WalletType)) {
      throw new Error(`[Ledger] Unknown wallet type: "${wallet}". Valid: ${WALLET_FIELDS.join(', ')}`);
    }
  }

  private _assertAmount(amount: number) {
    if (!amount || amount <= 0 || !isFinite(amount)) {
      throw new Error(`[Ledger] Amount must be a positive finite number, got: ${amount}`);
    }
  }

  // ── CREDIT ─────────────────────────────────────────────────────────────────

  /**
   * Credit (add funds) to a user's wallet.
   * Creates Ledger + Transaction + updates Wallet atomically.
   *
   * @returns {{ balance: number, txId: string }}
   */
  async credit(
    userId:      string,
    amount:      number,
    wallet:      WalletType = 'main',
    type:        TxType     = 'deposit',
    description: string     = '',
    extra: { refId?: string; refType?: string; metadata?: any } = {},
  ) {
    this._assertAmount(amount);
    this._assertWallet(wallet);

    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Create Ledger entry (PENDING)
      let ledgerId: string | undefined;
      if (tx.ledger) {
        const ledger = await tx.ledger.create({
          data: {
            userId,
            amount,
            direction:    'CREDIT',
            fromWallet:   'system',
            toWallet:     wallet,
            description,
            status:       'PENDING',
            referenceId:  extra.refId   ?? null,
            referenceType: extra.refType ?? null,
          },
        });
        ledgerId = ledger.id;
      }

      // 2. Create immutable Transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          amount,
          balanceAfter: 0,            // will update below
          status:       'completed',
          note:         description,
          referenceId:  extra.refId   ?? null,
          ...(extra.metadata ? { metadata: extra.metadata } : {}),
        },
      });

      // 3. Atomic wallet update
      const updated = await tx.user.update({
        where: { id: userId },
        data:  { [wallet === 'main' ? 'balance' : wallet]: { increment: amount } },
        select: { balance: true },
      });

      // 4. Patch balanceAfter
      await tx.transaction.update({
        where: { id: transaction.id },
        data:  { balanceAfter: Number(updated.balance) },
      });

      // 5. Settle ledger
      if (ledgerId && tx.ledger) {
        await tx.ledger.update({ where: { id: ledgerId }, data: { status: 'SETTLED', settledAt: new Date() } });
      }

      return { balance: Number(updated.balance), txId: transaction.id };
    });

    await this._invalidateCache(userId);
    logger.info(`[Ledger] CREDIT userId=${userId} amount=${amount} wallet=${wallet} type=${type}`);
    return result;
  }

  // ── DEBIT ──────────────────────────────────────────────────────────────────

  /**
   * Debit (remove funds) from a user's wallet.
   * Uses atomic WHERE balance >= amount to prevent race conditions.
   *
   * @returns {{ balance: number, txId: string }}
   */
  async debit(
    userId:      string,
    amount:      number,
    wallet:      WalletType = 'main',
    type:        TxType     = 'withdraw',
    description: string     = '',
    extra: { refId?: string; refType?: string; metadata?: any } = {},
  ) {
    this._assertAmount(amount);
    this._assertWallet(wallet);

    const dbField = wallet === 'main' ? 'balance' : wallet;

    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Atomic debit — fails if balance insufficient
      const affected = await tx.$executeRaw`
        UPDATE users
        SET ${dbField} = ${dbField} - ${amount}, updatedAt = NOW()
        WHERE id = ${userId} AND ${dbField} >= ${amount}
      `;
      if (affected === 0) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { [dbField]: true } });
        if (!user) throw new Error('User not found');
        throw new Error(`Số dư ${wallet} không đủ (hiện có: ${Number(user[dbField])})`);
      }

      const updated = await tx.user.findUnique({ where: { id: userId }, select: { [dbField]: true } });

      // 2. Ledger entry
      if (tx.ledger) {
        await tx.ledger.create({
          data: {
            userId,
            amount,
            direction:    'DEBIT',
            fromWallet:   wallet,
            toWallet:     'system',
            description,
            status:       'SETTLED',
            settledAt:    new Date(),
            referenceId:  extra.refId   ?? null,
            referenceType: extra.refType ?? null,
          },
        });
      }

      // 3. Immutable Transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          amount:      -amount,
          balanceAfter: Number(updated[dbField]),
          status:      'completed',
          note:        description,
          referenceId: extra.refId ?? null,
          ...(extra.metadata ? { metadata: extra.metadata } : {}),
        },
      });

      return { balance: Number(updated[dbField]), txId: transaction.id };
    });

    await this._invalidateCache(userId);
    logger.info(`[Ledger] DEBIT userId=${userId} amount=${amount} wallet=${wallet} type=${type}`);
    return result;
  }

  // ── TRANSFER ───────────────────────────────────────────────────────────────

  /**
   * Move funds between a user's own wallets (e.g. main → invest).
   * Atomic: debit source, credit destination in one transaction.
   */
  async transfer(
    userId:      string,
    amount:      number,
    fromWallet:  WalletType,
    toWallet:    WalletType,
    description: string = '',
  ) {
    this._assertAmount(amount);
    this._assertWallet(fromWallet);
    this._assertWallet(toWallet);
    if (fromWallet === toWallet) throw new Error('[Ledger] fromWallet and toWallet must differ');

    const fromField = fromWallet === 'main' ? 'balance' : fromWallet;
    const toField   = toWallet   === 'main' ? 'balance' : toWallet;

    await this.prisma.$transaction(async (tx: any) => {
      const affected = await tx.$executeRaw`
        UPDATE users
        SET ${fromField} = ${fromField} - ${amount},
            ${toField}   = ${toField}   + ${amount},
            updatedAt = NOW()
        WHERE id = ${userId} AND ${fromField} >= ${amount}
      `;
      if (affected === 0) throw new Error(`Số dư ${fromWallet} không đủ để chuyển`);

      await tx.transaction.create({
        data: {
          userId,
          type:        'transfer_out',
          amount:      -amount,
          balanceAfter: 0,
          status:      'completed',
          note:        `Chuyển ${fromWallet}→${toWallet}: ${description}`,
        },
      });
    });

    await this._invalidateCache(userId);
    logger.info(`[Ledger] TRANSFER userId=${userId} amount=${amount} ${fromWallet}→${toWallet}`);
  }

  // ── REVERSE ────────────────────────────────────────────────────────────────

  /**
   * Reverse a previous transaction (creates a compensation entry).
   * Does NOT delete the original — creates a new REVERSAL transaction.
   */
  async reverse(
    originalTxId: string,
    userId:        string,
    reason:        string,
  ) {
    const original = await this.prisma.transaction.findUnique({
      where: { id: originalTxId },
      select: { amount: true, type: true, userId: true },
    });
    if (!original) throw new Error(`[Ledger] Transaction ${originalTxId} not found`);
    if (original.userId !== userId) throw new Error('[Ledger] Transaction userId mismatch');

    const reverseAmount = -original.amount; // flip sign

    if (reverseAmount > 0) {
      return this.credit(userId, reverseAmount, 'main', 'refund', `Hoàn tiền: ${reason}`, {
        refId: originalTxId, refType: 'reversal',
      });
    } else {
      return this.debit(userId, Math.abs(reverseAmount), 'main', 'reversal', `Đảo ngược: ${reason}`, {
        refId: originalTxId, refType: 'reversal',
      });
    }
  }

  // ── READ helpers ───────────────────────────────────────────────────────────

  /**
   * Get current wallet balances for a user.
   * Uses Redis cache (TTL 300s).
   */
  async getBalance(userId: string): Promise<Record<string, number>> {
    const cacheKey = this._balanceCacheKey(userId);
    return cache.remember(cacheKey, 300, async () => {
      const user = await this.prisma.user.findUnique({
        where:  { id: userId },
        select: { balance: true, frozen: true },
      });
      if (!user) throw new Error('User not found');
      return { main: Number(user.balance), locked: Number(user.frozen ?? 0) };
    });
  }

  /**
   * Get transaction history for a user (paginated).
   */
  async getHistory(userId: string, page = 1, limit = 20, filters: any = {}) {
    const skip = (page - 1) * limit;
    const where: any = { userId, ...filters };

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map((t: any) => ({ ...t, amount: Number(t.amount), balanceAfter: Number(t.balanceAfter) })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = LedgerService;
