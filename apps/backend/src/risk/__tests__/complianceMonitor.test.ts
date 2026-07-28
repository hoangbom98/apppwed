/**
 * Unit tests for ComplianceMonitor.checkKyc() and checkAml()
 *
 * Uses in-memory prisma mock; no DB or Redis required.
 * Logger and databases intercepted via jest.config.ts moduleNameMapper.
 */

import ComplianceMonitor from '../complianceMonitor';
import type { AnyPrismaClient } from '../types';

function makePrisma(
  userKycLevel: string | null = 'none',
  aggAmount = 0,
  aggCount  = 0,
): AnyPrismaClient {
  return {
    user: {
      findUnique:  jest.fn().mockResolvedValue(userKycLevel !== null ? { kycLevel: userKycLevel } : null),
      update:      jest.fn().mockResolvedValue({}),
      updateMany:  jest.fn(),
      findMany:    jest.fn(),
      count:       jest.fn(),
    },
    transaction: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: aggAmount }, _count: aggCount }),
      findMany:  jest.fn(),
      count:     jest.fn(),
      findFirst: jest.fn(),
    },
    amlAlert:    { create: jest.fn().mockResolvedValue({}), count: jest.fn(), findFirst: jest.fn() },
    userDevice:  { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    riskAlert:   { create: jest.fn(), count: jest.fn() },
    riskRule:    { findFirst: jest.fn(), create: jest.fn() },
    riskScore:   { upsert: jest.fn(), create: jest.fn() },
    securityLog: { create: jest.fn(), count: jest.fn() },
    ipBlacklist: { findFirst: jest.fn(), upsert: jest.fn() },
  } as unknown as AnyPrismaClient;
}

// ── checkKyc() ────────────────────────────────────────────────────────────────

describe('ComplianceMonitor.checkKyc()', () => {
  it('returns ok for a verified user regardless of amount', async () => {
    const prisma  = makePrisma('verified');
    const monitor = new ComplianceMonitor(prisma);
    const result  = await monitor.checkKyc('user-1', 30_000_000);
    expect(result.action).toBe('ok');
  });

  it('returns ok for a level1 user', async () => {
    const prisma  = makePrisma('level1');
    const monitor = new ComplianceMonitor(prisma);
    const result  = await monitor.checkKyc('user-1', 10_000_000);
    expect(result.action).toBe('ok');
  });

  it('requires KYC when deposit exceeds 20 M (single tx threshold)', async () => {
    const prisma  = makePrisma('none', 0);
    const monitor = new ComplianceMonitor(prisma);
    const result  = await monitor.checkKyc('user-1', 25_000_000);
    expect(result.action).toBe('kyc_required');
    expect(result.reason).toBe('threshold_exceeded');
  });

  it('requires KYC when cumulative deposits exceed 50 M', async () => {
    const prisma  = makePrisma('none', 55_000_000);  // aggAmount > 50 M
    const monitor = new ComplianceMonitor(prisma);
    const result  = await monitor.checkKyc('user-1', 1_000);
    expect(result.action).toBe('kyc_required');
  });

  it('returns ok when user does not exist', async () => {
    const prisma  = makePrisma(null);
    const monitor = new ComplianceMonitor(prisma);
    const result  = await monitor.checkKyc('ghost', 99_000_000);
    expect(result.action).toBe('ok');
  });
});

// ── checkAml() ────────────────────────────────────────────────────────────────

describe('ComplianceMonitor.checkAml()', () => {
  it('flags large single transaction (>= 100 M) as aml_alert', async () => {
    const prisma  = makePrisma();
    const monitor = new ComplianceMonitor(prisma);
    const result  = await monitor.checkAml('user-1', 'tx-1', 100_000_000);
    expect(result.action).toBe('aml_alert');
    expect(result.reason).toBe('large_transaction');
  });

  it('flags structuring: 5+ small txs totalling > 50 M in 24 h', async () => {
    // dailyTotal 49 M + 5 tx count already → adding 2 M pushes over 50 M limit
    const prisma  = makePrisma('none', 49_000_000, 5);
    const monitor = new ComplianceMonitor(prisma);
    const result  = await monitor.checkAml('user-1', 'tx-x', 2_000_000);
    expect(result.action).toBe('aml_alert');
    expect(result.reason).toBe('structuring');
  });

  it('returns ok for a normal small transaction', async () => {
    const prisma  = makePrisma('none', 0, 0);
    const monitor = new ComplianceMonitor(prisma);
    const result  = await monitor.checkAml('user-1', 'tx-n', 5_000);
    expect(result.action).toBe('ok');
  });
});
