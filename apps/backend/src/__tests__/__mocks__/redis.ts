/**
 * Mock for apps/backend/src/config/redis.ts
 * Used in unit tests to avoid real Redis connections.
 */
const redisMock = {
  get:    jest.fn().mockResolvedValue(null),
  set:    jest.fn().mockResolvedValue('OK'),
  setEx:  jest.fn().mockResolvedValue('OK'),
  del:    jest.fn().mockResolvedValue(1),
  incr:   jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  ttl:    jest.fn().mockResolvedValue(-1),
  ping:   jest.fn().mockResolvedValue('PONG'),
};

module.exports = redisMock;
// Named export for ESM/TS consumers: `import { redis } from '../config/redis'`
module.exports.redis = redisMock;
