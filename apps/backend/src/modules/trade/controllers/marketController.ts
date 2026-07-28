// @ts-nocheck
'use strict';
/**
 * trade/controllers/marketController.js
 * Uses Prisma models: Symbol (table: symbols), PriceHistory (table: price_history)
 * All model names match prisma/trade/schema.prisma exactly.
 */
const { success, error, notFound } = require('../../../shared/utils/network/response');

// ── GET /api/trade/pairs — list all trading symbols ──────────────────────────
exports.getPairs = async (req, res) => {
  try {
    const { status = 'active', search } = req.query;
    const where = { status };
    if (search) {
      where.OR = [
        { code: { contains: search.toUpperCase() } },
        { name: { contains: search } },
      ];
    }
    const pairs = await req.prisma.symbol.findMany({
      where,
      include: { market: { select: { code: true, name: true, type: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    // Attach latest price from price_history for each symbol
    const enriched = await Promise.all(pairs.map(async (sym) => {
      const latest = await req.prisma.priceHistory.findFirst({
        where: { symbolId: sym.id, interval: '1m' },
        orderBy: { timestamp: 'desc' },
      });
      return {
        ...sym,
        lastPrice:   latest?.price   ?? null,
        change24h:   latest ? computeChange(sym.id, req.prisma) : null,
        high24h:     latest?.high    ?? null,
        low24h:      latest?.low     ?? null,
        volume24h:   latest?.volume  ?? null,
      };
    }));
    return success(res, enriched);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/trade/pairs/:symbol — single symbol ──────────────────────────────
exports.getPairBySymbol = async (req, res) => {
  try {
    const sym = await req.prisma.symbol.findUnique({
      where: { code: req.params.symbol.toUpperCase() },
      include: { market: true },
    });
    if (!sym) return notFound(res);

    // Latest price bar
    const latest = await req.prisma.priceHistory.findFirst({
      where: { symbolId: sym.id, interval: '1m' },
      orderBy: { timestamp: 'desc' },
    });
    return success(res, { ...sym, lastPrice: latest?.price ?? null, latestBar: latest ?? null });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/trade/pairs/:symbol/orderbook — live orderbook from open orders ──
exports.getOrderbook = async (req, res) => {
  try {
    const sym = await req.prisma.symbol.findUnique({ where: { code: req.params.symbol.toUpperCase() } });
    if (!sym) return notFound(res);

    const [bids, asks] = await Promise.all([
      req.prisma.order.findMany({
        where: { symbolId: sym.id, side: 'buy', status: { in: ['pending', 'partial'] } },
        orderBy: { price: 'desc' },
        take: 20,
        select: { price: true, quantity: true, executedQty: true },
      }),
      req.prisma.order.findMany({
        where: { symbolId: sym.id, side: 'sell', status: { in: ['pending', 'partial'] } },
        orderBy: { price: 'asc' },
        take: 20,
        select: { price: true, quantity: true, executedQty: true },
      }),
    ]);

    const aggregate = (orders) => {
      const map = {};
      for (const o of orders) {
        const remaining = parseFloat(o.quantity) - parseFloat(o.executedQty || 0);
        if (remaining <= 0) continue;
        const priceKey = parseFloat(o.price).toFixed(8);
        map[priceKey] = (map[priceKey] || 0) + remaining;
      }
      return Object.entries(map).map(([price, qty]) => ({ price: parseFloat(price), quantity: parseFloat(qty.toFixed(8)) }));
    };

    return success(res, { symbol: sym.code, bids: aggregate(bids), asks: aggregate(asks) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/trade/pairs/:symbol/trades — recent filled orders ────────────────
exports.getRecentTrades = async (req, res) => {
  try {
    const sym = await req.prisma.symbol.findUnique({ where: { code: req.params.symbol.toUpperCase() } });
    if (!sym) return notFound(res);

    const trades = await req.prisma.order.findMany({
      where:   { symbolId: sym.id, status: 'filled' },
      orderBy: { filledAt: 'desc' },
      take:    50,
      select:  { price: true, quantity: true, side: true, filledAt: true },
    });
    return success(res, trades);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /api/trade/pairs/:symbol/history?interval=1m — OHLCV bars ─────────────
exports.getPriceHistory = async (req, res) => {
  try {
    const { interval = '1m', limit = 200 } = req.query;
    const sym = await req.prisma.symbol.findUnique({ where: { code: req.params.symbol.toUpperCase() } });
    if (!sym) return notFound(res);

    const bars = await req.prisma.priceHistory.findMany({
      where:   { symbolId: sym.id, interval },
      orderBy: { timestamp: 'desc' },
      take:    parseInt(limit, 10),
    });
    return success(res, bars.reverse()); // oldest-first for chart rendering
  } catch (e) { return error(res, e.message, 500); }
};

// ── Internal helper ───────────────────────────────────────────────────────────
async function computeChange(symbolId, prisma) {
  try {
    const ago24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [latest, old] = await Promise.all([
      prisma.priceHistory.findFirst({ where: { symbolId, interval: '1m' }, orderBy: { timestamp: 'desc' } }),
      prisma.priceHistory.findFirst({ where: { symbolId, interval: '1m', timestamp: { lte: ago24h } }, orderBy: { timestamp: 'desc' } }),
    ]);
    if (!latest || !old) return null;
    const change = ((parseFloat(latest.price) - parseFloat(old.price)) / parseFloat(old.price)) * 100;
    return parseFloat(change.toFixed(2));
  } catch { return null; }
}
