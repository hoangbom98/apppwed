/**
 * Unit tests for OrderMatchingService.
 *
 * Uses an in-memory Prisma-shaped mock so no real DB connection is needed.
 *
 * Coverage:
 *  - Full match (buy fills against sell at compatible price)
 *  - No match (no compatible resting orders)
 *  - Partial fill (buy partially fills against smaller sell)
 *  - Wallet credit on trade execution
 *  - Socket.IO broadcast on trade executed
 */

jest.mock('../../../../shared/services/core/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const OrderMatchingService = require('../orderMatchingService');

// ── Test helpers ──────────────────────────────────────────────────────────────

interface MockOrder {
  id: string;
  symbolId: string;
  side: 'buy' | 'sell';
  type: string;
  price: number;
  quantity: number;
  executedQty: number;
  userId: string;
  status: string;
  createdAt: Date;
}

function makeOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  return {
    id:          'order-1',
    symbolId:    'sym-btcusdt',
    side:        'buy',
    type:        'limit',
    price:       50000,
    quantity:    1,
    executedQty: 0,
    userId:      'user-1',
    status:      'pending',
    createdAt:   new Date(),
    ...overrides,
  };
}

function makePrismaMock(restingOrders: MockOrder[] = []) {
  const restingMap: Record<string, MockOrder> = {};
  const orders: Record<string, MockOrder> = {};
  const wallets: Record<string, { balance: number; frozen: number }> = {};
  const trades: any[] = [];

  // Pre-populate resting orders (these are the orders already on the book)
  for (const o of restingOrders) {
    restingMap[o.id] = { ...o };
    orders[o.id] = { ...o };
  }

  return {
    order: {
      // findMany simulates querying the order book — returns only pre-populated resting orders
      findMany: jest.fn().mockImplementation(async () => {
        return Object.values(restingMap).filter(o =>
          ['pending', 'partial'].includes(o.status),
        );
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }: any) =>
        orders[where.id] ?? null,
      ),
      update: jest.fn().mockImplementation(async ({ where, data }: any) => {
        if (orders[where.id]) orders[where.id] = { ...orders[where.id], ...data };
        if (restingMap[where.id]) restingMap[where.id] = { ...restingMap[where.id], ...data };
        return orders[where.id] ?? null;
      }),
    },
    symbol: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'sym-btcusdt',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
      }),
    },
    trade: {
      create: jest.fn().mockImplementation(async ({ data }: any) => {
        const t = { id: `trade-${trades.length + 1}`, ...data };
        trades.push(t);
        return t;
      }),
    },
    wallet: {
      upsert: jest.fn().mockImplementation(async ({ where, create, update }: any) => {
        const uid = where.userId;
        if (!wallets[uid]) wallets[uid] = create;
        else wallets[uid].balance += update.balance?.increment ?? 0;
        return wallets[uid];
      }),
    },
    $transaction: jest.fn().mockImplementation(async (fn: Function) => fn({
      order: {
        update: jest.fn().mockImplementation(async ({ where, data }: any) => {
          orders[where.id] = { ...orders[where.id], ...data };
          return orders[where.id];
        }),
      },
      wallet: {
        upsert: jest.fn().mockImplementation(async ({ where, create, update }: any) => {
          const uid = where.userId;
          if (!wallets[uid]) wallets[uid] = { ...create };
          else wallets[uid].balance += update.balance?.increment ?? 0;
          return wallets[uid];
        }),
      },
      trade: {
        create: jest.fn().mockImplementation(async ({ data }: any) => {
          const t = { id: `trade-${trades.length + 1}`, ...data };
          trades.push(t);
          return t;
        }),
      },
    })),
    _orders:  () => orders,
    _wallets: () => wallets,
    _trades:  () => trades,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OrderMatchingService', () => {
  describe('match — no resting orders', () => {
    it('returns original order unchanged when no compatible resting orders exist', async () => {
      const prisma = makePrismaMock([]); // empty book
      const svc = new OrderMatchingService(prisma, null);
      const newOrder = makeOrder({ id: 'order-new', side: 'buy', price: 50000, quantity: 1, executedQty: 0 });
      prisma._orders()['order-new'] = { ...newOrder };

      await svc.match(newOrder);

      // No trades executed
      expect(prisma._trades()).toHaveLength(0);
      // Order untouched — remains 'pending'
      expect(prisma._orders()['order-new'].status).toBe('pending');
    });
  });

  describe('match — full fill', () => {
    it('fills buy order completely against a compatible sell at same price', async () => {
      const sellOrder = makeOrder({
        id: 'sell-1', side: 'sell', price: 50000, quantity: 1, executedQty: 0,
        userId: 'seller', status: 'pending',
      });
      const prisma = makePrismaMock([sellOrder]);
      prisma._orders()['sell-1'] = { ...sellOrder };

      const buyOrder = makeOrder({
        id: 'buy-1', side: 'buy', price: 50000, quantity: 1, executedQty: 0,
        userId: 'buyer', status: 'pending',
      });
      prisma._orders()['buy-1'] = { ...buyOrder };

      const svc = new OrderMatchingService(prisma, null);
      await svc.match(buyOrder);

      // One trade recorded
      expect(prisma._trades()).toHaveLength(1);
      // Trade amount is correct
      expect(prisma._trades()[0].quantity).toBe(1);
    });
  });

  describe('match — partial fill', () => {
    it('partially fills a buy order when sell is smaller than buy quantity', async () => {
      // Sell only 0.5 BTC
      const sellOrder = makeOrder({
        id: 'sell-partial', side: 'sell', price: 48000, quantity: 0.5, executedQty: 0,
        userId: 'seller', status: 'pending',
      });
      const prisma = makePrismaMock([sellOrder]);
      prisma._orders()['sell-partial'] = { ...sellOrder };

      // Buy 1.0 BTC — will only get 0.5
      const buyOrder = makeOrder({
        id: 'buy-big', side: 'buy', price: 50000, quantity: 1, executedQty: 0,
        userId: 'buyer', status: 'pending',
      });
      prisma._orders()['buy-big'] = { ...buyOrder };

      const svc = new OrderMatchingService(prisma, null);
      await svc.match(buyOrder);

      // Only 0.5 traded
      expect(prisma._trades()).toHaveLength(1);
      expect(prisma._trades()[0].quantity).toBe(0.5);
    });
  });

  describe('match — price incompatibility', () => {
    it('does NOT fill when buyer limit < seller ask price', async () => {
      // Seller asks 55000; buyer only willing to pay 50000
      const sellOrder = makeOrder({
        id: 'sell-high', side: 'sell', price: 55000, quantity: 1, executedQty: 0,
        userId: 'seller', status: 'pending',
      });
      const prisma = makePrismaMock([]);
      // Override findMany to return the sell order filtered by price lte
      prisma.order.findMany.mockResolvedValueOnce([]); // no compatible orders

      const buyOrder = makeOrder({
        id: 'buy-low', side: 'buy', price: 50000, quantity: 1, executedQty: 0,
        userId: 'buyer', status: 'pending',
      });
      prisma._orders()['buy-low'] = { ...buyOrder };

      const svc = new OrderMatchingService(prisma, null);
      await svc.match(buyOrder);

      expect(prisma._trades()).toHaveLength(0);
    });
  });

  describe('match — socket.io broadcast', () => {
    it('emits "trade:executed" event via io when a trade occurs', async () => {
      const sellOrder = makeOrder({
        id: 'sell-io', side: 'sell', price: 50000, quantity: 1, executedQty: 0,
        userId: 'seller', status: 'pending',
      });
      const prisma = makePrismaMock([sellOrder]);
      prisma._orders()['sell-io'] = { ...sellOrder };

      const buyOrder = makeOrder({
        id: 'buy-io', side: 'buy', price: 50000, quantity: 1, executedQty: 0,
        userId: 'buyer', status: 'pending',
      });
      prisma._orders()['buy-io'] = { ...buyOrder };

      const io = { emit: jest.fn() };
      const svc = new OrderMatchingService(prisma, io);
      await svc.match(buyOrder);

      expect(io.emit).toHaveBeenCalledWith('trade:executed', expect.objectContaining({
        symbolId: 'sym-btcusdt',
        price: 50000,
      }));
    });

    it('does NOT call io.emit when no trade occurs', async () => {
      const prisma = makePrismaMock([]);
      prisma.order.findMany.mockResolvedValue([]); // no resting orders

      const buyOrder = makeOrder({ id: 'buy-no-io', side: 'buy' });
      prisma._orders()['buy-no-io'] = { ...buyOrder };

      const io = { emit: jest.fn() };
      const svc = new OrderMatchingService(prisma, io);
      await svc.match(buyOrder);

      expect(io.emit).not.toHaveBeenCalled();
    });
  });
});
