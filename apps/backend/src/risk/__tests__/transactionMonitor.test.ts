/**
 * Unit tests for TransactionMonitor.evaluate() and checkInternalTransfer()
 *
 * Uses an in-memory mock prisma — no DB, no Redis.
 * Logger and databases modules are intercepted via jest.config.ts moduleNameMapper.
 */

import TransactionMonitor from '../transactionMonitor';
import type { AnyPrismaClient } from '../types';

// ── Prisma mock builder ───────────────────────────────────────────────────────

function makePrisma(txOverrides: {
  count?:     jest.Mock;
  aggregate?: jest.Mock;
  findFirst?: jest.Mock;
  findMany?:  jest.Mock;
} = {}): AnyPrismaClient {
  return {
    user:        {
      findUnique: jest.fn().mockResolvedValue(null),
      update:     jest.fn(),
      updateMany: jest.fn(),
      findMany:   jest.fn().mockResolvedValue([]),
      count:      jest.fn().mockResolvedValue(0),
    },
    userDevice:  { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    riskAlert:   { create: jest.fn(), count: jest.fn() },
    riskRule:    { findFirst: jest.fn(), create: jest.fn() },
    riskScore:   { upsert: jest.fn(), create: jest.fn() },
    amlAlert:    { count: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    securityLog: { create: jest.fn(), count: jest.fn() },
    transaction: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
      findMany:  jest.fn().mockResolvedValue([]),
      count:     jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      ...txOverrides,
    },
    ipBlacklist: { findFirst: jest.fn(), upsert: jest.fn() },
  } as unknown as AnyPrismaClient;
}

// ── evaluate() ───────────────────────────────────────────────────────────────

describe('TransactionMonitor.evaluate()', () => {
  it('returns high risk when tx frequency exceeds 10/minute', async () => {
    const prisma  = makePrisma({ count: jest.fn().mockResolvedValue(15) });
    const monitor = new TransactionMonitor(prisma);
    const result  = await monitor.evaluate('user-1', 1000, 'deposit');
    expect(result.risk).toBe('high');
    expect(result.reason).toBe('high_frequency');
  });

  it('returns high risk on deposit spike (> 50 M in 10 min)', async () => {
    // count=0 (no velocity issue); aggregate shows 40 M already present
    const prisma = makePrisma({
      count:     jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 40_000_000 } }),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany:  jest.fn().mockResolvedValue([]),
    });
    const monitor = new TransactionMonitor(prisma);
    // 40 M in window + 15 M new = 55 M > 50 M threshold
    const result = await monitor.evaluate('user-1', 15_000_000, 'deposit');
    expect(result.risk).toBe('high');
    expect(result.reason).toBe('deposit_spike');
  });

  it('returns high risk on withdraw-after-deposit pattern', async () => {
    const recentDeposit = { amount: 1_000_000, createdAt: new Date(), status: 'success', type: 'deposit' };
    const prisma = makePrisma({
      count:     jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(recentDeposit),
      findMany:  jest.fn().mockResolvedValue([]),
    });
    const monitor = new TransactionMonitor(prisma);
    // Withdraw 95% of last deposit shortly after
    const result = await monitor.evaluate('user-1', 950_000, 'withdraw');
    expect(result.risk).toBe('high');
    expect(result.reason).toBe('withdraw_after_deposit');
  });

  it('returns medium risk when amount is > 3σ from 7-day average', async () => {
    // 5 recent txs all ~100; submitting 1_000_000 is >> avg + 3σ
    const prisma = makePrisma({
      count:     jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany:  jest.fn().mockResolvedValue([
        { amount: 100 }, { amount: 100 }, { amount: 100 }, { amount: 100 }, { amount: 100 },
      ]),
    });
    const monitor = new TransactionMonitor(prisma);
    const result  = await monitor.evaluate('user-1', 1_000_000, 'withdraw');
    expect(result.risk).toBe('medium');
    expect(result.reason).toBe('amount_anomaly');
  });

  it('returns low risk for a normal transaction', async () => {
    const prisma  = makePrisma();
    const monitor = new TransactionMonitor(prisma);
    const result  = await monitor.evaluate('user-1', 100, 'deposit');
    expect(result.risk).toBe('low');
    expect(result.reason).toBeNull();
  });
});

// ── checkInternalTransfer() ───────────────────────────────────────────────────

describe('TransactionMonitor.checkInternalTransfer()', () => {
  it('returns high risk when recipient account is < 24 h old', async () => {
    const newUser  = { createdAt: new Date() };
    const prisma   = makePrisma();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(newUser);
    const monitor  = new TransactionMonitor(prisma);
    const result   = await monitor.checkInternalTransfer('sender', 'new-user');
    expect(result.risk).toBe('high');
    expect(result.reason).toBe('transfer_to_new_account');
  });

  it('returns low risk for an established recipient', async () => {
    const oldUser  = { createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    const prisma   = makePrisma();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(oldUser);
    const monitor  = new TransactionMonitor(prisma);
    const result   = await monitor.checkInternalTransfer('sender', 'old-user');
    expect(result.risk).toBe('low');
  });

  it('returns high risk when recipient does not exist', async () => {
    const prisma  = makePrisma();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const monitor = new TransactionMonitor(prisma);
    const result  = await monitor.checkInternalTransfer('sender', 'ghost-user');
    expect(result.risk).toBe('high');
    expect(result.reason).toBe('unknown_recipient');
  });
});
