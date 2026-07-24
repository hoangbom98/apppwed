// @ts-nocheck
'use strict';
/**
 * BettingService — Sports module
 *
 * Uses the CORRECT schema models:
 *   BetMarket  (@@map "bet_markets")
 *   BetOdds    (@@map "bet_odds")
 *   BetSlip    (@@map "bet_slips")
 *   BetSlipItem(@@map "bet_slip_items")
 *   Transaction(@@map "transactions")
 *   User.balance (direct field — no separate Wallet model in sports schema)
 *
 * All IDs are CUID strings — never coerce with Number().
 */
const logger = require('../../../shared/services/logger');

class BettingService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /** List open bet markets with odds, grouped by match. */
  async listMarkets({ page = 1, limit = 20, matchId, status } = {}) {
    const where = {};
    if (matchId) where.matchId = matchId;           // CUID string
    if (status)  where.status  = status;
    else         where.status  = { in: ['open', 'suspended'] };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.betMarket.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'asc' },
        include: {
          match: {
            include: {
              homeTeam: { select: { id: true, name: true, logo: true } },
              awayTeam: { select: { id: true, name: true, logo: true } },
              league:   { select: { id: true, name: true, logo: true } },
            },
          },
          odds: { where: { status: 'active' }, orderBy: { selection: 'asc' } },
        },
      }),
      this.prisma.betMarket.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  /** Return a user's bet slip history. */
  async getUserBets(userId, { page = 1, limit = 20, status } = {}) {
    const where = { userId };                        // userId = CUID string
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.betSlip.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              market: {
                include: {
                  match: {
                    include: {
                      homeTeam: { select: { id: true, name: true, logo: true } },
                      awayTeam: { select: { id: true, name: true, logo: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.betSlip.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Place a single-selection bet.
   * Validates market, odds selection, and user balance, then:
   *   1. Creates BetSlip + BetSlipItem atomically
   *   2. Deducts stake from User.balance
   *   3. Records a Transaction
   */
  async placeBet(userId, { marketId, selection, oddsValue, stake, type = 'single' }) {
    if (!marketId || !selection || !oddsValue || !stake || parseFloat(stake) <= 0) {
      throw Object.assign(new Error('Thông tin cá cược không hợp lệ'), { status: 400 });
    }

    const market = await this.prisma.betMarket.findUnique({
      where:   { id: marketId },                    // CUID
      include: { match: true },
    });
    if (!market || market.status !== 'open') {
      throw Object.assign(new Error('Thị trường cá cược không khả dụng'), { status: 400 });
    }
    if (market.match.status === 'finished') {
      throw Object.assign(new Error('Trận đấu đã kết thúc'), { status: 400 });
    }
    if (market.closesAt && new Date() > market.closesAt) {
      throw Object.assign(new Error('Hết hạn đặt cược'), { status: 400 });
    }

    // Validate odds selection
    const oddsRow = await this.prisma.betOdds.findFirst({
      where: { marketId, selection, status: 'active' },
    });
    if (!oddsRow) throw Object.assign(new Error('Lựa chọn tỷ lệ không hợp lệ'), { status: 400 });

    // Check user balance (sports schema: balance lives directly on User)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

    const stakeNum   = parseFloat(stake);
    const oddsNum    = parseFloat(oddsValue);
    const potential  = parseFloat((stakeNum * oddsNum).toFixed(2));
    const balBefore  = parseFloat(user.balance);

    if (balBefore < stakeNum) {
      throw Object.assign(new Error('Số dư không đủ'), { status: 400 });
    }

    // Atomic: create slip + deduct balance + record transaction
    const slip = await this.prisma.$transaction(async (tx) => {
      const created = await tx.betSlip.create({
        data: {
          userId,
          type,
          stake:        stakeNum,
          potentialWin: potential,
          totalOdds:    oddsNum,
          status:       'pending',
        },
      });

      await tx.betSlipItem.create({
        data: {
          slipId:    created.id,
          marketId,
          selection,
          label:     oddsRow.label,
          oddsValue: oddsNum,
          handicap:  oddsRow.handicap  ?? null,
          lineValue: oddsRow.lineValue ?? null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data:  { balance: { decrement: stakeNum } },
      });

      await tx.transaction.create({
        data: {
          userId,
          type:          'bet',
          amount:        -stakeNum,
          balanceBefore: balBefore,
          balanceAfter:  balBefore - stakeNum,
          referenceId:   created.id,
          referenceType: 'bet_slip',
          note:          `Cá cược ${market.name} – ${selection}`,
        },
      });

      return created;
    });

    logger.info(`[BettingService] User ${userId} placed slip ${slip.id} on market ${marketId}`);
    return { slip, item: { marketId, selection, oddsValue: oddsNum } };
  }

  /**
   * Admin: settle all pending slip items for a market.
   * Winners credited; market marked settled.
   */
  async settleBets(marketId, result) {
    const market = await this.prisma.betMarket.findUnique({ where: { id: marketId } });
    if (!market) throw Object.assign(new Error('Market not found'), { status: 404 });
    if (market.status === 'settled') throw Object.assign(new Error('Market đã được settle'), { status: 400 });

    const items = await this.prisma.betSlipItem.findMany({
      where:   { marketId, result: 'pending' },
      include: { slip: true },
    });

    let settledCount = 0;
    for (const item of items) {
      const won     = item.selection === result;
      const itemRes = won ? 'win' : 'lose';
      const payout  = won ? parseFloat(item.slip.stake) * parseFloat(item.oddsValue) : 0;

      await this.prisma.$transaction(async (tx) => {
        await tx.betSlipItem.update({
          where: { id: item.id },
          data:  { result: itemRes, settledAt: new Date() },
        });
        await tx.betSlip.update({
          where: { id: item.slip.id },
          data:  { status: won ? 'won' : 'lost', actualPayout: payout, settledAt: new Date() },
        });

        if (won) {
          const user = await tx.user.findUnique({ where: { id: item.slip.userId }, select: { balance: true } });
          const bal  = parseFloat(user.balance);
          await tx.user.update({ where: { id: item.slip.userId }, data: { balance: { increment: payout } } });
          await tx.transaction.create({
            data: {
              userId:        item.slip.userId,
              type:          'win',
              amount:        payout,
              balanceBefore: bal,
              balanceAfter:  bal + payout,
              referenceId:   item.slip.id,
              referenceType: 'bet_slip',
              note:          `Thắng cược – ${result}`,
            },
          });
        }
      });

      settledCount++;
    }

    await this.prisma.betMarket.update({ where: { id: marketId }, data: { status: 'settled', result } });
    logger.info(`[BettingService] Settled ${settledCount} items on market ${marketId} result="${result}"`);
    return { settled: settledCount };
  }
}

module.exports = BettingService;
