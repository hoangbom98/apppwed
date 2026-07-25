// @ts-nocheck
'use strict';
/**
 * LotteryService (Admin) — lottery draw management.
 *
 * Reads/writes game_db: LotteryDraw, LotteryBet, LotteryType, OddsSetting.
 * BoYue equivalent: caipiao_kj (draw) / caipiao_issue (period) / caipiao_touzhu (bet).
 *
 * Exposed methods:
 *   listTypes()                               — all lottery game types
 *   listDraws({ typeId, status, skip, take }) — paginated draw list
 *   getDraw(drawId)                           — draw detail with bet summary
 *   createDraw(data)                          — create new draw for a type
 *   setResult(drawId, resultOfficial)         — submit result, trigger settlement
 *   cancelDraw(drawId)                        — cancel draw, refund all bets
 *   getDrawBets(drawId, { skip, take })       — paginated bets for a draw
 *   getStats()                                — daily/overall lottery stats
 */

const { getPrismaClient } = require('../../../config/databases');

const gameDb = () => getPrismaClient('game');

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

async function listTypes() {
  return gameDb().lotteryType.findMany({
    where:   { status: 'active' },
    orderBy: { sortOrder: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Draws
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated draw list, optionally filtered by typeId / status.
 * @param {{ typeId?, status?, skip?, take? }} opts
 */
async function listDraws({ typeId, status, skip = 0, take = 20 } = {}) {
  const where = {};
  if (typeId)  where.typeId = typeId;
  if (status)  where.status = status;

  const db = gameDb();
  const [data, total] = await Promise.all([
    db.lotteryDraw.findMany({
      where,
      skip,
      take,
      orderBy: { drawTime: 'desc' },
      include: {
        type:       true,
        _count:     { select: { bets: true } },
      },
    }),
    db.lotteryDraw.count({ where }),
  ]);

  return { data, total };
}

/**
 * Single draw with bet summary stats.
 * @param {string} drawId
 */
async function getDraw(drawId) {
  const db   = gameDb();
  const draw = await db.lotteryDraw.findUnique({
    where:   { id: drawId },
    include: {
      type:  true,
      _count: { select: { bets: true } },
    },
  });
  if (!draw) return null;

  const betAgg = await db.lotteryBet.aggregate({
    where:  { drawId },
    _sum:   { amount: true, payout: true },
    _count: { _all: true },
  });

  return {
    ...draw,
    totalBets:      betAgg._count._all,
    totalBetAmount: Number(betAgg._sum.amount  ?? 0),
    totalPayout:    Number(betAgg._sum.payout  ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create draw
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new lottery draw.
 * Generates period code as `{typeCode}{YYYYMMDD}{seq}` if not supplied.
 *
 * @param {{ typeId: string, drawTime: Date, period?: string, resultPreset?: string }} data
 */
async function createDraw({ typeId, drawTime, period, resultPreset = null }) {
  const db = gameDb();

  const type = await db.lotteryType.findUnique({ where: { id: typeId } });
  if (!type) throw Object.assign(new Error('Lottery type not found'), { code: 'RESOURCE_NOT_FOUND' });

  // Auto-generate period code if not provided
  if (!period) {
    const dt      = new Date(drawTime);
    const dateStr = dt.toISOString().slice(0, 10).replace(/-/g, '');
    const count   = await db.lotteryDraw.count({
      where: { typeId, drawTime: { gte: new Date(`${dt.toISOString().slice(0, 10)}T00:00:00Z`) } },
    });
    period = `${type.code}${dateStr}${String(count + 1).padStart(3, '0')}`;
  }

  return db.lotteryDraw.create({
    data:    { typeId, period, drawTime: new Date(drawTime), resultPreset, status: 'WAITING' },
    include: { type: true },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Set result + trigger settlement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit official result for a draw and enqueue settlement.
 * If the lottery-settlement BullMQ queue is available it is used;
 * otherwise settlement runs synchronously via LotterySettlementService.
 *
 * @param {string} drawId
 * @param {string} resultOfficial  comma-separated numbers, e.g. "1,3,5"
 */
async function setResult(drawId, resultOfficial) {
  const db   = gameDb();
  const draw = await db.lotteryDraw.findUnique({ where: { id: drawId } });

  if (!draw) throw Object.assign(new Error('Draw not found'), { code: 'LOTTERY_DRAW_NOT_FOUND' });
  if (draw.status === 'SETTLED') throw Object.assign(new Error('Draw already settled'), { code: 'LOTTERY_ALREADY_SETTLED' });
  if (draw.status === 'CANCELLED') throw Object.assign(new Error('Draw is cancelled'), { code: 'RESOURCE_CONFLICT' });

  // Persist result + close draw for new bets
  await db.lotteryDraw.update({
    where: { id: drawId },
    data:  { resultOfficial, status: 'DRAWN', isClosed: true },
  });

  // Enqueue async settlement (preferred) or fall back to sync
  try {
    const { enqueueLotterySettlement } = require('../../workers/lottery-settlement.worker');
    await enqueueLotterySettlement(drawId);
  } catch {
    // BullMQ unavailable — settle synchronously
    const { LotterySettlementService } = require('../../game/services/lotteryService/LotterySettlementService');
    const svc = new LotterySettlementService(db);
    await svc.settle(drawId);
  }

  return { drawId, resultOfficial, status: 'DRAWN' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel draw
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cancel a draw — refund all PENDING bets atomically.
 * @param {string} drawId
 * @param {string} [reason]
 */
async function cancelDraw(drawId, reason = '') {
  const db   = gameDb();
  const draw = await db.lotteryDraw.findUnique({
    where:   { id: drawId },
    include: { bets: { where: { status: 'PENDING' } } },
  });

  if (!draw) throw Object.assign(new Error('Draw not found'), { code: 'LOTTERY_DRAW_NOT_FOUND' });
  if (draw.status === 'SETTLED') throw Object.assign(new Error('Cannot cancel settled draw'), { code: 'RESOURCE_CONFLICT' });

  await db.$transaction(async (tx) => {
    // 1. Mark draw cancelled
    await tx.lotteryDraw.update({
      where: { id: drawId },
      data:  { status: 'CANCELLED', isClosed: true },
    });

    // 2. Refund each pending bet
    for (const bet of draw.bets) {
      await tx.lotteryBet.update({
        where: { id: bet.id },
        data:  { status: 'CANCELLED', settledAt: new Date() },
      });
      const updated = await tx.user.update({
        where:  { id: bet.userId },
        data:   { balance: { increment: bet.amount } },
        select: { balance: true },
      });
      await tx.transaction.create({
        data: {
          userId:        bet.userId,
          type:          'refund',
          amount:        bet.amount,
          balanceBefore: +updated.balance - +bet.amount,
          balanceAfter:  +updated.balance,
          referenceId:   bet.id,
          referenceType: 'lottery_bet',
          note:          `Draw ${draw.period} cancelled${reason ? ': ' + reason : ''}`,
        },
      });
    }
  });

  return { drawId, cancelled: draw.bets.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Draw bets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated bets for a draw.
 * @param {string} drawId
 * @param {{ skip?, take?, status? }} opts
 */
async function getDrawBets(drawId, { skip = 0, take = 50, status } = {}) {
  const db    = gameDb();
  const where = { drawId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    db.lotteryBet.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, vipLevel: true } },
      },
    }),
    db.lotteryBet.count({ where }),
  ]);

  return { data, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lottery stats for admin dashboard — today + 30-day totals.
 */
async function getStats() {
  const db    = gameDb();
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(); since.setDate(since.getDate() - 30);

  const [todayBets, totalBets, todayDraws] = await Promise.all([
    db.lotteryBet.aggregate({
      where: { createdAt: { gte: new Date(today) } },
      _sum:  { amount: true, payout: true },
      _count: { _all: true },
    }),
    db.lotteryBet.aggregate({
      where: { createdAt: { gte: since } },
      _sum:  { amount: true, payout: true },
    }),
    db.lotteryDraw.count({ where: { createdAt: { gte: new Date(today) } } }),
  ]);

  return {
    today: {
      draws:     todayDraws,
      bets:      todayBets._count._all,
      betAmount: Number(todayBets._sum.amount ?? 0),
      payout:    Number(todayBets._sum.payout ?? 0),
    },
    last30Days: {
      betAmount: Number(totalBets._sum.amount ?? 0),
      payout:    Number(totalBets._sum.payout ?? 0),
    },
  };
}

module.exports = { listTypes, listDraws, getDraw, createDraw, setResult, cancelDraw, getDrawBets, getStats };
