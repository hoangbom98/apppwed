'use strict';
/**
 * catchAsync — Async controller wrapper.
 *
 * Bọc mọi async route handler để bắt lỗi và forward qua next(err),
 * đảm bảo tất cả exception đều đến error handler middleware mà không
 * cần try/catch thủ công trong từng controller.
 *
 * Usage:
 *   import catchAsync from '../utils/catchAsync';
 *
 *   export const getUser = catchAsync(async (req, res) => {
 *     const user = await userService.findById(req.params.id);
 *     res.json({ success: true, data: user });
 *   });
 *
 * Ported from: crypto-exchange-main/backend/src/utils/catchAsync.ts
 * Enhanced: generic typing cho Request params/body/query.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string>,
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response,
  next: NextFunction,
) => Promise<void | unknown>;

/**
 * Wrap an async express handler — any thrown error is forwarded to next(err).
 *
 * @param fn  Async route handler (req, res, next) => Promise<void>
 * @returns   Standard Express RequestHandler
 */
function catchAsync<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string>,
>(fn: AsyncHandler<P, ResBody, ReqBody, ReqQuery>): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default catchAsync;
module.exports = catchAsync;
module.exports.default = catchAsync;
