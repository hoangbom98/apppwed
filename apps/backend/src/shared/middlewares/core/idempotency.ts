// src/shared/middlewares/idempotency.ts
// Idempotency middleware — Redis-backed, dùng shared singleton (không tạo new Redis()).
// Ngăn duplicate requests: nếu cùng X-Idempotency-Key đã xử lý thành công,
// trả lại cached response thay vì chạy lại logic business.
//
// Usage:
//   router.post('/payment', idempotency(3600), paymentController.create);
//   // Header: X-Idempotency-Key: <uuid>
import { Request, Response, NextFunction } from 'express';

// Dùng shared Redis singleton từ config/redis — KHÔNG tạo new Redis() riêng
// để tránh làm tốn connection pool.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const redis = require('../../../config/redis');

export const idempotency = (ttl = 86400) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['x-idempotency-key'] as string | undefined;

    // Idempotency key không bắt buộc — chỉ áp dụng khi có header
    if (!key) return next();

    const cacheKey = `idempotent:${req.method}:${req.path}:${key}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        // Đã xử lý trước đó — trả lại response đã cache
        const body = JSON.parse(cached);
        return res
          .status(body.__status || 200)
          .set('X-Idempotency-Replayed', 'true')
          .json(body.__data);
      }

      // Chưa cache — intercept res.json để lưu kết quả
      const originalJson = res.json.bind(res);
      res.json = function (body: unknown) {
        // Chỉ cache response thành công (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setEx(cacheKey, ttl, JSON.stringify({
            __status: res.statusCode,
            __data:   body,
          })).catch(() => { /* ignore cache write errors */ });
        }
        return originalJson(body);
      };

      next();
    } catch {
      // Redis lỗi → bỏ qua idempotency check, cho request đi tiếp
      next();
    }
  };
};
