// @ts-nocheck
/**
 * WalletService — shared wallet operations across all modules.
 * Works with both the per-project `wallet` table (trade) and
 * the simple `balance` field on the `user` model (game, lkvip, sports, dating).
 *
 * All balance mutations run inside a Prisma $transaction to prevent race conditions.
 */
const ConfigService = require('./configService');
const logger        = require('./logger');

class WalletService {
  constructor(prisma) {
    this.prisma        = prisma;
    this.configService = new ConfigService(prisma);
  }

  // ── Simple user-balance helpers (game / sports / dating / lkvip) ───────────

  /**
   * Credit user.balance and append a transaction record.
   * @param {string|number} userId
   * @param {number}        amount   – must be > 0
   * @param {string}        type     – e.g. 'deposit', 'win', 'refund'
   * @param {string}        [description]
   * @param {object}        [extra]  – additional transaction fields
   */
  async credit(prisma, userId, amount, type, description = '', extra = {}) {
    const tx = prisma ?? this.prisma;
    return tx.$transaction(async (t) => {
      const user = await t.user.update({
        where: { id: userId },
        data:  { balance: { increment: amount } },
        select: { balance: true },
      });
      await t.transaction.create({
        data: {
          userId,
          type,
          amount,
          balanceAfter: Number(user.balance),
          note: description,
          ...extra,
        },
      });
      logger.info(`[Wallet] credit userId=${userId} amount=${amount} type=${type}`);
      return Number(user.balance);
    });
  }

  /**
   * Debit user.balance. Throws if insufficient funds.
   */
  async debit(prisma, userId, amount, type, description = '', extra = {}) {
    const tx = prisma ?? this.prisma;
    return tx.$transaction(async (t) => {
      const user = await t.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (!user || Number(user.balance) < amount) {
        throw new Error('Số dư không đủ');
      }
      const updated = await t.user.update({
        where: { id: userId },
        data:  { balance: { decrement: amount } },
        select: { balance: true },
      });
      await t.transaction.create({
        data: {
          userId,
          type,
          amount: -amount,
          balanceAfter: Number(updated.balance),
          note: description,
          ...extra,
        },
      });
      logger.info(`[Wallet] debit userId=${userId} amount=${amount} type=${type}`);
      return Number(updated.balance);
    });
  }

  /**
   * Freeze funds (move available → frozen).
   * Atomic: read + check + update all in a single $transaction to prevent race conditions.
   */
  async freeze(prisma, userId, amount) {
    const tx = prisma ?? this.prisma;
    return tx.$transaction(async (t) => {
      const user = await t.user.findUnique({ where: { id: userId }, select: { balance: true, frozen: true } });
      if (!user) throw new Error('User not found');
      const available = Number(user.balance) - Number(user.frozen);
      if (available < amount) throw new Error('Số dư khả dụng không đủ để đặt cọc');
      await t.user.update({ where: { id: userId }, data: { frozen: { increment: amount } } });
      logger.info(`[Wallet] freeze userId=${userId} amount=${amount}`);
    });
  }

  /**
   * Unfreeze funds (move frozen → available) without deducting balance.
   * Used when a withdrawal is rejected.
   * Atomic: prevents negative frozen balance under concurrent requests.
   */
  async unfreeze(prisma, userId, amount) {
    const tx = prisma ?? this.prisma;
    return tx.$transaction(async (t) => {
      const user = await t.user.findUnique({ where: { id: userId }, select: { frozen: true } });
      if (!user) throw new Error('User not found');
      if (Number(user.frozen) < amount) throw new Error('Số dư đặt cọc không đủ để giải phóng');
      await t.user.update({ where: { id: userId }, data: { frozen: { decrement: amount } } });
      logger.info(`[Wallet] unfreeze userId=${userId} amount=${amount}`);
    });
  }

  /**
   * Settle frozen funds: reduce both balance and frozen simultaneously.
   * Used when a withdrawal is approved (funds leave the platform).
   */
  async settleFrozen(prisma, userId, amount, type, description = '') {
    const tx = prisma ?? this.prisma;
    return tx.$transaction(async (t) => {
      const user = await t.user.update({
        where: { id: userId },
        data:  { frozen: { decrement: amount } },
        select: { balance: true },
      });
      await t.transaction.create({
        data: {
          userId,
          type,
          amount: -amount,
          balanceAfter: Number(user.balance),
          note: description,
        },
      });
      logger.info(`[Wallet] settleFrozen userId=${userId} amount=${amount}`);
      return Number(user.balance);
    });
  }

  // ── Eligibility checks ────────────────────────────────────────────────────

  /**
   * Return available deposit methods for a project.
   * If deposit is disabled, returns { enabled: false, message }.
   * @param {string} projectCode
   */
  async getDepositMethods(projectCode) {
    const cfg = await this.configService.getDepositConfig(projectCode);
    if (!cfg.enabled) {
      return { enabled: false, message: cfg.message || 'Nạp tiền tạm thời đóng' };
    }
    return { enabled: true, methods: cfg.methods };
  }

  /**
   * Return available withdraw methods for a project.
   * @param {string} projectCode
   */
  async getWithdrawMethods(projectCode) {
    const cfg = await this.configService.getWithdrawConfig(projectCode);
    if (!cfg.enabled) {
      return { enabled: false, message: cfg.message || 'Rút tiền tạm thời đóng' };
    }
    return { enabled: true, methods: cfg.methods };
  }

  /**
   * Check if deposit is allowed for a user (feature flag + method + min/max + KYC).
   * @param {string}        projectCode
   * @param {number}        amount
   * @param {string}        userId
   * @param {string|null}   method  – payment method (optional, validated if provided)
   */
  async checkDepositEligibility(projectCode, amount, userId, method = null) {
    const cfg = await this.configService.getDepositConfig(projectCode);

    if (!cfg.enabled) throw new Error(cfg.message || 'Nạp tiền tạm thời đóng');

    if (method && cfg.methods.length && !cfg.methods.includes(method)) {
      throw new Error(`Phương thức "${method}" không được hỗ trợ. Các phương thức hợp lệ: ${cfg.methods.join(', ')}`);
    }

    if (Number(amount) < cfg.minAmount) throw new Error(`Số tiền tối thiểu là ${cfg.minAmount}`);
    if (Number(amount) > cfg.maxAmount) throw new Error(`Số tiền tối đa là ${cfg.maxAmount}`);

    if (cfg.requireKYC && userId) {
      const user = await this.prisma.user.findUnique({
        where:  { id: userId },
        select: { kycLevel: true },
      });
      if (!user || user.kycLevel !== 'verified') {
        throw new Error('Cần xác minh danh tính (KYC) trước khi nạp tiền');
      }
    }
  }

  /**
   * Check if withdrawal is allowed for a user (feature flag + method + min/max + KYC).
   * @param {string}      projectCode
   * @param {number}      amount
   * @param {string}      userId
   * @param {string|null} method
   */
  async checkWithdrawEligibility(projectCode, amount, userId, method = null) {
    const cfg = await this.configService.getWithdrawConfig(projectCode);

    if (!cfg.enabled) throw new Error(cfg.message || 'Rút tiền tạm thời đóng');

    if (method && cfg.methods.length && !cfg.methods.includes(method)) {
      throw new Error(`Phương thức "${method}" không được hỗ trợ. Các phương thức hợp lệ: ${cfg.methods.join(', ')}`);
    }

    if (Number(amount) < cfg.minAmount) throw new Error(`Số tiền tối thiểu là ${cfg.minAmount}`);
    if (Number(amount) > cfg.maxAmount) throw new Error(`Số tiền tối đa là ${cfg.maxAmount}`);

    if (cfg.requireKYC && userId) {
      const user = await this.prisma.user.findUnique({
        where:  { id: userId },
        select: { kycLevel: true },
      });
      if (!user || user.kycLevel !== 'verified') {
        throw new Error('Cần xác minh danh tính (KYC) trước khi rút tiền');
      }
    }
  }

  // ── Per-currency wallet (trade module) ────────────────────────────────────

  /**
   * Get balance for a specific currency wallet.
   */
  async getBalance(userId, currency = 'VND') {
    const wallet = await this.prisma.wallet.findFirst({ where: { userId, currency } });
    return wallet ? Number(wallet.balance) : 0;
  }
}

module.exports = WalletService;
