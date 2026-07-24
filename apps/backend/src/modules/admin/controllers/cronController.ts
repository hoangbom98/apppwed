// @ts-nocheck
'use strict';
/**
 * cronController.js
 * Routes: /admin/cron/*
 *
 *   GET    /admin/cron                — list all cron jobs
 *   PATCH  /admin/cron/:id            — update name / description / command / schedule
 *   PATCH  /admin/cron/:id/toggle     — toggle active ↔ inactive
 *   POST   /admin/cron/:id/run        — trigger run (HTTP fetch to command URL + stamp lastRunAt)
 *   POST   /admin/cron/seed           — seed defaults (super_admin only)
 *
 * Real-time: emits `admin:cron_status` via Socket.IO /admin namespace after every
 * run/toggle so the CronJobs page updates without polling.
 */
const { success, error } = require('../../../shared/utils/response');
const cronSvc            = require('../services/cronService');
const { getIo }          = require('../../../config/socket');

// ── Socket helper: broadcast cron status to all admin sockets ─────────────────
function emitCronStatus(jobId, status, lastRunAt) {
  try {
    const io = getIo();
    if (!io) return;
    const payload = { jobId, status, lastRunAt, timestamp: new Date().toISOString() };
    io.to('admin:all').emit('admin:cron_status', payload);
    const adminNsp = io.of('/admin');
    if (adminNsp) adminNsp.to('admin:all').emit('admin:cron_status', payload);
  } catch { /* non-critical */ }
}

// GET /admin/cron
exports.list = async (req, res) => {
  try {
    const data = await cronSvc.getAll(req.prisma);
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

// PATCH /admin/cron/:id
exports.update = async (req, res) => {
  try {
    const data = await cronSvc.update(req.prisma, req.params.id, req.body);
    return success(res, data, 'Đã cập nhật cron job');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy cron job', 404);
    return error(res, e.message, 500);
  }
};

// PATCH /admin/cron/:id/toggle
exports.toggle = async (req, res) => {
  try {
    const data = await cronSvc.toggleStatus(req.prisma, req.params.id);
    if (!data) return error(res, 'Không tìm thấy cron job', 404);
    emitCronStatus(data.id, data.status, data.lastRunAt);
    return success(res, data, `Đã ${data.status === 'active' ? 'kích hoạt' : 'tạm dừng'} cron job`);
  } catch (e) { return error(res, e.message, 500); }
};

// POST /admin/cron/:id/run — trigger the job URL + stamp lastRunAt
exports.runNow = async (req, res) => {
  try {
    const job = await cronSvc.getById(req.prisma, req.params.id);
    if (!job) return error(res, 'Không tìm thấy cron job', 404);

    // Stamp "running" immediately for optimistic UI
    emitCronStatus(job.id, 'running', null);

    // Resolve full URL from command path + base URL + cron secret
    let runOk = false;
    let logText = 'Manual run by admin';

    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
    const cronSecret = await req.prisma.systemSetting.findUnique({ where: { key: 'other' } }).then(r => {
      try { return JSON.parse(r?.value ?? '{}')?.cron_job_secret; } catch { return null; }
    }).catch(() => null);

    // Only attempt HTTP call if command looks like a URL path
    if (job.command && job.command.startsWith('/') && cronSecret) {
      const url = `${baseUrl}/api${job.command}?key=${cronSecret}`;
      try {
        const resp = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(30_000),  // 30s timeout
        });
        runOk   = resp.ok;
        logText = `Manual run — HTTP ${resp.status} ${resp.statusText}`;
      } catch (fetchErr) {
        runOk   = false;
        logText = `Manual run failed: ${fetchErr.message}`;
      }
    } else {
      // No HTTP endpoint configured — just stamp the run
      runOk   = true;
      logText = 'Manual run stamped (no HTTP endpoint configured)';
    }

    const data = await cronSvc.recordRun(req.prisma, req.params.id, runOk, logText);
    emitCronStatus(data.id, data.status, data.lastRunAt);
    return success(res, data, runOk ? 'Đã kích hoạt cron job' : 'Cron job chạy thất bại');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy cron job', 404);
    return error(res, e.message, 500);
  }
};

// POST /admin/cron/seed
exports.seed = async (req, res) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return error(res, 'Chỉ super_admin mới được seed cron jobs', 403);
    }
    await cronSvc.seed(req.prisma);
    return success(res, null, 'Đã seed cron jobs thành công');
  } catch (e) { return error(res, e.message, 500); }
};
