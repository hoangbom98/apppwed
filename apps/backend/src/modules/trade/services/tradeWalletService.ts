// @ts-nocheck
'use strict';
/**
 * Trade Wallet Service
 *
 * Multi-currency wallet operations: balance queries, deposits,
 * withdrawals, and admin approval workflows.
 * All mutations that touch funds use Prisma transactions.
 */
const logger = require('../../../shared/services/logger');

class TradeWalletService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /** Return all wallet balances for a user. */
  async getBalances(userId) {
    return this.prisma.wallet.findMany({ where: { userId: Number(userId) } });
  }

  /**
   * Return wallet transaction history for a user.
   */
  async getHistory(userId, { page = 1, limit = 20, type, currency } = {}) {
    const where = { userId: Number(userId) };
    if (type)     where.type     = type;
    if (currency) where.currency = currency;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      this.prisma.transaction.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Create a pending deposit transaction.
   */
  async createDeposit(userId, { currency, amount, method, txHash } = {}) {
    if (!currency || !amount || Number(amount) <= 0) {
      throw Object.assign(new Error('Thông tin không hợp lệ'), { status: 400 });
    }
    return this.prisma.transaction.create({
      data: {
        userId:   Number(userId),
        type:     'deposit',
        currency: currency.toUpperCase(),
        amount:   parseFloat(amount),
        fee:      0,
        status:   'pending',
        txHash:   txHash ?? null,
        note:     `Nạp ${currency.toUpperCase()} qua ${method || 'manual'}`,
      },
    });
  }

  /**
   * Create a pending withdrawal and freeze funds.
   */
  async createWithdrawal(userId, { currency, amount, address, _method, fee = 0 } = {}) {
    if (!currency || !amount || Number(amount) <= 0 || !address) {
      throw Object.assign(new Error('Thông tin không hợp lệ'), { status: 400 });
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: { userId: Number(userId), currency: currency.toUpperCase() },
    });
    const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.frozen) : 0;
    const totalNeeded = parseFloat(amount) + parseFloat(fee);
    if (available < totalNeeded) {
      throw Object.assign(new Error('Số dư không đủ'), { status: 400 });
    }

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data:  { frozen: { increment: totalNeeded } },
      }),
      this.prisma.transaction.create({
        data: {
          userId:   Number(userId),
          type:     'withdraw',
          currency: currency.toUpperCase(),
          amount:   parseFloat(amount),
          fee:      parseFloat(fee),
          status:   'pending',
          note:     `Rút ${currency.toUpperCase()} về ${address}`,
        },
      }),
    ]);
    logger.info(`[TradeWalletService] Withdrawal created for user=${userId} currency=${currency} amount=${amount}`);
  }

  // ── Admin approval ────────────────────────────────────────────────────────

  /**
   * Approve a deposit: mark completed + credit wallet.
   */
  async approveDeposit(txnId) {
    const txn = await this.prisma.transaction.findUnique({ where: { id: Number(txnId) } });
    if (!txn || txn.type !== 'deposit' || txn.status !== 'pending') {
      throw Object.assign(new Error('Giao dịch không hợp lệ'), { status: 400 });
    }

    await this.prisma.$transaction([
      this.prisma.transaction.update({ where: { id: txn.id }, data: { status: 'completed' } }),
      this.prisma.wallet.upsert({
        where:  { userId_currency: { userId: txn.userId, currency: txn.currency } },
        create: { userId: txn.userId, currency: txn.currency, balance: txn.amount, frozen: 0 },
        update: { balance: { increment: parseFloat(txn.amount) } },
      }),
    ]);
    logger.info(`[TradeWalletService] Deposit ${txnId} approved for user=${txn.userId}`);
  }

  /**
   * Reject a deposit: mark failed.
   */
  async rejectDeposit(txnId, reason) {
    await this.prisma.transaction.update({
      where: { id: Number(txnId) },
      data:  { status: 'failed', note: reason },
    });
  }

  /**
   * Approve a withdrawal: mark completed + deduct frozen.
   */
  async approveWithdrawal(txnId) {
    const txn = await this.prisma.transaction.findUnique({ where: { id: Number(txnId) } });
    if (!txn || txn.type !== 'withdraw' || txn.status !== 'pending') {
      throw Object.assign(new Error('Giao dịch không hợp lệ'), { status: 400 });
    }
    const totalDeduct = parseFloat(txn.amount) + parseFloat(txn.fee);

    await this.prisma.$transaction([
      this.prisma.transaction.update({ where: { id: txn.id }, data: { status: 'completed' } }),
      this.prisma.wallet.updateMany({
        where: { userId: txn.userId, currency: txn.currency },
        data:  { balance: { decrement: totalDeduct }, frozen: { decrement: totalDeduct } },
      }),
    ]);
    logger.info(`[TradeWalletService] Withdrawal ${txnId} approved`);
  }

  /**
   * Reject a withdrawal: mark failed + unfreeze.
   */
  async rejectWithdrawal(txnId, reason) {
    const txn = await this.prisma.transaction.findUnique({ where: { id: Number(txnId) } });
    if (!txn) throw Object.assign(new Error('Giao dịch không tìm thấy'), { status: 404 });
    const totalDeduct = parseFloat(txn.amount) + parseFloat(txn.fee);

    await this.prisma.$transaction([
      this.prisma.transaction.update({ where: { id: txn.id }, data: { status: 'failed', note: reason } }),
      this.prisma.wallet.updateMany({
        where: { userId: txn.userId, currency: txn.currency },
        data:  { frozen: { decrement: totalDeduct } },
      }),
    ]);
  }
}

module.exports = TradeWalletService;
