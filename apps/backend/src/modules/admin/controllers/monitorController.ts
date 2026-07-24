// @ts-nocheck
// backend/src/modules/admin/controllers/monitorController.ts
// Realtime Monitor — Alerts, Admin Activity Logs, Chat
//   GET   /api/admin/monitor/alerts               — list alerts
//   PATCH /api/admin/monitor/alerts/:id/ack       — acknowledge alert
//   PATCH /api/admin/monitor/alerts/:id/resolve   — resolve alert
//   GET   /api/admin/monitor/logs                 — admin activity logs
//   GET   /api/admin/monitor/online               — online user count per project
'use strict';
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, paginate } = require('../../../shared/utils/response');

// ── List alerts ──────────────────────────────────────────────────────────────
exports.listAlerts = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const { page = 1, limit = 20, level, status, project } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (level)   where.level   = level;
    if (status)  where.status  = status;
    if (project) where.project = project;

    const [alerts, total] = await Promise.all([
      adminDb.alert.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      adminDb.alert.count({ where }),
    ]);

    return paginate(res, alerts, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Acknowledge alert ────────────────────────────────────────────────────────
exports.acknowledgeAlert = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const { id }  = req.params;

    const alert = await adminDb.alert.findUnique({ where: { id } });
    if (!alert) return error(res, 'Alert not found', 404);
    if (alert.status === 'RESOLVED') return error(res, 'Alert already resolved', 400);

    const updated = await adminDb.alert.update({
      where: { id },
      data:  { status: 'ACKNOWLEDGED', resolvedBy: req.user?.id },
    });

    return success(res, updated, 'Alert acknowledged');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Resolve alert ────────────────────────────────────────────────────────────
exports.resolveAlert = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const { id }  = req.params;

    const alert = await adminDb.alert.findUnique({ where: { id } });
    if (!alert) return error(res, 'Alert not found', 404);

    const updated = await adminDb.alert.update({
      where: { id },
      data:  { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: req.user?.id },
    });

    return success(res, updated, 'Alert resolved');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin activity logs ──────────────────────────────────────────────────────
exports.listAdminLogs = async (req, res) => {
  try {
    const adminDb = getPrismaClient('admin');
    const { page = 1, limit = 20, adminId, action, module, from, to } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (adminId) where.adminId = adminId;
    if (action)  where.action  = action;
    if (module)  where.module  = module;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      adminDb.adminLog.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      adminDb.adminLog.count({ where }),
    ]);

    return paginate(res, logs, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Online users count (Redis sessionService sorted-set — accurate presence) ──
exports.getOnlineStats = async (req, res) => {
  try {
    const sessionSvc = require('../../../shared/services/sessionService');
    const projects   = ['hub', 'game', 'trade', 'dating', 'sports'];
    const stats      = { total: 0, byProject: {} };

    // Use Redis sorted-set presence (accurate within ONLINE_TTL=5min window)
    // Falls back to 0 gracefully when Redis is unavailable.
    const counts = await Promise.all(projects.map(p => sessionSvc.countOnline(p)));
    for (let i = 0; i < projects.length; i++) {
      const count = counts[i] ?? 0;
      stats.byProject[projects[i]] = count;
      stats.total += count;
    }

    // Also include Socket.IO room sizes as a secondary signal (current connections)
    const io = req.app?.get('io');
    if (io) {
      const socketCounts = {};
      for (const p of projects) {
        const room = io.sockets.adapter.rooms?.get(`project_user:${p}`);
        socketCounts[p] = room ? room.size : 0;
      }
      stats.socketConnections = socketCounts;
    }

    return success(res, stats);
  } catch (e) { return error(res, e.message, 500); }
};
