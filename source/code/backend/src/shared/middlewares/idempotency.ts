// src/shared/middlewares/idempotency.ts
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const idempotency = (ttl: number = 86400) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['x-idempotency-key'] as string;
    if (!key) {
      return res.status(400).json({ error: 'x-idempotency-key header required' });
    }

    const cacheKey = `idempotent:${req.path}:${key}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Capture original json to cache response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      redis.setex(cacheKey, ttl, JSON.stringify(body));
      return originalJson(body);
    };

    next();
  };
};
