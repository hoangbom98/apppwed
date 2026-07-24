// @ts-nocheck
// backend/src/modules/admin/controllers/riskController.js
// Admin Dashboard — Risk Alerts, AML Alerts, Security Logs, IP Blacklist
'use strict';

const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, paginate } = require('../../../shared/utils/response');
const riskService = require('../../../shared/services/riskService');
const alertHelper = require('../../../risk/alertHelper');

// ── Helpers ───────────────────────────────────────────────────────────────────
const adminDb = () => getPrismaClient('admin');

// ══════════════════════════════════════════════════════════════════════════════
// RISK ALERTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/risk/alerts
 * ?status=new|reviewed|resolved&page=1&limit=20&level=high
 */
exports.listAlerts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, level } = req.query;
    const prisma = adminDb();

    const where = {};
    if (status) where.status = status;
    if (level) {
      // Filter by associated rule or risk score level
      where.rule = { name: { contains: level } };
    }

    const [alerts, total] = await Promise.all([
      prisma.riskAlert.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { rule: { select: { name: true, action: true } } },
      }),
      prisma.riskAlert.count({ where }),
    ]);

    return paginate(res, alerts, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/risk/alerts/:id
 */
exports.getAlert = async (req, res) => {
  try {
    const alert = await adminDb().riskAlert.findUnique({
      where:   { id: req.params.id },
      include: { rule: true },
    });
    if (!alert) return error(res, 'Alert not found', 404);
    return success(res, alert);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/risk/alerts/:id
 * Body: { status: 'reviewed'|'resolved', note: '...' }
 */
exports.updateAlert = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ['reviewed', 'resolved', 'escalated', 'dismissed'];
    if (!allowed.includes(status)) return error(res, 'Invalid status', 400);

    const alert = await adminDb().riskAlert.update({
      where: { id: req.params.id },
      data:  {
        status,
        resolvedBy: req.user?.id ? String(req.user.id) : null,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
        details:    note ? { note } : undefined,
      },
    });
    return success(res, alert, `Alert ${status}`);
  } catch (e) { return error(res, e.message, 500); }
};

// ══════════════════════════════════════════════════════════════════════════════
// AML ALERTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/risk/aml
 * ?status=new&page=1&limit=20
 */
exports.listAmlAlerts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const prisma = adminDb();
    const [alerts, total] = await Promise.all([
      prisma.amlAlert.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.amlAlert.count({ where }),
    ]);

    return paginate(res, alerts, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/risk/aml/:id
 * Body: { status: 'reviewed'|'escalated'|'cleared' }
 */
exports.updateAmlAlert = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['reviewed', 'escalated', 'cleared'];
    if (!allowed.includes(status)) return error(res, 'Invalid status', 400);

    const alert = await adminDb().amlAlert.update({
      where: { id: req.params.id },
      data:  {
        status,
        resolvedBy: req.user?.id ? String(req.user.id) : null,
        resolvedAt: status === 'cleared' ? new Date() : undefined,
      },
    });
    return success(res, alert, `AML alert ${status}`);
  } catch (e) { return error(res, e.message, 500); }
};

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY LOGS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/risk/security-logs
 * ?type=brute_force|injection|ddos|geo_risk|bot&severity=high&page=1&limit=20
 */
exports.listSecurityLogs = async (req, res) => {
  try {
    const { type, severity, page = 1, limit = 20, ip } = req.query;
    const where = {};
    if (type)     where.type = type;
    if (severity) where.severity = severity;
    if (ip)       where.ip = { contains: ip };

    const prisma = adminDb();
    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.securityLog.count({ where }),
    ]);

    return paginate(res, logs, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ══════════════════════════════════════════════════════════════════════════════
// IP BLACKLIST
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/risk/ip-blacklist
 */
exports.listIpBlacklist = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const where = {};
    if (type) where.type = type;
    // Exclude expired entries
    where.OR = [{ expiresAt: null }, { expiresAt: { gte: new Date() } }];

    const prisma = adminDb();
    const [ips, total] = await Promise.all([
      prisma.ipBlacklist.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ipBlacklist.count({ where }),
    ]);

    return paginate(res, ips, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/risk/ip-blacklist
 * Body: { ip, reason, type: 'manual', durationDays: 30 }
 */
exports.addIpBlacklist = async (req, res) => {
  try {
    const { ip, reason, type = 'manual', durationDays = 30 } = req.body;
    if (!ip || !reason) return error(res, 'ip and reason are required', 400);

    const entry = await adminDb().ipBlacklist.upsert({
      where:  { ip },
      create: {
        ip, reason, type,
        addedBy:   String(req.user?.id || 'admin'),
        expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      },
      update: {
        reason, type,
        addedBy:   String(req.user?.id || 'admin'),
        expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      },
    });

    return success(res, entry, 'IP added to blacklist', 201);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * DELETE /admin/risk/ip-blacklist/:ip
 */
exports.removeIpBlacklist = async (req, res) => {
  try {
    const ip = decodeURIComponent(req.params.ip);
    await adminDb().ipBlacklist.delete({ where: { ip } }).catch(() => {});

    // Also clear redis block
    const redis = require('../../../config/redis');
    await redis.del(`blocked:ip:${ip}`);

    return success(res, null, 'IP removed from blacklist');
  } catch (e) { return error(res, e.message, 500); }
};

// ══════════════════════════════════════════════════════════════════════════════
// USER RISK SCORE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/risk/users/:userId/score
 */
exports.getUserRiskScore = async (req, res) => {
  try {
    const prisma = adminDb();
    const score = await prisma.riskScore.findFirst({
      where:   { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, score || { score: 0, level: 'low' });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/risk/users/:userId/recalculate
 * Force re-runs the RiskScorer for a specific user.
 */
exports.recalculateUserScore = async (req, res) => {
  try {
    const result = await riskService.recalculateScore(req.params.userId);
    return success(res, result, 'Risk score recalculated');
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/risk/users/:userId/lock
 * Manual lock + alert.
 */
exports.lockUser = async (req, res) => {
  try {
    const { reason = 'manual_lock' } = req.body;
    const { userId } = req.params;

    await adminDb().user.update({
      where: { id: userId },
      data:  { status: 'banned' },
    });

    await alertHelper.sendAlert(
      `🔒 Manual lock: user \`${userId}\` by admin \`${req.user?.id}\` — reason: ${reason}`,
      'high'
    );

    return success(res, { userId, status: 'banned', reason });
  } catch (e) { return error(res, e.message, 500); }
};

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SUMMARY
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/risk/summary
 * Overall risk dashboard numbers.
 */
exports.getSummary = async (req, res) => {
  try {
    const prisma  = adminDb();
    const since1d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      newAlerts, highAlerts, amlNew, secLogsToday,
      criticalUsers, blockedIps,
    ] = await Promise.all([
      prisma.riskAlert.count({ where: { status: 'new' } }),
      prisma.riskAlert.count({ where: { status: 'new', rule: { action: 'auto_response' } } }),
      prisma.amlAlert.count({ where: { status: 'new' } }).catch(() => 0),
      prisma.securityLog.count({ where: { createdAt: { gte: since1d } } }).catch(() => 0),
      prisma.user.count({ where: { status: 'banned', updatedAt: { gte: since7d } } }),
      prisma.ipBlacklist.count({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      }).catch(() => 0),
    ]);

    return success(res, {
      newAlerts,
      highAlerts,
      amlNew,
      secLogsToday,
      criticalUsers,
      blockedIps,
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ══════════════════════════════════════════════════════════════════════════════
// SUSPICIOUS USERS (cross-project high-risk users list)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/risk/users
 * Returns users flagged with high/medium risk scores from admin DB,
 * enriched with project context from the riskScore.project field.
 * ?level=high|medium|low  &limit=50
 */
exports.getSuspiciousUsers = async (req, res) => {
  try {
    const { level, limit = 50, page = 1 } = req.query;
    const prisma = adminDb();

    const where = {};
    if (level) where.level = level;
    else where.level = { in: ['high', 'medium'] };

    const [scores, total] = await Promise.all([
      prisma.riskScore.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        select: {
          id:        true,
          userId:    true,
          project:   true,
          score:     true,
          level:     true,
          factors:   true,
          createdAt: true,
        },
      }),
      prisma.riskScore.count({ where }),
    ]);

    // Map to frontend-friendly shape
    const data = scores.map(s => ({
      id:         s.id,
      userId:     s.userId,
      username:   null,
      email:      null,
      project:    s.project ?? 'game',
      reason:     Array.isArray(s.factors) ? s.factors.join(', ') : (s.factors ?? ''),
      level:      s.level,
      score:      s.score,
      detectedAt: s.createdAt,
    }));

    return paginate(res, data, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ══════════════════════════════════════════════════════════════════════════════
// RISK RULES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/risk/rules
 */
exports.listRules = async (req, res) => {
  try {
    const rules = await adminDb().riskRule.findMany({
      orderBy: { priority: 'desc' },
    });
    return success(res, rules);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/risk/rules/:id
 * Toggle rule active/inactive or update thresholds.
 */
exports.updateRule = async (req, res) => {
  try {
    const { status, conditions, action, priority } = req.body;
    const updated = await adminDb().riskRule.update({
      where: { id: req.params.id },
      data:  {
        ...(status     && { status }),
        ...(conditions && { conditions }),
        ...(action     && { action }),
        ...(priority   && { priority: Number(priority) }),
      },
    });
    return success(res, updated);
  } catch (e) { return error(res, e.message, 500); }
};
