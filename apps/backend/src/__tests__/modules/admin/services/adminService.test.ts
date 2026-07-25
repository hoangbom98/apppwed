/* eslint-disable */

/**
 * Tests for adminService — function-module pattern.
 * The module exports safeCount, safeSum, and getUserCounts functions.
 * BaseService functionality is tested via the mock Prisma model methods.
 */

// Mock databases config before any import
jest.mock('../../../../config/databases', () => ({
  getPrismaClient: jest.fn(),
}));

jest.mock('../../../../shared/services/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn(),
}));

const { getPrismaClient } = require('../../../../config/databases');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockPrisma(overrides: Record<string, any> = {}) {
  return {
    user: {
      count:      jest.fn().mockResolvedValue(0),
      aggregate:  jest.fn().mockResolvedValue({ _sum: {} }),
    },
    adminUser: {
      count:    jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('adminService — safeCount', () => {
  it('returns model count when successful', async () => {
    const { safeCount } = require('../../../../modules/admin/services/adminService');
    const mockModel = { count: jest.fn().mockResolvedValue(42) };

    const result = await safeCount(mockModel, {});
    expect(result).toBe(42);
    expect(mockModel.count).toHaveBeenCalledWith({ where: {} });
  });

  it('returns 0 when model.count throws', async () => {
    const { safeCount } = require('../../../../modules/admin/services/adminService');
    const mockModel = { count: jest.fn().mockRejectedValue(new Error('DB error')) };

    const result = await safeCount(mockModel, {});
    expect(result).toBe(0);
  });
});

describe('adminService — safeSum', () => {
  it('returns summed field value when successful', async () => {
    const { safeSum } = require('../../../../modules/admin/services/adminService');
    const mockModel = {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 500 } }),
    };

    const result = await safeSum(mockModel, 'amount', {});
    expect(result).toBe(500);
  });

  it('returns 0 when aggregate throws', async () => {
    const { safeSum } = require('../../../../modules/admin/services/adminService');
    const mockModel = { aggregate: jest.fn().mockRejectedValue(new Error('DB error')) };

    const result = await safeSum(mockModel, 'balance', {});
    expect(result).toBe(0);
  });
});

describe('adminService — getUserCounts', () => {
  it('returns per-project user counts and total', async () => {
    const mockPrisma = makeMockPrisma();
    mockPrisma.user.count.mockResolvedValue(10);
    getPrismaClient.mockReturnValue(mockPrisma);

    jest.resetModules();
    jest.mock('../../../../config/databases', () => ({
      getPrismaClient: jest.fn().mockReturnValue(mockPrisma),
    }));

    const { getUserCounts } = require('../../../../modules/admin/services/adminService');
    const result = await getUserCounts();

    expect(typeof result.total).toBe('number');
    expect(result).toHaveProperty('hub');
    expect(result).toHaveProperty('game');
  });

  it('always includes total and per-project keys in result', async () => {
    const mockPrisma2 = makeMockPrisma();
    mockPrisma2.user.count.mockResolvedValue(0);
    getPrismaClient.mockReturnValue(mockPrisma2);

    jest.resetModules();
    jest.mock('../../../../config/databases', () => ({
      getPrismaClient: jest.fn().mockReturnValue(mockPrisma2),
    }));

    const { getUserCounts } = require('../../../../modules/admin/services/adminService');
    const result = await getUserCounts();
    expect(result).toHaveProperty('total');
    expect(typeof result.total).toBe('number');
    expect(result).toHaveProperty('game');
    expect(result).toHaveProperty('dating');
  });
});
