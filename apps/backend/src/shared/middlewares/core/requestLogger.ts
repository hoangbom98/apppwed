'use strict';
/**
 * requestLogger.ts — Per-request structured logging middleware.
 *
 * Logs method, path, status, duration, IP and user agent for every request.
 * Uses the winston logger (via services/logger) so output goes to both
 * console (dev) and rotating log files (production).
 *
 * Usage:
 *   // In server.ts — add before route handlers
 *   app.use(require('./src/shared/middlewares/requestLogger'));
 *
 * Note: Morgan already handles HTTP access logging; this middleware adds
 * structured JSON metadata (userId, project, duration) useful for analytics.
 * Use one or the other — or both with different transports.
 */

const logger = require('../../services/logger');

module.exports = (req, res, next) => {
  const startMs = Date.now();

  res.on('finish', () => {
    const duration  = Date.now() - startMs;
    const status    = res.statusCode;
    const logLevel  = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'http';

    logger[logLevel](`${req.method} ${req.originalUrl || req.path} ${status}`, {
      method:    req.method,
      path:      req.originalUrl || req.path,
      status,
      duration:  `${duration}ms`,
      ip:        req.ip || req.socket?.remoteAddress,
      userAgent: req.get('user-agent') || null,
      userId:    req.user?.id   || null,
      project:   req.project   || null,
    });
  });

  next();
};
