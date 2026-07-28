'use strict';
/**
 * shared/utils/response.ts — Standard HTTP response helpers.
 *
 * ALWAYS use these instead of raw res.status().json() so that every
 * endpoint returns the same envelope shape:
 *
 *   { success, message, data, timestamp }        — success responses
 *   { success, message, timestamp }              — error responses
 *   { success, data, meta: { page, limit, total, pages } } — paginated
 *
 * NOTE: CommonJS exports (module.exports) — package.json "type": "commonjs".
 */

const _json = (res, status, body) =>
  res.status(status).json({ ...body, timestamp: Date.now() });

// ── 2xx ───────────────────────────────────────────────────────────────────────

const success = (res, data = null, message = 'Success', status = 200) =>
  _json(res, status, { success: true, message, data });

/** Alias — used by most controllers */
const ok = (res, data = null, message = 'Success') =>
  success(res, data, message, 200);

const created = (res, data = null, message = 'Created') =>
  _json(res, 201, { success: true, message, data });

const noContent = (res) => res.status(204).send();

// ── 4xx ───────────────────────────────────────────────────────────────────────

const error = (res, message = 'Error', status = 400) =>
  _json(res, status, { success: false, message });

const badRequest = (res, message = 'Bad request') =>
  error(res, message, 400);

const unauthorized = (res, message = 'Unauthorized') =>
  error(res, message, 401);

const forbidden = (res, message = 'Forbidden') =>
  error(res, message, 403);

const notFound = (res, message = 'Not found') =>
  error(res, message, 404);

const conflict = (res, message = 'Conflict') =>
  error(res, message, 409);

/**
 * Validation error — 422 with field-level errors array.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {Array<{field: string, message: string}>} errors
 */
const validationError = (res, message = 'Validation failed', errors = []) =>
  _json(res, 422, { success: false, message, errors });

// ── 5xx ───────────────────────────────────────────────────────────────────────

const serverError = (res, message = 'Internal server error') =>
  error(res, message, 500);

// ── Paginated ─────────────────────────────────────────────────────────────────

/**
 * Paginated list response.
 *
 * @example
 *   const total = await prisma.user.count();
 *   const items = await prisma.user.findMany({ skip, take });
 *   paginate(res, items, { total, page: 1, limit: 20 });
 *
 * @param {import('express').Response} res
 * @param {Array} data
 * @param {{ total: number, page: number, limit: number, pages?: number }} meta
 */
const paginate = (res, data, meta) => {
  const pages = meta.pages ?? Math.ceil((meta.total || 0) / (meta.limit || 20));
  return res.json({
    success: true,
    data,
    meta:    { ...meta, pages },
    timestamp: Date.now(),
  });
};

module.exports = {
  success,
  ok,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
  paginate,
};
