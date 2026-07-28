// @ts-nocheck
'use strict';
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

// ── GET /trade/positions  — open positions ─────────────────────────────────────
exports.getPositions = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    else where.status = 'open';
    const [data, total] = await Promise.all([
      req.prisma.position.findMany({
        where,
        skip, take,
        orderBy: { createdAt: 'desc' },
        include: { symbol: { select: { code: true, name: true, baseAsset: true, quoteAsset: true } } },
      }),
      req.prisma.position.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/positions/:id ───────────────────────────────────────────────────
exports.getPositionById = async (req, res) => {
  try {
    const position = await req.prisma.position.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { symbol: true },
    });
    if (!position) return notFound(res);
    return success(res, position);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /trade/positions/:id/close  — close a position ───────────────────────
exports.closePosition = async (req, res) => {
  try {
    const position = await req.prisma.position.findFirst({
      where: { id: req.params.id, userId: req.user.id, status: 'open' },
      include: { symbol: true },
    });
    if (!position) return notFound(res, 'Vị thế không tồn tại hoặc đã đóng');

    const closedPrice = parseFloat(req.body.price || position.currentPrice);
    const qty         = parseFloat(position.quantity);
    const entryPrice  = parseFloat(position.entryPrice);
    const leverage    = position.leverage || 1;

    const pnl = position.side === 'long'
      ? (closedPrice - entryPrice) * qty * leverage
      : (entryPrice - closedPrice) * qty * leverage;

    // Update wallet
    const wallet = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    const margin  = parseFloat(position.margin);
    const newBalance = parseFloat(wallet.balance) + margin + pnl;
    const newFrozen  = Math.max(0, parseFloat(wallet.frozen) - margin);

    await req.prisma.$transaction([
      req.prisma.position.update({
        where: { id: position.id },
        data: {
          status:      'closed',
          closedPrice,
          pnl,
          pnlPercent:  entryPrice > 0 ? (pnl / (entryPrice * qty)) * 100 : 0,
          closedAt:    new Date(),
        },
      }),
      req.prisma.wallet.update({
        where: { id: wallet.id },
        data:  { balance: newBalance, frozen: newFrozen },
      }),
      req.prisma.transaction.create({
        data: {
          userId:        req.user.id,
          amount:        pnl,
          type:          'trade_close',
          referenceId:   position.id,
          referenceType: 'position',
          balanceAfter:  newBalance,
          note:          `Đóng ${position.side} ${position.symbol.code} tại ${closedPrice}`,
        },
      }),
    ]);
    return success(res, { pnl, closedPrice }, 'Đóng vị thế thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/portfolio  — portfolio summary ──────────────────────────────────
exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    const [wallet, positions, orders, transactions] = await Promise.all([
      req.prisma.wallet.findUnique({ where: { userId } }),
      req.prisma.position.findMany({ where: { userId, status: 'open' }, include: { symbol: true } }),
      req.prisma.order.findMany({
        where: { userId, status: { in: ['pending', 'partial'] } },
        include: { symbol: true },
      }),
      req.prisma.transaction.aggregate({
        where:  { userId },
        _sum:   { amount: true },
        _count: { id: true },
      }),
    ]);

    // Calculate total unrealised PnL
    const unrealisedPnl = positions.reduce((sum, p) => {
      const qty   = parseFloat(p.quantity);
      const entry = parseFloat(p.entryPrice);
      const curr  = parseFloat(p.currentPrice);
      const lev   = p.leverage || 1;
      const pnl   = p.side === 'long'
        ? (curr - entry) * qty * lev
        : (entry - curr) * qty * lev;
      return sum + pnl;
    }, 0);

    return success(res, {
      balance:       parseFloat(wallet?.balance ?? 0),
      frozen:        parseFloat(wallet?.frozen  ?? 0),
      currency:      wallet?.currency ?? 'USD',
      openPositions: positions.length,
      openOrders:    orders.length,
      unrealisedPnl: Math.round(unrealisedPnl * 100) / 100,
      totalTxns:     transactions._count.id,
      positions,
      orders,
    });
  } catch (e) { return error(res, e.message, 500); }
};
