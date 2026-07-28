/**
 * Unit tests for FraudDetector.checkMultiAccount()
 *
 * The class resolves its own adminPrisma via require('../config/databases'),
 * which is intercepted by jest.config.ts moduleNameMapper → __mocks__/databases.ts.
 * We override getPrismaClient's return value per test to control query results.
 */

import FraudDetector from '../fraudDetector';
import type { AnyPrismaClient } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbsMock = require('../config/databases') as { getPrismaClient: jest.Mock };

function makeAdminPrisma(overrides: {
  userDevice?: Partial<{ findMany: jest.Mock }>;
  user?:       Partial<{ count: jest.Mock; update: jest.Mock }>;
  riskAlert?:  Partial<{ create: jest.Mock }>;
  riskRule?:   Partial<{ findFirst: jest.Mock; create: jest.Mock }>;
} = {}): Partial<AnyPrismaClient> {
  return {
    userDevice: {
      findMany: jest.fn().mockResolvedValue([]),
      ...(overrides.userDevice ?? {}),
    } as any,
    user: {
      count:  jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({}),
      ...(overrides.user ?? {}),
    } as any,
    riskAlert: {
      create: jest.fn().mockResolvedValue({}),
      ...(overrides.riskAlert ?? {}),
    } as any,
    riskRule: {
      findFirst: jest.fn().mockResolvedValue({ id: 'rule-1', name: 'multi_account' }),
      create:    jest.fn().mockResolvedValue({ id: 'rule-1', name: 'multi_account' }),
      ...(overrides.riskRule ?? {}),
    } as any,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('FraudDetector.checkMultiAccount()', () => {
  const baseAdminPrisma = {};   // FraudDetector ignores the constructor prisma

  it('returns low risk for a clean user (no IP, no fingerprint, no burst)', async () => {
    dbsMock.getPrismaClient.mockReturnValue(makeAdminPrisma());
    const detector = new FraudDetector(baseAdminPrisma as AnyPrismaClient);
    const result   = await detector.checkMultiAccount('user-1', null, null);
    expect(result.risk).toBe('low');
    expect(result.reason).toBeNull();
  });

  it('returns high risk when > 3 users share the same IP', async () => {
    const adminPrisma = makeAdminPrisma({
      userDevice: {
        findMany: jest.fn()
          .mockResolvedValueOnce([
            { userId: 'u2' }, { userId: 'u3' }, { userId: 'u4' }, { userId: 'u5' },
          ])
          .mockResolvedValueOnce([]),  // fingerprint check → clean
      },
    });
    dbsMock.getPrismaClient.mockReturnValue(adminPrisma);
    const detector = new FraudDetector(baseAdminPrisma as AnyPrismaClient);
    const result   = await detector.checkMultiAccount('user-1', null, '10.0.0.1');
    expect(result.risk).toBe('high');
    expect(result.reason).toBe('many_users_same_ip');
    expect(result.count).toBe(4);
  });

  it('returns high risk when > 2 users share the same fingerprint', async () => {
    const adminPrisma = makeAdminPrisma({
      userDevice: {
        findMany: jest.fn()
          .mockResolvedValueOnce([])    // ip check → clean
          .mockResolvedValueOnce([
            { userId: 'u2' }, { userId: 'u3' }, { userId: 'u4' },
          ]),
      },
    });
    dbsMock.getPrismaClient.mockReturnValue(adminPrisma);
    const detector = new FraudDetector(baseAdminPrisma as AnyPrismaClient);
    const result   = await detector.checkMultiAccount('user-1', 'fp-abc', null);
    expect(result.risk).toBe('high');
    expect(result.reason).toBe('many_users_same_device');
    expect(result.count).toBe(3);
  });

  it('returns medium risk on registration burst (> 10 new users in 5 min)', async () => {
    const adminPrisma = makeAdminPrisma({
      user: { count: jest.fn().mockResolvedValue(11), update: jest.fn() },
    });
    dbsMock.getPrismaClient.mockReturnValue(adminPrisma);
    const detector = new FraudDetector(baseAdminPrisma as AnyPrismaClient);
    const result   = await detector.checkMultiAccount('user-1', null, null);
    expect(result.risk).toBe('medium');
    expect(result.reason).toBe('rapid_registration_burst');
  });

  it('returns low risk (fail-open) when adminPrisma throws', async () => {
    dbsMock.getPrismaClient.mockImplementation(() => { throw new Error('db down'); });
    const detector = new FraudDetector(baseAdminPrisma as AnyPrismaClient);
    const result   = await detector.checkMultiAccount('user-1', 'fp-1', '1.2.3.4');
    expect(result.risk).toBe('low');
  });
});
