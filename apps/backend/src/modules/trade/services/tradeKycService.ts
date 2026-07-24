// @ts-nocheck
'use strict';
/**
 * Trade KYC Service
 *
 * Handles KYC document submission, status management, and admin review.
 * Uses the dedicated `Kyc` model (@@map "kyc"), not User.kycDocuments.
 * All IDs are CUIDs (strings) — never use Number(userId).
 */
const logger = require('../../../shared/services/logger');

class TradeKycService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Get a user's current KYC status and Kyc record.
   */
  async getStatus(userId) {
    const [user, kyc] = await Promise.all([
      this.prisma.user.findUnique({
        where:  { id: userId },  // CUID string
        select: { kycStatus: true },
      }),
      this.prisma.kyc.findUnique({ where: { userId } }),
    ]);
    return {
      status:    user?.kycStatus || 'pending',
      documents: kyc || null,
    };
  }

  /**
   * List KYC records pending admin review.
   */
  async listPending({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const take = Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.kyc.findMany({
        where:   { status: 'pending' },
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, email: true, fullName: true, kycStatus: true } } },
      }),
      this.prisma.kyc.count({ where: { status: 'pending' } }),
    ]);
    return { data, meta: { total, page: Number(page), limit: take } };
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Submit KYC documents for a user.
   *
   * @param {string} userId  — CUID
   * @param {{ fullName, idNumber, idFront, idBack, selfie, address? }} docs
   */
  async submit(userId, { fullName, idNumber, idFront, idBack, selfie, address }) {
    if (!fullName || !idNumber || !idFront || !idBack || !selfie) {
      throw Object.assign(new Error('Vui lòng cung cấp đầy đủ thông tin KYC'), { status: 400 });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    if (user.kycStatus === 'verified')       throw Object.assign(new Error('KYC đã được xác minh'), { status: 400 });
    if (user.kycStatus === 'pending_review') throw Object.assign(new Error('KYC đang chờ xem xét'),  { status: 400 });

    await this.prisma.$transaction([
      this.prisma.kyc.upsert({
        where:  { userId },
        create: { userId, fullName, idNumber, idFront, idBack, selfie, address: address ?? null, status: 'pending' },
        update: { fullName, idNumber, idFront, idBack, selfie, address: address ?? null, status: 'pending', reviewedBy: null, reviewedAt: null, note: null },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data:  { kycStatus: 'pending_review' },
      }),
    ]);

    logger.info(`[TradeKycService] KYC submitted for user=${userId}`);
  }

  /**
   * Admin: approve a user's KYC.
   * @param {string} userId  — CUID
   * @param {string} adminId — CUID of the reviewing admin
   */
  async approve(userId, adminId) {
    await this.prisma.$transaction([
      this.prisma.kyc.update({
        where: { userId },
        data:  { status: 'approved', reviewedBy: adminId, reviewedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data:  { kycStatus: 'verified' },
      }),
    ]);
    logger.info(`[TradeKycService] KYC approved for user=${userId} by admin=${adminId}`);
  }

  /**
   * Admin: reject a user's KYC with a reason.
   * @param {string} userId  — CUID
   * @param {string} reason
   * @param {string} adminId — CUID
   */
  async reject(userId, reason, adminId) {
    await this.prisma.$transaction([
      this.prisma.kyc.update({
        where: { userId },
        data:  { status: 'rejected', note: reason || 'Rejected by admin', reviewedBy: adminId, reviewedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data:  { kycStatus: 'rejected' },
      }),
    ]);
    logger.info(`[TradeKycService] KYC rejected for user=${userId} by admin=${adminId}`);
  }
}

module.exports = TradeKycService;
