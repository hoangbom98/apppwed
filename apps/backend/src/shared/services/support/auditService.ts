// @ts-nocheck
'use strict';
/**
 * Audit Service — records important business actions into the admin DB.
 * All security-relevant events (login, transactions, admin ops) must call log().
 */
const { getPrismaClient } = require('../../../config/databases');
const logger              = require('../logger');

/**
 * @param {object} opts
 * @param {string} opts.action       – e.g. 'user.login', 'wallet.deposit', 'admin.ban_user'
 * @param {number|null} opts.userId  – actor user ID
 * @param {string} opts.project      – 'hub' | 'game' | 'dating' | …
 * @param {string|null} opts.ip      – client IP
 * @param {string|null} opts.ua      – user-agent
 * @param {object} opts.meta         – extra context (safe — no passwords/tokens)
 * @param {'info'|'warn'|'critical'} opts.level
 */
async function log({ action, userId = null, project = 'system', ip = null, ua = null, meta = {}, level = 'info' }) {
  // Always write to logger immediately (non-blocking)
  logger.audit(action, { userId, project, ip, level, meta });

  // Best-effort write to admin DB
  try {
    const prisma = getPrismaClient('admin');
    await prisma.auditLog.create({
      data: {
        action,
        user_id:    userId  ? String(userId)  : null,
        project,
        ip_address: ip,
        user_agent: ua,
        level,
        meta:       JSON.stringify(meta),
      },
    });
  } catch (err) {
    // Never let audit failure break the main flow
    logger.error('auditService.log DB write failed', { action, err: err.message });
  }
}

/** Build an Express middleware that auto-logs requests for sensitive routes */
function auditMiddleware(action, metaFn = () => ({})) {
  return (req, _res, next) => {
    log({
      action,
      userId:  req.user?.id,
      project: req.project,
      ip:      req.ip,
      ua:      req.get('user-agent'),
      meta:    metaFn(req),
    }).catch(() => {});
    next();
  };
}

/** Log a transaction event (finance-critical) */
async function logTransaction({ project, userId, type, amount, currency = 'VND', status, orderId = null, meta = {} }) {
  return log({
    action:  `txn.${type}`,
    userId,
    project,
    level:   'info',
    meta:    { amount, currency, status, orderId, ...meta },
  });
}

/** Log a security event (login failure, brute-force, etc.) */
async function logSecurity({ project, userId, event, ip, ua, meta = {} }) {
  return log({
    action:  `security.${event}`,
    userId,
    project,
    ip,
    ua,
    level:   'warn',
    meta,
  });
}

/** Query audit logs with pagination */
async function query({ project, userId, action, level, page = 1, limit = 50 }) {
  const prisma = getPrismaClient('admin');
  const where  = {
    ...(project && { project }),
    ...(userId  && { user_id: String(userId) }),
    ...(action  && { action: { contains: action } }),
    ...(level   && { level }),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page-1)*limit, take: limit }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, limit };
}

module.exports = { log, auditMiddleware, logTransaction, logSecurity, query };
