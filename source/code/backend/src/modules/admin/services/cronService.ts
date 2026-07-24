// @ts-nocheck
'use strict';
/**
 * cronService.js
 *
 * Manages CronJob records in admin_db.
 * Each row represents one background job the operator must configure
 * on their hosting / server cPanel / Linux crontab.
 *
 * The service does NOT execute any code — it is a registry + status display.
 * The actual cron runner calls the command URL with the secret appended.
 */

const logger = require('../../../shared/services/logger');

// ── Default cron job definitions ──────────────────────────────────────────────
const DEFAULT_CRONS = [
  {
    name:        'Cron Job Chính',
    description: 'Bắt buộc để tạo sitemap, giao dịch ảo và các tác vụ định kỳ chính.',
    command:     '/cron/main',
    schedule:    '*/5 * * * *',
    status:      'active',
  },
  {
    name:        'Cron Job Bank',
    description: 'Xử lý nạp tiền tự động qua ngân hàng / ví điện tử.',
    command:     '/cron/bank',
    schedule:    '*/1 * * * *',
    status:      'active',
  },
  {
    name:        'Cron Job Cộng hoa hồng',
    description: 'Tự động tính và cộng hoa hồng đại lý theo chu kỳ.',
    command:     '/cron/commission',
    schedule:    '*/10 * * * *',
    status:      'active',
  },
  {
    name:        'Check Live tài khoản',
    description: 'Tự động kiểm tra trạng thái live/die các tài khoản trong kho hàng giao ngay.',
    command:     '/cron/check-live-stock',
    schedule:    '*/1 * * * *',
    status:      'inactive',
  },
  {
    name:        'Cron gửi mail tự động',
    description: 'Xử lý hàng đợi email thông báo (welcome, OTP, order confirmation…).',
    command:     '/cron/email-queue',
    schedule:    '*/2 * * * *',
    status:      'active',
  },
  {
    name:        'Xóa đơn hàng hết hạn',
    description: 'Tự động hủy / xóa các đơn hàng pending quá thời gian quy định.',
    command:     '/cron/expire-orders',
    schedule:    '*/15 * * * *',
    status:      'active',
  },
  {
    name:        'Dọn dẹp session hết hạn',
    description: 'Xóa các session user đã hết hạn khỏi database.',
    command:     '/cron/cleanup-sessions',
    schedule:    '0 * * * *',
    status:      'active',
  },
  {
    name:        'Backup database hàng ngày',
    description: 'Tạo bản sao lưu cơ sở dữ liệu và nén lưu trữ.',
    command:     '/cron/db-backup',
    schedule:    '0 3 * * *',
    status:      'inactive',
  },
  {
    name:        'Báo cáo doanh thu hàng ngày',
    description: 'Tổng hợp báo cáo doanh thu và gửi qua Telegram cho Admin.',
    command:     '/cron/daily-report',
    schedule:    '0 8 * * *',
    status:      'active',
  },
  {
    name:        'Cập nhật điểm VIP',
    description: 'Tự động tính lại hạng VIP của thành viên dựa trên lịch sử giao dịch.',
    command:     '/cron/update-vip',
    schedule:    '0 0 * * *',
    status:      'active',
  },
];

// ── getAll ────────────────────────────────────────────────────────────────────
async function getAll(prisma) {
  return prisma.cronJob.findMany({ orderBy: { id: 'asc' } });
}

// ── getById ───────────────────────────────────────────────────────────────────
async function getById(prisma, id) {
  return prisma.cronJob.findUnique({ where: { id: Number(id) } });
}

// ── update ────────────────────────────────────────────────────────────────────
async function update(prisma, id, data) {
  const allowed = ['name','description','command','schedule','status'];
  const safe = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.cronJob.update({ where: { id: Number(id) }, data: safe });
}

// ── recordRun — called by cron endpoint to stamp lastRunAt ────────────────────
async function recordRun(prisma, id, ok, logText) {
  return prisma.cronJob.update({
    where: { id: Number(id) },
    data: {
      lastRunAt: new Date(),
      status:    ok ? 'active' : 'failed',
      log:       logText ?? null,
    },
  });
}

// ── toggleStatus ──────────────────────────────────────────────────────────────
async function toggleStatus(prisma, id) {
  const job = await getById(prisma, id);
  if (!job) return null;
  const next = job.status === 'active' ? 'inactive' : 'active';
  return prisma.cronJob.update({ where: { id: Number(id) }, data: { status: next } });
}

// ── seed — upserts DEFAULT_CRONS if not present ───────────────────────────────
async function seed(prisma) {
  for (const cron of DEFAULT_CRONS) {
    await prisma.cronJob.upsert({
      where:  { name: cron.name },
      create: cron,
      update: {},   // do not overwrite operator customisations
    });
  }
  logger.info('[CronSvc] Seeded default cron jobs');
}

module.exports = { getAll, getById, update, recordRun, toggleStatus, seed, DEFAULT_CRONS };
