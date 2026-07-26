// @ts-nocheck
// backend/src/modules/admin/controllers/monitorController.ts
// Realtime Monitor — Alerts, Admin Activity Logs, Chat, System Health
//   GET   /api/admin/monitor/alerts               — list alerts
//   PATCH /api/admin/monitor/alerts/:id/ack       — acknowledge alert
//   PATCH /api/admin/monitor/alerts/:id/resolve   — resolve alert
//   GET   /api/admin/monitor/logs                 — admin activity logs
//   GET   /api/admin/monitor/online               — online user count per project
//   GET   /api/admin/health/services              — HTTP health of every subdomain + Redis + DB
//   GET   /api/admin/health/dns                   — DNS resolution check for all subdomains
//   GET   /api/admin/health/pm2                   — PM2 process list
//   GET   /api/admin/health/all                   — combined report
'use strict';
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, paginate } = require('../../../shared/utils/response');
const http  = require('http');
const https = require('https');
const dns   = require('dns/promises');
const { execSync } = require('child_process');

const DOMAIN = 'tc-gaming.live';
const VPS_IP = '104.248.146.203';

// ── Internal HTTP probe ───────────────────────────────────────────────────────

function probe(url, timeoutMs = 6000) {
  const lib   = url.startsWith('https') ? https : http;
  const start = Date.now();
  return new Promise(resolve => {
    const req = lib.get(
      url,
      { headers: { Accept: 'application/json' }, rejectUnauthorized: false },
      (res) => {
        let body = '';
        res.on('data', c => { body += c.toString(); });
        res.on('end', () => resolve({
          status:  res.statusCode ?? 0,
          body,
          ms:      Date.now() - start,
          ssl:     res.socket?.authorized ?? false,
        }));
      },
    );
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ status: 0, body: '', ms: timeoutMs, error: 'TIMEOUT' }); });
    req.on('error', e => resolve({ status: 0, body: '', ms: Date.now() - start, error: e.code ?? e.message }));
  });
}

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

// ── Health: services ─────────────────────────────────────────────────────────
exports.healthServices = async (req, res) => {
  const ENDPOINTS = [
    { name: 'API',    url: `http://localhost:4000/health`,            type: 'backend'  },
    { name: 'Hub',    url: `https://hub.${DOMAIN}`,                  type: 'frontend' },
    { name: 'Game',   url: `https://game.${DOMAIN}`,                 type: 'frontend' },
    { name: 'Trade',  url: `https://trade.${DOMAIN}`,                type: 'frontend' },
    { name: 'Sports', url: `https://sports.${DOMAIN}`,               type: 'frontend' },
    { name: 'Dating', url: `https://dating.${DOMAIN}`,               type: 'frontend' },
    { name: 'Admin',  url: `https://admin.${DOMAIN}`,                type: 'frontend' },
  ];

  const results = await Promise.all(
    ENDPOINTS.map(async svc => {
      const r = await probe(svc.url);
      let status = r.error || r.status === 0 ? 'offline' : r.status < 400 ? 'online' : 'warning';
      if (svc.type === 'backend' && !r.error && r.status < 400) {
        try {
          const j = JSON.parse(r.body);
          if (j.status === 'degraded') status = 'degraded';
          else if (j.status === 'ok' || j.status === 'healthy') status = 'online';
        } catch { /* not JSON */ }
      }
      return { name: svc.name, url: svc.url, type: svc.type, status, responseTime: r.ms, details: r.error ?? `HTTP ${r.status}` };
    }),
  );

  // Redis
  try {
    const svc = require('../../../shared/services/sessionService');
    await svc.client?.ping?.();
    results.push({ name: 'Redis', url: 'redis://localhost:6379', type: 'infra', status: 'online', responseTime: 0, details: 'PONG' });
  } catch {
    results.push({ name: 'Redis', url: 'redis://localhost:6379', type: 'infra', status: 'offline', responseTime: 0, details: 'Failed' });
  }

  // Database
  try {
    const adminDb = getPrismaClient('admin');
    await adminDb.$queryRaw`SELECT 1`;
    results.push({ name: 'Database', url: 'MySQL', type: 'infra', status: 'online', responseTime: 0, details: 'Connected' });
  } catch {
    results.push({ name: 'Database', url: 'MySQL', type: 'infra', status: 'offline', responseTime: 0, details: 'Failed' });
  }

  return success(res, results);
};

// ── Health: DNS ───────────────────────────────────────────────────────────────
exports.healthDns = async (req, res) => {
  const SUBDOMAINS = ['', 'admin', 'api', 'dating', 'game', 'hub', 'sports', 'trade'];

  const results = await Promise.all(
    SUBDOMAINS.map(async sub => {
      const hostname = sub ? `${sub}.${DOMAIN}` : DOMAIN;
      try {
        const addrs   = await dns.resolve4(hostname);
        const resolved = addrs.includes(VPS_IP);
        return { hostname, ip: addrs.join(', '), expected: VPS_IP, resolved };
      } catch (e) {
        return { hostname, ip: 'NOT FOUND', expected: VPS_IP, resolved: false, error: e.code ?? e.message };
      }
    }),
  );

  return success(res, results);
};

// ── Health: PM2 ───────────────────────────────────────────────────────────────
exports.healthPm2 = (req, res) => {
  try {
    const raw  = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8', timeout: 8000 });
    const list = JSON.parse(raw);
    const data = list.map(p => ({
      name:   p.name,
      status: p.pm2_env?.status ?? 'unknown',
      cpu:    p.monit?.cpu ?? 0,
      memory: Math.round((p.monit?.memory ?? 0) / 1024 / 1024),
      uptime: p.pm2_env?.pm_uptime ?? 0,
      pid:    p.pid ?? null,
    }));
    return success(res, data);
  } catch {
    return success(res, []);
  }
};

// ── Health: all combined ──────────────────────────────────────────────────────
exports.healthAll = async (req, res) => {
  const [services, dnsRecords] = await Promise.all([
    exports.healthServices({ app: req.app }, { json: () => {} }),
    exports.healthDns({}, { json: () => {} }),
  ]);

  // Re-run properly by calling each helper and collecting data directly
  const ENDPOINTS = [
    { name: 'API',    url: `http://localhost:4000/health`,  type: 'backend'  },
    { name: 'Hub',    url: `https://hub.${DOMAIN}`,        type: 'frontend' },
    { name: 'Game',   url: `https://game.${DOMAIN}`,       type: 'frontend' },
    { name: 'Trade',  url: `https://trade.${DOMAIN}`,      type: 'frontend' },
    { name: 'Sports', url: `https://sports.${DOMAIN}`,     type: 'frontend' },
    { name: 'Dating', url: `https://dating.${DOMAIN}`,     type: 'frontend' },
    { name: 'Admin',  url: `https://admin.${DOMAIN}`,      type: 'frontend' },
  ];
  const SUBDOMAINS = ['', 'admin', 'api', 'dating', 'game', 'hub', 'sports', 'trade'];

  const [svcProbes, dnsProbes] = await Promise.all([
    Promise.all(ENDPOINTS.map(async svc => {
      const r = await probe(svc.url);
      let status = r.error || r.status === 0 ? 'offline' : r.status < 400 ? 'online' : 'warning';
      return { name: svc.name, url: svc.url, type: svc.type, status, responseTime: r.ms, details: r.error ?? `HTTP ${r.status}` };
    })),
    Promise.all(SUBDOMAINS.map(async sub => {
      const hostname = sub ? `${sub}.${DOMAIN}` : DOMAIN;
      try {
        const addrs = await dns.resolve4(hostname);
        return { hostname, ip: addrs.join(', '), expected: VPS_IP, resolved: addrs.includes(VPS_IP) };
      } catch (e) {
        return { hostname, ip: 'NOT FOUND', expected: VPS_IP, resolved: false, error: e.code ?? e.message };
      }
    })),
  ]);

  let pm2Data = [];
  try {
    const raw  = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8', timeout: 8000 });
    pm2Data    = JSON.parse(raw).map(p => ({
      name: p.name, status: p.pm2_env?.status ?? 'unknown',
      cpu: p.monit?.cpu ?? 0, memory: Math.round((p.monit?.memory ?? 0) / 1024 / 1024),
    }));
  } catch { /* pm2 not available */ }

  return success(res, {
    timestamp: new Date().toISOString(),
    services:  svcProbes,
    dns:       dnsProbes,
    pm2:       pm2Data,
  });
};
