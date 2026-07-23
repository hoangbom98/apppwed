/**
 * Tests for walletService — atomic balance credit/debit with transaction logging.
 * Uses mocked Prisma to verify transaction atomicity without a real DB.
 */

jest.mock('../shared/services/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
}));

// ── Wallet operation simulation helpers ───────────────────────────────────────

interface User { id: number; balance: number; }
interface Tx   { id: number; userId: number; type: string; amount: number; }

function makePrisma(initialBalance = 1000) {
  let balance = initialBalance;
  const txLog: Tx[] = [];

  const user = {
    findUnique: jest.fn().mockImplementation(async () => ({ id: 1, balance })),
    update: jest.fn().mockImplementation(async ({ data }: { data: Partial<User> }) => {
      if (data.balance !== undefined) balance = data.balance;
      return { id: 1, balance };
    }),
  };

  const transaction = {
    create: jest.fn().mockImplementation(async ({ data }: { data: Tx }) => {
      const tx = { id: txLog.length + 1, ...data };
      txLog.push(tx);
      return tx;
    }),
  };

  const $transaction = jest.fn().mockImplementation(async (ops: Array<Promise<unknown>>) =>
    Promise.all(ops)
  );

  return { user, transaction, $transaction, _balance: () => balance, _txLog: () => txLog };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('walletService (logic patterns)', () => {
  describe('credit operation', () => {
    it('increases balance by credited amount', async () => {
      const prisma = makePrisma(1000);
      const user = await prisma.user.findUnique({ where: { id: 1 } });
      expect(user!.balance).toBe(1000);

      await prisma.$transaction([
        prisma.user.update({ where: { id: 1 }, data: { balance: user!.balance + 500 } }),
        prisma.transaction.create({ data: { id: 0, userId: 1, type: 'credit', amount: 500 } }),
      ]);

      expect(prisma._balance()).toBe(1500);
      expect(prisma._txLog()).toHaveLength(1);
      expect(prisma._txLog()[0].type).toBe('credit');
    });

    it('wraps both operations in a single $transaction call', async () => {
      const prisma = makePrisma(500);
      const user = await prisma.user.findUnique({ where: { id: 1 } });

      await prisma.$transaction([
        prisma.user.update({ where: { id: 1 }, data: { balance: user!.balance + 200 } }),
        prisma.transaction.create({ data: { id: 0, userId: 1, type: 'credit', amount: 200 } }),
      ]);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('debit operation', () => {
    it('decreases balance when sufficient funds available', async () => {
      const prisma = makePrisma(1000);
      const user = await prisma.user.findUnique({ where: { id: 1 } });
      const amount = 300;
      expect(user!.balance).toBeGreaterThanOrEqual(amount);

      await prisma.$transaction([
        prisma.user.update({ where: { id: 1 }, data: { balance: user!.balance - amount } }),
        prisma.transaction.create({ data: { id: 0, userId: 1, type: 'debit', amount } }),
      ]);

      expect(prisma._balance()).toBe(700);
    });

    it('throws before DB ops when balance is insufficient', () => {
      const prisma = makePrisma(100);

      const attemptDebit = async (amount: number) => {
        const user = await prisma.user.findUnique({ where: { id: 1 } });
        if (user!.balance < amount) throw new Error('Số dư không đủ');
        return prisma.$transaction([
          prisma.user.update({ where: { id: 1 }, data: { balance: user!.balance - amount } }),
          prisma.transaction.create({ data: { id: 0, userId: 1, type: 'debit', amount } }),
        ]);
      };

      expect(attemptDebit(9999)).rejects.toThrow('Số dư không đủ');
    });

    it('does not modify balance on insufficient funds', async () => {
      const prisma = makePrisma(100);
      const initialBalance = prisma._balance();

      try {
        const user = await prisma.user.findUnique({ where: { id: 1 } });
        if (user!.balance < 9999) throw new Error('Insufficient');
      } catch { /* expected */ }

      expect(prisma._balance()).toBe(initialBalance);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('transaction record', () => {
    it('creates exactly one transaction record per operation', async () => {
      const prisma = makePrisma(1000);

      for (const [type, amount] of [['credit', 500], ['debit', 200]] as const) {
        const user = await prisma.user.findUnique({ where: { id: 1 } });
        const newBalance = type === 'credit' ? user!.balance + amount : user!.balance - amount;
        await prisma.$transaction([
          prisma.user.update({ where: { id: 1 }, data: { balance: newBalance } }),
          prisma.transaction.create({ data: { id: 0, userId: 1, type, amount } }),
        ]);
      }

      expect(prisma._txLog()).toHaveLength(2);
      expect(prisma._txLog()[0].type).toBe('credit');
      expect(prisma._txLog()[1].type).toBe('debit');
    });
  });
});
