// @ts-nocheck
'use strict';
/**
 * Trade User Service
 *
 * User management helpers for the trade sub-project.
 * Extends profile management with trading-specific fields
 * (preferred currency, notification preferences, KYC status).
 */

class TradeUserService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Get a user's full trading profile.
   */
  async getProfile(userId) {
    return this.prisma.user.findUnique({
      where:  { id: Number(userId) },
      select: {
        id:         true,
        email:      true,
        fullName:   true,
        phone:      true,
        kycStatus:  true,
        role:       true,
        status:     true,
        createdAt:  true,
        updatedAt:  true,
      },
    });
  }

  /**
   * List users for admin — supports kycStatus / status / search filters.
   */
  async list({ page = 1, limit = 20, kycStatus, status, q } = {}) {
    const where = {};
    if (kycStatus) where.kycStatus = kycStatus;
    if (status)    where.status    = status;
    if (q) {
      where.OR = [
        { email:    { contains: q } },
        { fullName: { contains: q } },
        { phone:    { contains: q } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id:        true,
          email:     true,
          fullName:  true,
          phone:     true,
          kycStatus: true,
          role:      true,
          status:    true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Update allowed profile fields for a user.
   */
  async updateProfile(userId, data) {
    const ALLOWED = ['fullName', 'phone', 'notificationPrefs'];
    const update  = Object.fromEntries(
      Object.entries(data).filter(([k]) => ALLOWED.includes(k))
    );
    if (!Object.keys(update).length) {
      throw Object.assign(new Error('Không có trường nào hợp lệ để cập nhật'), { status: 400 });
    }
    return this.prisma.user.update({
      where:  { id: Number(userId) },
      data:   { ...update, updatedAt: new Date() },
      select: { id: true, email: true, fullName: true, phone: true },
    });
  }

  /**
   * Admin: toggle user status (active ↔ suspended).
   */
  async toggleStatus(userId) {
    const user = await this.prisma.user.findUnique({ where: { id: Number(userId) }, select: { status: true } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await this.prisma.user.update({ where: { id: Number(userId) }, data: { status: newStatus } });
    return { userId: Number(userId), status: newStatus };
  }
}

module.exports = TradeUserService;
