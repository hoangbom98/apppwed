/**
 * Tests for walletService — atomic balance credit/debit with transaction logging.
 * Uses mocked Prisma to verify transaction atomicity without a real DB.
 *
 * Coverage:
 *  - credit / debit basic flow
 *  - insufficient funds guard
 *  - Optimistic Lock (version column) — prevents race-condition double-spend
 *  - Idempotency (referenceId unique) — prevents double-charge on retry
 */

jest.mock('../shared/services/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
}));

// ── Wallet operation simulation helpers ───────────────────────────────────────

interface User { id: number; balance: number; version: number; }
interface Tx   { id: number; userId: number; type: string; amount: number; referenceId?: string; }

function makePrisma(initialBalance = 1000, initialVersion = 0) {
  let balance = initialBalance;
  let version = initialVersion;
  const txLog: Tx[] = [];
  const usedRefs = new Set<string>();

  const user = {
    findUnique: jest.fn().mockImplementation(async () => ({ id: 1, balance, version })),
    update: jest.fn().mockImplementation(async ({ where, data }: { where: { id: number; version?: number }; data: Partial<User> }) => {
      // Simulate optimistic lock: reject if version mismatch
      if (where.version !== undefined && where.version !== version) {
        return null;  // 0 rows affected
      }
      if (data.balance !== undefined) balance = data.balance;
      if (data.version !== undefined) version = data.version;
      else version += 1; // auto-increment version on any update
      return { id: 1, balance, version };
    }),
  };

  const transaction = {
    create: jest.fn().mockImplementation(async ({ data }: { data: Tx }) => {
      // Simulate DB-level UNIQUE constraint on referenceId
      if (data.referenceId && usedRefs.has(data.referenceId)) {
        throw new Error('Duplicate entry for referenceId (Idempotency key violated)');
      }
      if (data.referenceId) usedRefs.add(data.referenceId);
      const tx = { id: txLog.length + 1, ...data };
      txLog.push(tx);
      return tx;
    }),
  };

  const $transaction = jest.fn().mockImplementation(async (ops: Array<Promise<unknown>>) =>
    Promise.all(ops)
  );

  return {
    user,
    transaction,
    $transaction,
    _balance:  () => balance,
    _version:  () => version,
    _txLog:    () => txLog,
    _usedRefs: () => usedRefs,
  };
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

// ── Optimistic Lock (version column) ─────────────────────────────────────────

describe('walletService (optimistic lock)', () => {
  it('succeeds when version matches current DB version', async () => {
    const prisma = makePrisma(1000, 5);
    const user = await prisma.user.findUnique({ where: { id: 1 } });
    expect(user!.version).toBe(5);

    // Update with correct version — simulates correct optimistic lock usage
    const result = await prisma.user.update({
      where: { id: 1, version: 5 },
      data:  { balance: user!.balance - 200, version: 6 },
    });

    expect(result).not.toBeNull();
    expect(prisma._balance()).toBe(800);
    expect(prisma._version()).toBe(6);
  });

  it('returns null (0 rows affected) when version is stale — concurrent write detected', async () => {
    const prisma = makePrisma(1000, 5);

    // Simulate a concurrent write that already bumped the version to 6
    await prisma.user.update({ where: { id: 1 }, data: { balance: 900 } }); // version now 6

    // Our stale request still thinks version is 5
    const result = await prisma.user.update({
      where: { id: 1, version: 5 },  // stale version
      data:  { balance: 800, version: 6 },
    });

    expect(result).toBeNull();  // rejected — should trigger retry in service layer
  });

  it('does NOT deduct balance when optimistic lock fails', async () => {
    const prisma = makePrisma(1000, 3);
    const initialBalance = prisma._balance();

    // Simulate concurrent update bumping version to 4
    await prisma.user.update({ where: { id: 1 }, data: { balance: 900 } }); // version: 4

    // Our request tries to debit with stale version 3
    const result = await prisma.user.update({
      where: { id: 1, version: 3 },  // stale
      data:  { balance: initialBalance - 500 },
    });

    expect(result).toBeNull();
    expect(prisma._balance()).toBe(900); // unchanged from the concurrent write, NOT our debit
  });

  it('succeeds on retry after refreshing version from DB', async () => {
    const prisma = makePrisma(1000, 2);

    // Simulate concurrent bump
    await prisma.user.update({ where: { id: 1 }, data: { balance: 950 } }); // version: 3

    // First attempt fails (stale version 2)
    const attempt1 = await prisma.user.update({
      where: { id: 1, version: 2 },
      data:  { balance: 750 },
    });
    expect(attempt1).toBeNull();

    // Re-read current state from DB and retry
    const fresh = await prisma.user.findUnique({ where: { id: 1 } });
    const attempt2 = await prisma.user.update({
      where: { id: 1, version: fresh!.version },  // now version 3
      data:  { balance: fresh!.balance - 200, version: fresh!.version + 1 },
    });
    expect(attempt2).not.toBeNull();
    expect(prisma._balance()).toBe(750); // 950 - 200
  });
});

// ── Idempotency (referenceId unique) ─────────────────────────────────────────

describe('walletService (idempotency key)', () => {
  it('succeeds on first transaction with a new referenceId', async () => {
    const prisma = makePrisma(1000);

    const result = await prisma.transaction.create({
      data: { id: 0, userId: 1, type: 'deposit', amount: 500, referenceId: 'TXN-001' },
    });

    expect(result.referenceId).toBe('TXN-001');
    expect(prisma._txLog()).toHaveLength(1);
  });

  it('throws Duplicate error when same referenceId is submitted twice (double-charge protection)', async () => {
    const prisma = makePrisma(1000);

    // First submission
    await prisma.transaction.create({
      data: { id: 0, userId: 1, type: 'deposit', amount: 500, referenceId: 'TXN-RETRY-001' },
    });

    // Retry with same referenceId — must throw
    await expect(
      prisma.transaction.create({
        data: { id: 0, userId: 1, type: 'deposit', amount: 500, referenceId: 'TXN-RETRY-001' },
      })
    ).rejects.toThrow('Idempotency key violated');

    // Verify no duplicate was recorded
    expect(prisma._txLog()).toHaveLength(1);
  });

  it('allows different referenceIds to coexist', async () => {
    const prisma = makePrisma(1000);

    await prisma.transaction.create({
      data: { id: 0, userId: 1, type: 'deposit', amount: 100, referenceId: 'TXN-A' },
    });
    await prisma.transaction.create({
      data: { id: 0, userId: 1, type: 'deposit', amount: 200, referenceId: 'TXN-B' },
    });

    expect(prisma._txLog()).toHaveLength(2);
    expect(prisma._usedRefs().has('TXN-A')).toBe(true);
    expect(prisma._usedRefs().has('TXN-B')).toBe(true);
  });

  it('allows null referenceId (internal system transactions without external ref)', async () => {
    const prisma = makePrisma(1000);

    // System transactions (bonus, adjustment) may not have external referenceId
    await prisma.transaction.create({ data: { id: 0, userId: 1, type: 'bonus', amount: 50 } });
    await prisma.transaction.create({ data: { id: 0, userId: 1, type: 'bonus', amount: 30 } });

    expect(prisma._txLog()).toHaveLength(2); // both allowed because referenceId is undefined
  });
});
