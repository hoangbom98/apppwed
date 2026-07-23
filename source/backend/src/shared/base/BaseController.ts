/**
 * BaseController - Standardizes API responses and provides base error handling.
 *
 * NOTE: response.ts uses CommonJS module.exports (not ES named exports).
 * We use require() to avoid TypeScript named-import errors.
 */
import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const responseHelper = require('../utils/response');

export abstract class BaseController {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected sendSuccess(res: Response, data: unknown, message?: string) {
    return responseHelper.ok(res, data, message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected sendCreated(res: Response, data: unknown, message?: string) {
    return responseHelper.created(res, data, message);
  }

  protected sendError(res: Response, message: string, statusCode = 500) {
    return responseHelper.error(res, message, statusCode);
  }

  protected sendNotFound(res: Response, message = 'Resource not found') {
    return responseHelper.notFound(res, message);
  }

  protected sendBadRequest(res: Response, message: string) {
    return responseHelper.badRequest(res, message);
  }

  protected sendForbidden(res: Response, message: string) {
    return responseHelper.forbidden(res, message);
  }

  protected sendPaginated(res: Response, data: unknown[], meta: { total: number; page: number; limit: number }) {
    return responseHelper.paginate(res, data, meta);
  }

  // Wraps async controller methods with try/catch to ensure errors are caught
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req, res, next);
      } catch (err) {
        next(err);
      }
    };
  }
}
