/**
 * KYC Service — shared KYC document management across modules.
 * Handles submission, approval, rejection and admin listing.
 */
const emailService = require('./communication/emailService');
const logger       = require('../logger');

/**
 * Submit a KYC document set for a user.
 * @param {object} prisma
 * @param {string|number} userId
 * @param {object} documents – { fullName, idNumber, idType, idFront, idBack, selfie, address }
 */
exports.submit = async (prisma, userId, documents) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, email: true, fullName: true },
  });

  if (!user) throw new Error('User not found');
  if (user.kycStatus === 'verified') throw new Error('KYC đã được xác minh');
  if (user.kycStatus === 'pending_review') throw new Error('KYC đang chờ xem xét');

  const { fullName, idNumber, idFront, idBack, selfie, address, idType = 'cmnd' } = documents;
  if (!fullName || !idNumber || !idFront || !idBack || !selfie) {
    throw new Error('Vui lòng cung cấp đầy đủ thông tin KYC');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: 'pending_review',
      kycDocuments: { fullName, idNumber, idType, idFront, idBack, selfie, address, submittedAt: new Date() },
    },
    select: { id: true, email: true, fullName: true, kycStatus: true },
  });

  logger.info(`[KYC] submit userId=${userId} status=pending_review`);
  return updated;
};

/**
 * Approve a KYC request (admin only).
 */
exports.approve = async (prisma, userId, adminNote = '') => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, email: true, fullName: true },
  });
  if (!user) throw new Error('User not found');
  if (user.kycStatus === 'verified') throw new Error('KYC đã được duyệt từ trước');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: 'verified',
      kycDocuments: {
        ...(user.kycDocuments || {}),
        approvedAt: new Date(),
        adminNote,
      },
    },
    select: { id: true, email: true, fullName: true, kycStatus: true },
  });

  // Send notification email (fire-and-forget)
  if (user.email) {
    emailService.send(
      user.email,
      '[Xác minh danh tính] Tài khoản của bạn đã được xác minh',
      `<p>Xin chào <strong>${user.fullName}</strong>,</p>
       <p>Hồ sơ xác minh danh tính của bạn đã được <strong>phê duyệt</strong> thành công.</p>
       <p>Bạn có thể sử dụng đầy đủ các tính năng của nền tảng.</p>`,
    ).catch(() => {});
  }

  logger.info(`[KYC] approved userId=${userId}`);
  return updated;
};

/**
 * Reject a KYC request (admin only).
 */
exports.reject = async (prisma, userId, reason = '') => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, email: true, fullName: true, kycDocuments: true },
  });
  if (!user) throw new Error('User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: 'rejected',
      kycDocuments: {
        ...(user.kycDocuments || {}),
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    },
    select: { id: true, email: true, fullName: true, kycStatus: true },
  });

  if (user.email) {
    emailService.send(
      user.email,
      '[Xác minh danh tính] Hồ sơ của bạn bị từ chối',
      `<p>Xin chào <strong>${user.fullName}</strong>,</p>
       <p>Hồ sơ xác minh danh tính của bạn đã <strong>bị từ chối</strong>.</p>
       ${reason ? `<p>Lý do: ${reason}</p>` : ''}
       <p>Vui lòng gửi lại hồ sơ với thông tin chính xác hơn.</p>`,
    ).catch(() => {});
  }

  logger.info(`[KYC] rejected userId=${userId} reason=${reason}`);
  return updated;
};

/**
 * List all KYC documents (admin).
 */
exports.getAll    = async (prisma) => prisma.kycDocument.findMany();
exports.getById   = async (prisma, id) => prisma.kycDocument.findUnique({ where: { id } });

/**
 * List users with a specific KYC status.
 */
exports.listByStatus = async (prisma, status = 'pending_review', { skip = 0, take = 20 } = {}) => {
  return prisma.user.findMany({
    where: { kycStatus: status },
    skip,
    take,
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, fullName: true, phone: true, kycStatus: true, kycDocuments: true, createdAt: true },
  });
};
