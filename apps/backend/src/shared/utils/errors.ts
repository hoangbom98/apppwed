'use strict';
/**
 * shared/utils/errors.ts — Custom operational error classes.
 *
 * Use these instead of throwing raw Error objects so that the error handler
 * middleware can distinguish operational errors (4xx) from programming bugs (5xx)
 * and respond with the correct HTTP status code and message.
 *
 * Usage:
 *   const { AppError, NotFoundError, ValidationError } = require('./errors');
 *   throw new NotFoundError('User');
 *   // → 404 { success: false, message: 'User not found' }
 *
 * NOTE: CommonJS exports — "type": "commonjs" in package.json.
 */

/**
 * Base operational error.
 * All custom errors extend this class.
 */
class AppError extends Error {
  /** HTTP status code — forwarded to res.status() by the error handler. */
  public readonly statusCode: number;
  /**
   * Operational = thrown deliberately (bad input, missing resource, etc.).
   * Non-operational = unexpected programming bug → always 500.
   */
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name        = this.constructor.name;
    this.statusCode  = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── 400 Bad Request ───────────────────────────────────────────────────────────

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/** 422 — Joi/Zod schema validation failure, carries optional field errors */
class ValidationError extends AppError {
  public readonly errors?: Array<{ field: string; message: string }>;
  constructor(
    message = 'Validation failed',
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(message, 422);
    this.errors = errors;
  }
}

// ── 401 Unauthorized ─────────────────────────────────────────────────────────

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

// ── 403 Forbidden ─────────────────────────────────────────────────────────────

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

// ── 404 Not Found ─────────────────────────────────────────────────────────────

class NotFoundError extends AppError {
  /**
   * @param resource  Human-readable resource name, e.g. 'User', 'Transaction'
   */
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

// ── 409 Conflict ──────────────────────────────────────────────────────────────

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

// ── 429 Too Many Requests ─────────────────────────────────────────────────────

class RateLimitError extends AppError {
  constructor(message = 'Too many requests — please slow down') {
    super(message, 429);
  }
}

// ── 503 Service Unavailable ───────────────────────────────────────────────────

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
};
