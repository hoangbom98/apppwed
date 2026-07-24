'use strict';
/**
 * trade/controllers/kycController.js
 *
 * Uses the dedicated `Kyc` model (@@map "kyc") which has a @unique userId.
 * User.kycStatus is the status field on User itself.
 * All IDs are CUIDs (strings) — never coerce with +id.
 */
const { success, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

// ── GET /kyc — user's own KYC status ────────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const [user, kyc] = await Promise.all([
      req.prisma.user.findUnique({
        where:  { id: req.user.id },
        select: { kycStatus: true },
      }),
      req.prisma.kyc.findUnique({ where: { userId: req.user.id } }),
    ]);
    return success(res, {
      status:    user?.kycStatus || 'pending',
      documents: kyc || null,
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /kyc — submit KYC documents ────────────────────────────────────────
exports.submit = async (req, res) => {
  try {
    const { fullName, idNumber, idFront, idBack, selfie, address } = req.body;
    if (!fullName || !idNumber || !idFront || !idBack || !selfie) {
      return error(res, 'Vui lòng cung cấp đầy đủ thông tin KYC', 400);
    }

    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { kycStatus: true },
    });
    if (!user)                             return notFound(res, 'User not found');
    if (user.kycStatus === 'verified')     return error(res, 'KYC đã được xác minh', 400);
    if (user.kycStatus === 'pending_review') return error(res, 'KYC đang chờ xem xét', 400);

    await req.prisma.$transaction([
      req.prisma.kyc.upsert({
        where:  { userId: req.user.id },
        create: { userId: req.user.id, fullName, idNumber, idFront, idBack, selfie, address: address ?? null, status: 'pending' },
        update: { fullName, idNumber, idFront, idBack, selfie, address: address ?? null, status: 'pending', reviewedBy: null, reviewedAt: null, note: null },
      }),
      req.prisma.user.update({
        where: { id: req.user.id },
        data:  { kycStatus: 'pending_review' },
      }),
    ]);

    return success(res, null, 'KYC đã gửi, đang chờ xem xét');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: GET /admin/kyc/pending ────────────────────────────────────────────
exports.listPending = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.kyc.findMany({
        where:   { status: 'pending' },
        skip, take,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, email: true, fullName: true, kycStatus: true } } },
      }),
      req.prisma.kyc.count({ where: { status: 'pending' } }),
    ]);
    return success(res, { data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: PUT /admin/kyc/:userId/approve ────────────────────────────────────
exports.approveKyc = async (req, res) => {
  try {
    const userId = req.params.userId; // CUID string — no coercion
    await req.prisma.$transaction([
      req.prisma.kyc.update({
        where: { userId },
        data:  { status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date() },
      }),
      req.prisma.user.update({
        where: { id: userId },
        data:  { kycStatus: 'verified' },
      }),
    ]);
    return success(res, null, 'KYC đã được duyệt');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: PUT /admin/kyc/:userId/reject ─────────────────────────────────────
exports.rejectKyc = async (req, res) => {
  try {
    const userId = req.params.userId; // CUID string — no coercion
    const { reason } = req.body;
    await req.prisma.$transaction([
      req.prisma.kyc.update({
        where: { userId },
        data:  { status: 'rejected', note: reason || null, reviewedBy: req.user.id, reviewedAt: new Date() },
      }),
      req.prisma.user.update({
        where: { id: userId },
        data:  { kycStatus: 'rejected' },
      }),
    ]);
    return success(res, null, 'KYC đã bị từ chối');
  } catch (e) { return error(res, e.message, 500); }
};
