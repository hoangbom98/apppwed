/**
 * Unit tests for BruteForceDetector.checkLoginAttempt() and recordSuccess()
 *
 * Redis is intercepted via jest.config.ts moduleNameMapper → __mocks__/redis.ts
 * The databases module is also mapped to __mocks__/databases.ts.
 */

import BruteForceDetector from '../bruteForceDetector';

// Pull redis mock AFTER jest replaces the module via moduleNameMapper
// eslint-disable-next-line @typescript-eslint/no-var-requires
const redisMod = require('../config/redis') as {
  get:   jest.Mock;
  set:   jest.Mock;
  setEx: jest.Mock;
  del:   jest.Mock;
  incr:  jest.Mock;
  redis: { get: jest.Mock; set: jest.Mock; setEx: jest.Mock; del: jest.Mock; incr: jest.Mock };
};
// Source imports `{ redis }` named export from the mock module
const redisMock = redisMod.redis ?? redisMod;

beforeEach(() => jest.clearAllMocks());

describe('BruteForceDetector.checkLoginAttempt()', () => {
  const detector = new BruteForceDetector();

  it('allows login when IP is clean and no attempts', async () => {
    redisMock.get.mockResolvedValue(null); // not blocked, no counter
    redisMock.incr.mockResolvedValue(0);
    const result = await detector.checkLoginAttempt('1.2.3.4', 'user@test.com');
    expect(result.blocked).toBe(false);
    expect(result.severity).toBe('low');
  });

  it('blocks IP when the blocked:ip key is set', async () => {
    redisMock.get.mockResolvedValueOnce('1'); // blocked:ip → set
    const result = await detector.checkLoginAttempt('1.2.3.4');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('ip_blocked');
    expect(result.severity).toBe('high');
  });

  it('blocks account when blocked:acc key is set', async () => {
    redisMock.get
      .mockResolvedValueOnce(null)   // blocked:ip → clean
      .mockResolvedValueOnce('1');   // blocked:acc → locked
    const result = await detector.checkLoginAttempt('1.2.3.4', 'locked@test.com');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('account_locked');
  });

  it('blocks IP with high severity after >= BLOCK_THRESHOLD (5) attempts', async () => {
    redisMock.get
      .mockResolvedValueOnce(null)   // blocked:ip
      .mockResolvedValueOnce(null)   // blocked:acc
      .mockResolvedValueOnce('6');   // brute:ip count
    redisMock.setEx.mockResolvedValue('OK');
    const result = await detector.checkLoginAttempt('1.2.3.4', 'user@test.com');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('brute_force');
    expect(result.severity).toBe('high');
  });

  it('blocks IP with critical severity after >= CRITICAL_THRESHOLD (20) attempts', async () => {
    redisMock.get
      .mockResolvedValueOnce(null)    // blocked:ip
      .mockResolvedValueOnce(null)    // blocked:acc
      .mockResolvedValueOnce('22');   // brute:ip count
    redisMock.setEx.mockResolvedValue('OK');
    const result = await detector.checkLoginAttempt('1.2.3.4', 'user@test.com');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('critical_brute_force');
    expect(result.severity).toBe('critical');
  });

  it('returns safe result when redis throws (fail-open)', async () => {
    redisMock.get.mockRejectedValue(new Error('redis down'));
    const result = await detector.checkLoginAttempt('1.2.3.4');
    expect(result.blocked).toBe(false);
    expect(result.severity).toBe('low');
  });
});

describe('BruteForceDetector.recordSuccess()', () => {
  it('deletes brute counters on successful login', async () => {
    const detector = new BruteForceDetector();
    await detector.recordSuccess('1.2.3.4', 'user@test.com');
    expect(redisMock.del).toHaveBeenCalledWith('brute:ip:1.2.3.4', 'brute:acc:user@test.com');
  });
});
