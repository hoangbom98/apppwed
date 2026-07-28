// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';
/**
 * transactionService.ts — Centralized Prisma $transaction helper.
 *
 * Provides a safe, opinionated wrapper around Prisma's interactive
 * $transaction API with automatic retry, timeout, and logging.
 *
 * USAGE
 * ─────
 *   const { runTx, runTxWith } = require('./transactionService');
 *
 *   // Use the project's own Prisma client (from req.prisma):
 *   const result = await runTx(req.prisma, async (tx) => {
 *     const user = await tx.user.update({ where: { id }, data: { balance: { increment: amount } } });
 *     await tx.transaction.create({ data: { userId: id, type, amount, balanceAfter: user.balance } });
 *     return user;
 *   });
 *
 *   // Use a named project client directly:
 *   const result = await runTxWith('game', async (tx) => { ... });
 *
 * ERROR HANDLING
 * ──────────────
 *  - Prisma P2034 (write conflict / deadlock) is retried up to MAX_RETRIES times.
 *  - All other errors propagate immediately.
 *  - Every transaction start/commit/rollback is logged at debug level.
 *
 * ISOLATION
 * ─────────
 *  - Default isolation: READ COMMITTED (MySQL 8 default).
 *  - Set `options.isolationLevel` to override:
 *    'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable'
 *
 * TIMEOUTS
 * ────────
 *  - `maxWait`  (ms): max time to acquire a Prisma transaction slot (default 5 000ms).
 *  - `timeout`  (ms): max total transaction duration          (default 15 000ms).
 *
 * NOTE: CommonJS exports — backend package.json "type": "commonjs".
 */

const logger = require('../logger');

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_RETRIES   = 3;
const DEFAULT_WAIT  = 5_000;   // ms — acquire slot
const DEFAULT_TIMEOUT = 15_000; // ms — total tx duration

// ── Types ─────────────────────────────────────────────────────────────────────

interface TxOptions {
  /** Prisma isolation level */
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  /** Max wait time to acquire Prisma transaction slot (ms, default 5000) */
  maxWait?: number;
  /** Max total transaction duration (ms, default 15000) */
  timeout?: number;
  /** Override retry count (default 3) */
  maxRetries?: number;
}

// ── Core runner ───────────────────────────────────────────────────────────────

/**
 * Execute `fn` inside a Prisma interactive transaction with automatic retry
 * on deadlock / write-conflict (Prisma error P2034).
 *
 * @param   prisma   A PrismaClient instance (e.g. req.prisma or getPrismaClient('game')).
 * @param   fn       Async function that receives a transactional Prisma client.
 * @param   options  Optional timeout / isolation settings.
 * @returns Promise resolving to the return value of `fn`.
 */
async function runTx<T>(
  prisma: any,
  fn: (tx: any) => Promise<T>,
  options: TxOptions = {},
): Promise<T> {
  const {
    isolationLevel,
    maxWait   = DEFAULT_WAIT,
    timeout   = DEFAULT_TIMEOUT,
    maxRetries = MAX_RETRIES,
  } = options;

  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  for (;;) {
    attempt++;
    const start = Date.now();

    try {
      const result = await prisma.$transaction(fn, {
        maxWait,
        timeout,
        ...(isolationLevel ? { isolationLevel } : {}),
      });

      const elapsed = Date.now() - start;
      if (elapsed > timeout * 0.8) {
        logger.warn(`[Tx] Slow transaction: ${elapsed}ms (threshold ${timeout * 0.8}ms)`);
      } else {
        logger.debug(`[Tx] Committed in ${elapsed}ms (attempt ${attempt})`);
      }

      return result;
    } catch (err: any) {
      const elapsed = Date.now() - start;
      const isDeadlock = err?.code === 'P2034' || /deadlock|write conflict/i.test(err?.message ?? '');

      if (isDeadlock && attempt < maxRetries) {
        const backoff = Math.min(100 * Math.pow(2, attempt - 1), 1000); // 100ms, 200ms, 400ms…
        logger.warn(`[Tx] Deadlock/conflict on attempt ${attempt} — retrying in ${backoff}ms`, {
          code: err.code,
          msg:  err.message,
        });
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }

      logger.error(`[Tx] Failed after ${attempt} attempt(s) in ${elapsed}ms`, {
        code:    err?.code,
        message: err?.message,
      });
      throw err;
    }
  }
}

/**
 * Convenience variant: resolves the Prisma client from a project name.
 *
 * @param   project  Project key: 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin'
 * @param   fn       Async function receiving the transactional client.
 * @param   options  Optional timeout / isolation settings.
 */
async function runTxWith<T>(
  project: string,
  fn: (tx: any) => Promise<T>,
  options: TxOptions = {},
): Promise<T> {
  const { getPrismaClient } = require('../../../config/databases');
  return runTx(getPrismaClient(project), fn, options);
}

// ── Batch helpers ─────────────────────────────────────────────────────────────

/**
 * Credit a user's balance and record a transaction — all in one atomic $transaction.
 * Works for any project DB that has `user.balance` + `transaction` table.
 *
 * @param   prisma      Project Prisma client (or transactional client).
 * @param   userId      User ID (string or number depending on schema).
 * @param   amount      Amount to add (must be positive).
 * @param   type        Transaction type: 'deposit' | 'win' | 'refund' | 'adjustment' | ...
 * @param   note        Optional description.
 * @param   extra       Extra fields for the transaction record.
 * @returns New balance after credit.
 */
async function creditBalance(
  prisma: any,
  userId: string | number,
  amount: number,
  type: string,
  note = '',
  extra: Record<string, unknown> = {},
): Promise<number> {
  return runTx(prisma, async (tx) => {
    const user = await tx.user.update({
      where:  { id: userId },
      data:   { balance: { increment: amount } },
      select: { balance: true },
    });
    const balanceAfter = Number(user.balance);
    await tx.transaction.create({
      data: { userId, type, amount, balanceAfter, note, ...extra },
    });
    logger.info(`[Tx] creditBalance userId=${userId} amount=${amount} type=${type} newBalance=${balanceAfter}`);
    return balanceAfter;
  });
}

/**
 * Debit a user's balance and record a transaction. Throws if insufficient funds.
 */
async function debitBalance(
  prisma: any,
  userId: string | number,
  amount: number,
  type: string,
  note = '',
  extra: Record<string, unknown> = {},
): Promise<number> {
  return runTx(prisma, async (tx) => {
    const user = await tx.user.findUnique({
      where:  { id: userId },
      select: { balance: true },
    });
    if (!user || Number(user.balance) < amount) {
      throw Object.assign(new Error('Insufficient balance'), { status: 400, code: 'INSUFFICIENT_BALANCE' });
    }
    const updated = await tx.user.update({
      where:  { id: userId },
      data:   { balance: { decrement: amount } },
      select: { balance: true },
    });
    const balanceAfter = Number(updated.balance);
    await tx.transaction.create({
      data: { userId, type, amount: -amount, balanceAfter, note, ...extra },
    });
    logger.info(`[Tx] debitBalance userId=${userId} amount=${amount} type=${type} newBalance=${balanceAfter}`);
    return balanceAfter;
  });
}

module.exports = { runTx, runTxWith, creditBalance, debitBalance };
