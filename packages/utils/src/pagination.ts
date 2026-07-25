/**
 * @lkvip/utils — pagination.ts
 * Helpers for building paginated query parameters and response metadata.
 *
 * @example
 *   // In a controller:
 *   const { page, limit, skip } = parsePaginationQuery(req.query);
 *   const total = await prisma.user.count();
 *   const data  = await prisma.user.findMany({ skip, take: limit });
 *   res.json({ ...buildPagination(page, limit, total), data });
 */

export interface PaginationQueryInput {
  page?:     unknown;
  limit?:    unknown;
  per_page?: unknown;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?:     number;
}

export interface ParsedPagination {
  page:  number;
  limit: number;
  skip:  number;
}

export interface PaginationMeta {
  page:    number;
  limit:   number;
  total:   number;
  pages:   number;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * Parse page/limit from a request query object.
 * Clamps page ≥ 1 and limit to [1, maxLimit].
 */
export function parsePaginationQuery(
  query: PaginationQueryInput = {},
  opts:  PaginationOptions    = {},
): ParsedPagination {
  const { defaultLimit = 20, maxLimit = 100 } = opts;

  let page  = parseInt(String(query.page),  10);
  let limit = parseInt(String(query.limit ?? query.per_page), 10);

  if (!Number.isFinite(page)  || page  < 1) page  = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Build pagination metadata for an API response.
 */
export function buildPagination(
  page:  number,
  limit: number,
  total: number,
): { meta: PaginationMeta } {
  const pages   = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    meta: {
      page,
      limit,
      total,
      pages,
      hasPrev: page > 1,
      hasNext: page < pages,
    },
  };
}
