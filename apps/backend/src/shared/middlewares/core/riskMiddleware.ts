'use strict';
/**
 * riskMiddleware — Express middleware stack for the Risk Detection Engine.
 *
 * Provides three middleware factories:
 *
 *   riskMiddleware.ddosGuard()     — DDoS / rate-flood protection (per-IP)
 *   riskMiddleware.injectionGuard() — SQL / XSS / path-traversal scan on body+query
 *   riskMiddleware.botGuard()       — Bot detection via X-Session-Meta header
 *   riskMiddleware.geoGuard()       — Block high-risk geo / IP-blacklist check
 *   riskMiddleware.ipBlockGuard()   — Check redis blocked:ip flag before processing
 *
 * Usage in routes:
 *   const risk = require('../shared/middlewares/riskMiddleware');
 *   router.use(risk.ddosGuard());
 *   router.use(risk.injectionGuard());
 *   router.post('/login', risk.ipBlockGuard(), authCtrl.login);
 */
const riskService = require('../../services/riskService');
const logger      = require('../../services/logger');
const redis       = require('../../../config/redis');

// ── Helpers ───────────────────────────────────────────────────────────────────
function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.ip ||
    '0.0.0.0'
  );
}

// ── DDoS Guard ────────────────────────────────────────────────────────────────
/**
 * DDoS protection — counts requests per IP per minute.
 * Blocks automatically if threshold exceeded.
 */
function ddosGuard() {
  return async (req, res, next) => {
    const ip = getIp(req);
    try {
      const result = await riskService.checkDdos(ip);
      if (result.blocked) {
        logger.security('ddos_request_blocked', { ip, path: req.path, reason: result.reason });
        return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
      }
    } catch { /* non-fatal — let through */ }
    next();
  };
}

// ── IP Block Guard ────────────────────────────────────────────────────────────
/**
 * Checks if IP is in the redis blocked set (from brute-force / DDoS / manual block).
 */
function ipBlockGuard() {
  return async (req, res, next) => {
    const ip = getIp(req);
    try {
      const blocked = await redis.get(`blocked:ip:${ip}`);
      if (blocked) {
        logger.security('blocked_ip_request', { ip, path: req.path });
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    } catch { /* non-fatal */ }
    next();
  };
}

// ── Injection Guard ───────────────────────────────────────────────────────────
/**
 * Scans request body + query string for injection patterns.
 * Blocks + logs + alerts on detection.
 */
function injectionGuard() {
  return async (req, res, next) => {
    const ip = getIp(req);
    try {
      // Scan body
      const bodyResult = riskService.scanInput(req.body || {});
      if (bodyResult.detected) {
        await riskService.handleAttack(req.user?.id || null, ip, {
          source: 'body', ...bodyResult, path: req.path,
        });
        return res.status(400).json({ success: false, message: 'Invalid request.' });
      }

      // Scan query
      const queryResult = riskService.scanInput(req.query || {});
      if (queryResult.detected) {
        await riskService.handleAttack(req.user?.id || null, ip, {
          source: 'query', ...queryResult, path: req.path,
        });
        return res.status(400).json({ success: false, message: 'Invalid request.' });
      }
    } catch { /* non-fatal */ }
    next();
  };
}

// ── Bot Guard ─────────────────────────────────────────────────────────────────
/**
 * Reads X-Session-Meta header (JSON) and applies bot-detection rules.
 * Frontend should send session interaction metadata with each API call.
 */
function botGuard() {
  return async (req, res, next) => {
    const ip = getIp(req);
    try {
      const metaHeader = req.headers['x-session-meta'];
      if (metaHeader) {
        const session = JSON.parse(metaHeader);
        const result  = riskService.detectBot(session);
        if (result.isBot && result.confidence > 0.8) {
          logger.security('bot_detected', { ip, path: req.path, reason: result.reason, userId: req.user?.id });
          if (req.user?.id) {
            riskService.handleBot(req.prisma, req.user.id, ip, session);
          }
          // Soft block: require captcha header instead of 403
          res.setHeader('X-Require-Captcha', '1');
        }
      }
    } catch { /* malformed header — skip */ }
    next();
  };
}

// ── Geo Guard ─────────────────────────────────────────────────────────────────
/**
 * Checks geolocation risk for the incoming IP.
 * Critical geo risks block the request; high risks are logged.
 */
function geoGuard() {
  return async (req, res, next) => {
    const ip     = getIp(req);
    const userId = req.user?.id || null;
    try {
      const result = await riskService.checkLocation(ip, userId);
      if (result.risk === 'critical') {
        logger.security('geo_critical_blocked', { ip, userId, reason: result.reason });
        return res.status(403).json({ success: false, message: 'Access denied from your location.' });
      }
      if (result.risk === 'high') {
        logger.security('geo_high_risk', { ip, userId, reason: result.reason });
      }
    } catch { /* non-fatal */ }
    next();
  };
}

module.exports = {
  ddosGuard,
  ipBlockGuard,
  injectionGuard,
  botGuard,
  geoGuard,
};
