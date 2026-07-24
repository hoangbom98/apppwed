import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Shared Redis connection instance for BullMQ and other Redis-dependent services
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redis.on('connect', () => {
  console.log('Redis Client Connected');
});
