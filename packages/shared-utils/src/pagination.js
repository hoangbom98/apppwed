'use strict';
/**
 * @lkvip/utils — pagination.js
 * Helpers for building paginated query parameters and response metadata.
 *
 * @example
 *   const { buildPagination, parsePaginationQuery } = require('@lkvip/utils');
 *
 *   // In a controller:
 *   const { page, limit, skip } = parsePaginationQuery(req.query);
 *   const total = await prisma.user.count();
 *   const data  = await prisma.user.findMany({ skip, take: limit });
 *   res.json({ ...buildPagination(page, limit, total), data });
 */

/**
 * Parse page/limit from a request query object.
 * Clamps page ≥ 1 and limit to [1, maxLimit].
 *
 * @param {Record<string, unknown>} query  — e.g. req.query
 * @param {object}  [opts]
 * @param {number}  [opts.defaultLimit=20]
 * @param {number}  [opts.maxLimit=100]
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePaginationQuery(query = {}, opts = {}) {
  const { defaultLimit = 20, maxLimit = 100 } = opts;

  let page  = parseInt(query.page, 10);
  let limit = parseInt(query.limit || query.per_page, 10);

  if (!Number.isFinite(page)  || page  < 1) page  = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Build pagination metadata for an API response.
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} total  — total record count (from COUNT query)
 * @returns {{ meta: { page, limit, total, pages, hasPrev, hasNext } }}
 */
function buildPagination(page, limit, total) {
  const pages   = limit > 0 ? Math.ceil(total / limit) : 0;
  const hasPrev = page > 1;
  const hasNext = page < pages;

  return {
    meta: {
      page,
      limit,
      total,
      pages,
      hasPrev,
      hasNext,
    },
  };
}

module.exports = { parsePaginationQuery, buildPagination };
