/**
 * Unit tests for DdosDetector.check()
 *
 * Redis intercepted via jest.config.ts moduleNameMapper → __mocks__/redis.ts
 * Databases mock silences the security log write.
 */

import DdosDetector from '../ddosDetector';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const redisMod = require('../config/redis') as {
  get:   jest.Mock;
  incr:  jest.Mock;
  setEx: jest.Mock;
  redis: { get: jest.Mock; incr: jest.Mock; setEx: jest.Mock };
};
const redisMock = redisMod.redis ?? redisMod;

beforeEach(() => jest.clearAllMocks());

describe('DdosDetector.check()', () => {
  const detector = new DdosDetector();

  it('allows request when IP is clean and count is under threshold', async () => {
    redisMock.get.mockResolvedValue(null);   // not blocked
    redisMock.incr.mockResolvedValue(1);     // first request in window
    redisMock.setEx.mockResolvedValue('OK');
    const result = await detector.check('10.0.0.1');
    expect(result.blocked).toBe(false);
    expect(result.reason).toBeNull();
  });

  it('blocks immediately when blocked:ip key is already set', async () => {
    redisMock.get.mockResolvedValue('1'); // pre-blocked
    const result = await detector.check('10.0.0.1');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('ddos_blocked');
    // incr must NOT be called — we exit early
    expect(redisMock.incr).not.toHaveBeenCalled();
  });

  it('blocks with "ddos" reason when count exceeds THRESHOLD (500)', async () => {
    redisMock.get.mockResolvedValue(null);
    redisMock.incr.mockResolvedValue(501);
    redisMock.setEx.mockResolvedValue('OK');
    const result = await detector.check('10.0.0.2');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('ddos');
  });

  it('blocks with "ddos_critical" reason when count exceeds CRITICAL_THRESHOLD (1000)', async () => {
    redisMock.get.mockResolvedValue(null);
    redisMock.incr.mockResolvedValue(1001);
    redisMock.setEx.mockResolvedValue('OK');
    const result = await detector.check('10.0.0.3');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('ddos_critical');
  });

  it('returns safe result when redis throws (fail-open)', async () => {
    redisMock.get.mockRejectedValue(new Error('redis timeout'));
    const result = await detector.check('10.0.0.4');
    expect(result.blocked).toBe(false);
  });
});
