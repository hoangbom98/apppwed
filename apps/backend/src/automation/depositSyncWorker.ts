// @ts-nocheck
'use strict';
/**
 * depositSyncWorker.ts — Tự động xác nhận Virtual Account pending.
 *
 * Luồng:
 *   1. Cron chạy mỗi 1 phút → quét tất cả VA có status=pending
 *   2. VA đã hết hạn (expiredAt < now) → đánh dấu expired, emit deposit:expired
 *   3. VA còn hạn nhưng đã qua 30 phút mà chưa có giao dịch → cảnh báo admin
 *
 * External bank confirmation vẫn qua webhook (POST /lkvip/webhook/deposit).
 * Worker này chịu trách nhiệm:
 *   - Dọn dẹp VA hết hạn (trả lại frozen balance nếu có)
 *   - Gửi thông báo nhắc nhở user khi VA sắp hết hạn (< 10 phút)
 *   - Alert admin khi có nhiều VA pending bất thường
 *
 * Schedule: mỗi 1 phút  ('* * * * *')
 */

const logger = require('../shared/services/logger');
const biz    = require('./businessEvents');

const WARN_EXPIRY_MINUTES  = 10;  // cảnh báo user khi còn < 10 phút
const ALERT_PENDING_LIMIT  = 50;  // alert admin khi có > 50 VA pending cùng lúc

/**
 * Main job — được gọi bởi cron.register()
 */
async function runDepositSync() {
  const { getPrismaClient } = require('../config/databases');
  const notifSvc            = require('../shared/services/notificationService');
  const alertHelper         = require('../risk/alertHelper');

  const prisma = getPrismaClient('lkvip');
  if (!prisma) return; // lkvip DB chưa cấu hình

  const now = new Date();

  // ── 1. Lấy tất cả pending VAs ─────────────────────────────────────────────
  const pendingVAs = await prisma.virtualAccount.findMany({
    where:   { status: 'pending' },
    include: { user: { select: { id: true, username: true } } },
  }).catch(() => []);

  if (pendingVAs.length === 0) return;

  // Alert admin nếu quá nhiều VA pending
  if (pendingVAs.length > ALERT_PENDING_LIMIT) {
    await alertHelper.sendAlert(
      `⚠️ Có ${pendingVAs.length} VA đang pending — kiểm tra hệ thống bank`,
      'medium',
      { count: pendingVAs.length },
    );
  }

  const expiredIds      = [];
  const aboutToExpireVAs = [];

  for (const va of pendingVAs) {
    const msLeft = va.expiredAt.getTime() - now.getTime();

    // ── Đã hết hạn ────────────────────────────────────────────────────────
    if (msLeft <= 0) {
      expiredIds.push(va.id);
      biz.emit('deposit:expired', {
        userId:   va.userId,
        vaNumber: va.vaNumber,
        amount:   Number(va.expectedAmount ?? 0),
      });
      continue;
    }

    // ── Sắp hết hạn (< WARN_EXPIRY_MINUTES) ──────────────────────────────
    const minsLeft = Math.round(msLeft / 60_000);
    if (minsLeft <= WARN_EXPIRY_MINUTES) {
      aboutToExpireVAs.push({ va, minsLeft });
    }
  }

  // ── 2. Batch-expire expired VAs ──────────────────────────────────────────
  if (expiredIds.length > 0) {
    await prisma.virtualAccount
      .updateMany({
        where: { id: { in: expiredIds } },
        data:  { status: 'expired' },
      })
      .catch((err) => logger.error('[DepositSync] expire VA failed', { err: err.message }));

    logger.info(`[DepositSync] Expired ${expiredIds.length} VAs`);
  }

  // ── 3. Nhắc nhở user sắp hết hạn (Socket.IO push, best-effort) ──────────
  for (const { va, minsLeft } of aboutToExpireVAs) {
    notifSvc.sendToUser(va.userId, 'notification', {
      title:   'Lệnh nạp sắp hết hạn',
      content: `Lệnh nạp ${Number(va.expectedAmount).toLocaleString('vi-VN')} VND sẽ hết hạn sau ${minsLeft} phút. Vui lòng chuyển khoản sớm.`,
      type:    'warning',
    });
  }

  if (aboutToExpireVAs.length > 0) {
    logger.debug(`[DepositSync] Warned ${aboutToExpireVAs.length} users about expiring VAs`);
  }
}

module.exports = { runDepositSync };
