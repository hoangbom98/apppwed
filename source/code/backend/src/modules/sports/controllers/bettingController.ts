// @ts-nocheck
'use strict';
/**
 * sports/controllers/bettingController.js
 * Models match prisma/sports/schema.prisma exactly:
 *   BetMarket (@@map "bet_markets"), BetOdds (@@map "bet_odds"),
 *   BetSlip  (@@map "bet_slips"),   BetSlipItem (@@map "bet_slip_items")
 */
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const notifSvc = require('../../../shared/services/notificationService');

// ── GET /api/sports/betting/events — markets grouped by match ────────────────
exports.getEvents = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status)  where.status  = req.query.status;
    if (req.query.matchId) where.matchId = req.query.matchId;

    const [data, total] = await Promise.all([
      req.prisma.betMarket.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
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
      req.prisma.betMarket.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/sports/betting/events/:id ───────────────────────────────────────
exports.getEvent = async (req, res) => {
  try {
    const item = await req.prisma.betMarket.findUnique({
      where: { id: req.params.id },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league:   true,
          },
        },
        odds: { orderBy: { selection: 'asc' } },
      },
    });
    if (!item) return notFound(res);
    return success(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/sports/betting/markets/:eventId — odds for a market ──────────────
exports.getMarkets = async (req, res) => {
  try {
    const data = await req.prisma.betOdds.findMany({
      where:   { marketId: req.params.eventId, status: 'active' },
      orderBy: { selection: 'asc' },
    });
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /api/sports/betting/bets — place a bet ───────────────────────────────
exports.placeBet = async (req, res) => {
  try {
    const { marketId, selection, oddsValue, stake, type = 'single' } = req.body;
    if (!marketId || !selection || !oddsValue || !stake || parseFloat(stake) <= 0) {
      return error(res, 'Thiếu thông tin: marketId, selection, oddsValue, stake', 400);
    }

    // Validate market is open
    const market = await req.prisma.betMarket.findUnique({
      where:   { id: marketId },
      include: { match: true },
    });
    if (!market)                       return error(res, 'Thị trường không tồn tại', 404);
    if (market.status !== 'open')      return error(res, 'Thị trường đã đóng', 400);
    if (market.match.status === 'finished') return error(res, 'Trận đấu đã kết thúc', 400);
    if (market.closesAt && new Date() > market.closesAt) return error(res, 'Hết hạn đặt cược', 400);

    // Validate odds selection exists
    const oddsRow = await req.prisma.betOdds.findFirst({
      where: { marketId, selection, status: 'active' },
    });
    if (!oddsRow) return error(res, 'Lựa chọn không hợp lệ', 400);

    // Check balance — sports schema has NO Wallet model; balance lives on User directly
    const bettor = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { balance: true },
    });
    if (!bettor || parseFloat(bettor.balance) < parseFloat(stake)) {
      return error(res, 'Số dư không đủ', 400);
    }

    const stakeNum  = parseFloat(stake);
    const oddsNum   = parseFloat(oddsValue);
    const potential = parseFloat((stakeNum * oddsNum).toFixed(2));
    const balanceBefore = parseFloat(bettor.balance);
    const balanceAfter  = parseFloat((balanceBefore - stakeNum).toFixed(2));

    // Create slip + item + deduct user.balance atomically
    const [slip] = await req.prisma.$transaction([
      req.prisma.betSlip.create({
        data: {
          userId:       req.user.id,
          type,
          stake:        stakeNum,
          potentialWin: potential,
          totalOdds:    oddsNum,
          status:       'pending',
        },
      }),
      // Deduct from User.balance directly (no Wallet model in sports schema)
      req.prisma.user.update({
        where: { id: req.user.id },
        data:  { balance: { decrement: stakeNum }, totalBet: { increment: stakeNum } },
      }),
    ]);

    // Add slip item
    await req.prisma.betSlipItem.create({
      data: {
        slipId:    slip.id,
        marketId,
        selection,
        label:     oddsRow.label,
        oddsValue: oddsNum,
        handicap:  oddsRow.handicap  ?? null,
        lineValue: oddsRow.lineValue ?? null,
      },
    });

    // Record transaction (sports Transaction has balanceBefore + balanceAfter)
    await req.prisma.transaction.create({
      data: {
        userId:        req.user.id,
        amount:        -stakeNum,
        type:          'bet',
        referenceId:   slip.id,
        referenceType: 'bet_slip',
        note:          `Cá cược ${market.name} – ${selection}`,
        balanceBefore,
        balanceAfter,
      },
    });

    return created(res, { slip, item: { marketId, selection, oddsValue: oddsNum } }, 'Đặt cược thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/sports/betting/my-bets ──────────────────────────────────────────
exports.getMyBets = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await Promise.all([
      req.prisma.betSlip.findMany({
        where, skip, take,
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
      req.prisma.betSlip.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/sports/betting/bets/:id ─────────────────────────────────────────
exports.getBetById = async (req, res) => {
  try {
    const slip = await req.prisma.betSlip.findFirst({
      where:   { id: req.params.id, userId: req.user.id },
      include: { items: { include: { market: { include: { match: true } } } } },
    });
    if (!slip) return notFound(res);
    return success(res, slip);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /api/sports/betting/admin/settle — settle all bets for a market ──────
exports.settleBets = async (req, res) => {
  try {
    const { marketId, result } = req.body;
    if (!marketId || !result) return error(res, 'marketId và result là bắt buộc', 400);

    const market = await req.prisma.betMarket.findUnique({ where: { id: marketId } });
    if (!market) return notFound(res, 'Market không tồn tại');
    if (market.status === 'settled') return error(res, 'Market đã được settle', 400);

    // Get all pending slip items for this market
    const items = await req.prisma.betSlipItem.findMany({
      where:   { marketId, result: 'pending' },
      include: { slip: true },
    });

    let settledCount = 0;
    for (const item of items) {
      const won       = item.selection === result;
      const itemResult = won ? 'win' : 'lose';
      const payout    = won ? parseFloat(item.slip.stake) * parseFloat(item.oddsValue) : 0;

      // Fetch current balance for accurate transaction records
      const winnerUser = won ? await req.prisma.user.findUnique({
        where:  { id: item.slip.userId },
        select: { balance: true },
      }) : null;
      const winBalanceBefore = won ? parseFloat(winnerUser.balance) : 0;
      const winBalanceAfter  = won ? parseFloat((winBalanceBefore + payout).toFixed(2)) : 0;

      await req.prisma.$transaction([
        req.prisma.betSlipItem.update({
          where: { id: item.id },
          data:  { result: itemResult, settledAt: new Date() },
        }),
        req.prisma.betSlip.update({
          where: { id: item.slip.id },
          data:  {
            status:       itemResult === 'win' ? 'won' : 'lost',
            actualPayout: payout,
            settledAt:    new Date(),
          },
        }),
        ...(won ? [
          // Credit User.balance directly — no Wallet model in sports schema
          req.prisma.user.update({
            where: { id: item.slip.userId },
            data:  { balance: { increment: payout }, totalWin: { increment: payout } },
          }),
          req.prisma.transaction.create({
            data: {
              userId:        item.slip.userId,
              amount:        payout,
              type:          'bet_win',
              referenceId:   item.slip.id,
              referenceType: 'bet_slip',
              note:          `Thắng cược – ${result}`,
              balanceBefore: winBalanceBefore,
              balanceAfter:  winBalanceAfter,
            },
          }),
        ] : []),
      ]);

      // Push win notification
      if (won) {
        notifSvc.sendToUser(item.slip.userId, 'notification', {
          title:   'Chúc mừng! Bạn thắng cược',
          content: `Bạn thắng ${payout.toLocaleString('vi-VN')} VND từ cược ${market.name}`,
        });
      }
      settledCount++;
    }

    // Mark market as settled
    await req.prisma.betMarket.update({
      where: { id: marketId },
      data:  { status: 'settled', result },
    });

    return success(res, { settled: settledCount }, `Đã settle ${settledCount} cược`);
  } catch (e) { return error(res, e.message, 500); }
};
