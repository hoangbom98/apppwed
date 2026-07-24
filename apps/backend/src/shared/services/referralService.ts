// @ts-nocheck
/**
 * ReferralService — multi-level referral & agent commission engine.
 *
 * Architecture:
 *  - Each user can have a referral_code (unique, generated on register).
 *  - When a new user registers with a valid referral_code, their referrerId is set.
 *  - Commissions are calculated on every qualifying transaction (deposit/bet/trade).
 *  - Multi-level: level 1 = direct referrer, level 2 = referrer's referrer, etc.
 *  - Max levels are configured per project via ConfigService.
 *
 * Schema required on the project's `user` model:
 *   referralCode  String? @unique
 *   referrerId    Int?
 *   referrer      User?   @relation("Referrals", fields: [referrerId], references: [id])
 *   referrals     User[]  @relation("Referrals")
 *   totalReferrals Int    @default(0)
 *
 * Schema required on the project's `referralCommission` model:
 *   id, userId, referrerId, level, sourceType, sourceId, amount,
 *   baseAmount, rate, status, createdAt
 */
const crypto        = require('crypto');
const logger        = require('./logger');
const ConfigService = require('./configService');
const auditService  = require('./auditService');

// Default commission rates per level (fallback if not configured in ProjectConfig)
const DEFAULT_RATES = { 1: 0.05, 2: 0.02, 3: 0.01 };  // 5%, 2%, 1%
const DEFAULT_MAX_LEVELS = 3;

class ReferralService {
  /**
   * @param {object} prisma        – the project's own Prisma client
   * @param {string} projectCode   – e.g. 'game', 'dating', 'trade'
   * @param {object} adminPrisma   – admin_db Prisma client (for ConfigService)
   */
  constructor(prisma, projectCode, adminPrisma = null) {
    this.prisma        = prisma;
    this.projectCode   = projectCode;
    this.configService = new ConfigService(adminPrisma || prisma);
  }

  // ── Referral code helpers ────────────────────────────────────────────────────

  /**
   * Generate a unique 8-char referral code for a new user.
   * Format: uppercase alphanumeric, no ambiguous chars (0/O/I/l).
   * @returns {string}
   */
  generateCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    return Array.from(crypto.randomBytes(8))
      .map(b => chars[b % chars.length])
      .join('');
  }

  /**
   * Assign a unique referral code to a user (called on register if not already set).
   * @param {string|number} userId
   * @returns {Promise<string>} the assigned code
   */
  async assignCode(userId) {
    // Check if user already has a code
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { referralCode: true },
    });
    if (user?.referralCode) return user.referralCode;

    // Generate unique code (retry on collision)
    let code;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = this.generateCode();
      const existing = await this.prisma.user.findFirst({ where: { referralCode: candidate } });
      if (!existing) { code = candidate; break; }
    }
    if (!code) throw new Error('[Referral] Failed to generate unique referral code');

    await this.prisma.user.update({
      where: { id: userId },
      data:  { referralCode: code },
    });
    return code;
  }

  /**
   * Bind a new user to their referrer via a referral code.
   * Called during registration AFTER the user row is created.
   *
   * @param {string|number} newUserId   – ID of the newly registered user
   * @param {string}        code        – referral code entered at registration
   * @returns {Promise<{referrerId: number}|null>}  null if code invalid
   */
  async bindReferrer(newUserId, code) {
    if (!code) return null;

    const referrer = await this.prisma.user.findFirst({
      where:  { referralCode: code.toUpperCase() },
      select: { id: true },
    });

    if (!referrer || referrer.id === newUserId) return null;

    await this.prisma.user.update({
      where: { id: newUserId },
      data:  { referrerId: referrer.id },
    });

    // Increment totalReferrals on the referrer
    await this.prisma.user.update({
      where: { id: referrer.id },
      data:  { totalReferrals: { increment: 1 } },
    }).catch(() => {});  // non-fatal if field missing

    logger.info(`[Referral] bind userId=${newUserId} → referrerId=${referrer.id} code=${code}`);
    return { referrerId: referrer.id };
  }

  // ── Commission calculation ───────────────────────────────────────────────────

  /**
   * Award commission to the referral chain for a qualifying transaction.
   * Walks up the referral tree up to maxLevels.
   *
   * @param {object} opts
   * @param {string|number} opts.userId      – the user who triggered the transaction
   * @param {string}        opts.sourceType  – 'deposit' | 'bet' | 'trade' | 'purchase'
   * @param {string|number} opts.sourceId    – order/transaction ID
   * @param {number}        opts.baseAmount  – gross amount the commission is based on
   */
  async awardCommissions({ userId, sourceType, sourceId, baseAmount }) {
    // Load config
    const maxLevels = await this._getConfigNumber('maxLevels', DEFAULT_MAX_LEVELS);
    const rates     = await this._getLevelRates(maxLevels);

    // Walk up the referral chain
    let currentId = userId;
    for (let level = 1; level <= maxLevels; level++) {
      const user = await this.prisma.user.findUnique({
        where:  { id: currentId },
        select: { referrerId: true },
      });
      if (!user?.referrerId) break;  // no more ancestors

      const referrerId = user.referrerId;
      const rate       = rates[level] ?? 0;
      if (rate <= 0) { currentId = referrerId; continue; }

      const commission = parseFloat((baseAmount * rate).toFixed(2));
      if (commission <= 0) { currentId = referrerId; continue; }

      // Credit referrer's balance and record commission
      await this.prisma.$transaction(async (t) => {
        await t.user.update({
          where: { id: referrerId },
          data:  { balance: { increment: commission } },
        });
        await t.referralCommission.create({
          data: {
            userId:      referrerId,
            referrerId:  currentId,
            level,
            sourceType,
            sourceId:    String(sourceId),
            amount:      commission,
            baseAmount,
            rate,
            status:      'paid',
          },
        });
      });

      logger.info(
        `[Referral] commission level=${level} referrerId=${referrerId} amount=${commission} source=${sourceType}#${sourceId}`
      );

      await auditService.log({
        action:  'referral.commission',
        userId:  referrerId,
        project: this.projectCode,
        meta:    { level, sourceType, sourceId, baseAmount, commission, rate },
      });

      currentId = referrerId;
    }
  }

  // ── Query helpers ────────────────────────────────────────────────────────────

  /**
   * Get direct referrals for a user (level 1 only).
   * @param {string|number} userId
   * @param {{ skip?: number, take?: number }} pagination
   */
  async getDirectReferrals(userId, { skip = 0, take = 20 } = {}) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where:   { referrerId: userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select:  { id: true, username: true, fullName: true, createdAt: true, balance: true },
      }),
      this.prisma.user.count({ where: { referrerId: userId } }),
    ]);
    return { data, total };
  }

  /**
   * Get commission history for a user.
   * @param {string|number} userId
   * @param {{ skip?: number, take?: number, sourceType?: string }} opts
   */
  async getCommissionHistory(userId, { skip = 0, take = 20, sourceType } = {}) {
    const where = { userId, ...(sourceType && { sourceType }) };
    const [data, total] = await Promise.all([
      this.prisma.referralCommission.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.referralCommission.count({ where }),
    ]);
    const totalEarned = await this.prisma.referralCommission.aggregate({
      where:  { userId, status: 'paid' },
      _sum:   { amount: true },
    });
    return { data, total, totalEarned: Number(totalEarned._sum?.amount ?? 0) };
  }

  /**
   * Admin: list all referrals (paginated).
   */
  async adminList({ skip = 0, take = 50, userId } = {}) {
    const where = userId ? { userId } : {};
    const [data, total] = await Promise.all([
      this.prisma.referralCommission.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.referralCommission.count({ where }),
    ]);
    return { data, total };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  async _getConfigNumber(key, fallback) {
    const val = await this.configService.get(this.projectCode, 'referral', 'commission', key, fallback);
    return Number(val ?? fallback);
  }

  async _getLevelRates(maxLevels) {
    const rates = {};
    for (let i = 1; i <= maxLevels; i++) {
      const r = await this.configService.get(
        this.projectCode, 'referral', 'rates', `level${i}`, DEFAULT_RATES[i] ?? 0
      );
      rates[i] = Number(r);
    }
    return rates;
  }
}

module.exports = ReferralService;
