'use strict';
const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

// ── Ensure log directory exists ───────────────────────────────────────────
const LOG_DIR = path.join(__dirname, '../../../../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Custom dev format ─────────────────────────────────────────────────────
const devFormat = printf(({ level, message, timestamp: ts, stack }) =>
  `${ts} [${level}]: ${stack || message}`
);

// ── Create logger ─────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    // Console (dev only)
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: combine(colorize(), devFormat),
      }),
    ] : []),
    // Combined log
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'app.log'),
      format: json(),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 10,
      tailable: true,
    }),
    // Error-only log
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: json(),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
    // Audit log (important business actions)
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'audit.log'),
      level: 'info',
      format: json(),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 30,
      tailable: true,
    }),
  ],
  // Never crash on uncaught errors in logger itself
  exitOnError: false,
});

// ── Morgan stream integration ──────────────────────────────────────────────
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// ── Convenience helpers ────────────────────────────────────────────────────
logger.audit = (action, meta = {}) => {
  logger.info('[AUDIT]', { action, ...meta });
};

logger.security = (event, meta = {}) => {
  logger.warn('[SECURITY]', { event, ...meta });
};

logger.transaction = (type, meta = {}) => {
  logger.info('[TXN]', { type, ...meta });
};

// ── Unhandled rejection / exception handlers ──────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = logger;
