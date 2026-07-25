/* eslint-disable */

/**
 * Tests for promotionService (admin) — function-module pattern.
 * The module exports plain functions (not a class):
 *   list, getById, create, update, toggleStatus, getActivePromotions, getClaims, getStats
 *
 * The moduleNameMapper in jest.config.ts redirects all relative
 * `config/databases` imports to __mocks__/databases, so we configure
 * that mock via `getPrismaClient.mockReturnValue()` in each test.
 */

// __mocks__/databases is already wired via moduleNameMapper for all depth levels.
const { getPrismaClient } = require('../../../../../config/databases');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockDb(overrides: Record<string, any> = {}) {
  return {
    promotion: {
      findMany:   jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count:      jest.fn().mockResolvedValue(0),
      create:     jest.fn(),
      update:     jest.fn(),
    },
    promotionClaim: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { bonusAmount: 0 } }),
      findMany:  jest.fn().mockResolvedValue([]),
      count:     jest.fn().mockResolvedValue(0),
    },
    ...overrides,
  };
}

// The service is required once at the top — it will use whatever getPrismaClient
// returns at call time (since gameDb() calls getPrismaClient() lazily).
const svc = require('../../../../../modules/admin/services/promotionService');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('promotionService — getActivePromotions', () => {
  it('calls promotion.findMany and returns its result', async () => {
    const mockPromos = [{ id: '1', name: 'Summer Sale', status: 'active' }];
    const db = makeMockDb();
    db.promotion.findMany.mockResolvedValue(mockPromos);
    getPrismaClient.mockReturnValue(db);

    const result = await svc.getActivePromotions();

    expect(db.promotion.findMany).toHaveBeenCalled();
    expect(result).toEqual(mockPromos);
  });

  it('returns empty array when no promotions match', async () => {
    const db = makeMockDb();
    db.promotion.findMany.mockResolvedValue([]);
    getPrismaClient.mockReturnValue(db);

    const result = await svc.getActivePromotions();
    expect(result).toEqual([]);
  });
});

describe('promotionService — list', () => {
  it('returns paginated data and total count', async () => {
    const mockPromos = [{ id: '1', name: 'Promo A', _count: { claims: 3 } }];
    const db = makeMockDb();
    db.promotion.findMany.mockResolvedValue(mockPromos);
    db.promotion.count.mockResolvedValue(1);
    getPrismaClient.mockReturnValue(db);

    const result = await svc.list({ skip: 0, take: 20 });

    expect(result.data).toEqual(mockPromos);
    expect(result.total).toBe(1);
  });

  it('uses default skip=0/take=20 when no args provided', async () => {
    const db = makeMockDb();
    getPrismaClient.mockReturnValue(db);

    const result = await svc.list();

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(db.promotion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });
});
