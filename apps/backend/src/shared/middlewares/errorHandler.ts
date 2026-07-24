// @ts-nocheck
const logger = require('../services/logger');

/**
 * Express error-handling middleware.
 *
 * Catches all errors forwarded by next(err) and returns a consistent JSON response.
 * Logs the error with request context to aid debugging.
 *
 * IMPORTANT: This MUST be registered AFTER all routes in app.js:
 *   app.use(errorHandler);
 *
 * @type {import('express').ErrorRequestHandler}
 */
module.exports = (err, req, res, _next) => {
  // Operational errors (thrown deliberately) vs programming errors
  const status  = err.status  || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Always log with method + URL for traceability
  if (status >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${status} — ${message}`, {
      stack:   err.stack,
      project: req.project || 'unknown',
      userId:  req.user?.id || null,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${status} — ${message}`);
  }

  const body = { success: false, message, timestamp: Date.now() };

  // In development, include the stack trace for 500s
  if (process.env.NODE_ENV !== 'production' && status >= 500 && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
};
