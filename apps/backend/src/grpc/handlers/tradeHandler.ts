// @ts-nocheck
'use strict';
/**
 * apps/backend/src/grpc/handlers/tradeHandler.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * gRPC service implementation for TradeService (proto/trade.proto).
 *
 * WatchPrices  — Server Streaming.  Subscribes to PriceBroadcaster events and
 *                pushes updates to the client. Replaces the 30s REST polling
 *                pattern from marketPriceFeed.ts.
 *
 * PlaceOrder   — Unary.  Reuses the same DB logic as orderController.ts but
 *                with built-in gRPC deadline enforcement (no extra timeout code).
 *
 * CancelOrder  — Unary.  Mirrors orderController.cancelOrder.
 *
 * GetPairs     — Unary.  Returns active symbols (public, no auth required).
 *
 * GetWallet    — Unary.  Returns user wallet balances (auth required).
 */
const grpc            = require('@grpc/grpc-js');
const PriceBroadcaster = require('../broadcasters/PriceBroadcaster');
const { getUserFromCall } = require('../interceptors/authInterceptor');
const { getPrismaClient } = require('../../config/databases');
const logger = require('../../shared/services/core/logger');
const OrderMatchingService = require('../../modules/trade/services/orderMatchingService');

// ── WatchPrices — Server Streaming ───────────────────────────────────────────

/**
 * Streams live price updates to the gRPC client.
 * @param {import('@grpc/grpc-js').ServerWritableStream} call
 */
function watchPrices(call) {
  const requestedSymbols = new Set(
    (call.request.symbols || []).map((s) => s.toUpperCase()),
  );

  // Send all currently cached prices immediately on connect
  // (subscribers don't have to wait for the next 30s tick)
  const prisma = getPrismaClient('trade');
  prisma.symbol
    .findMany({ where: { status: 'active' }, select: { code: true } })
    .then(async (symbols) => {
      const codes = symbols
        .filter((s) => !requestedSymbols.size || requestedSymbols.has(s.code))
        .map((s) => s.code);

      // Fetch the most recent price for each symbol
      const latestPrices = await Promise.all(
        codes.map((code) =>
          prisma.symbol
            .findUnique({
              where:   { code },
              include: {
                priceHistory: {
                  orderBy: { timestamp: 'desc' },
                  take:    1,
                },
              },
            })
            .catch(() => null),
        ),
      );

      for (const sym of latestPrices) {
        if (!sym || call.cancelled) break;
        const ph = sym.priceHistory?.[0];
        if (!ph) continue;
        try {
          call.write({
            symbol:      sym.code,
            last_price:  parseFloat(ph.price),
            change_24h:  0,
            volume_24h:  parseFloat(ph.volume || 0),
            high_24h:    parseFloat(ph.high   || 0),
            low_24h:     parseFloat(ph.low    || 0),
            timestamp_ms: ph.timestamp ? ph.timestamp.getTime() : Date.now(),
          });
        } catch { /* client disconnected */ }
      }
    })
    .catch((err) => logger.warn('[gRPC Trade] WatchPrices initial fetch failed:', err.message));

  // Subscribe to live updates from PriceBroadcaster
  function onPriceUpdate(update) {
    if (call.cancelled) return;
    // Filter by requested symbols if specified
    if (requestedSymbols.size && !requestedSymbols.has(update.symbol?.toUpperCase())) return;
    try {
      call.write({
        symbol:      update.symbol,
        last_price:  update.lastPrice   || 0,
        change_24h:  update.priceChange || update.change24h || 0,
        volume_24h:  update.volume24h   || 0,
        high_24h:    update.high24h     || 0,
        low_24h:     update.low24h      || 0,
        timestamp_ms: Date.now(),
      });
    } catch { /* client disconnected */ }
  }

  PriceBroadcaster.on('price:update', onPriceUpdate);

  // Clean up when client disconnects or stream is cancelled
  call.on('cancelled', () => {
    PriceBroadcaster.off('price:update', onPriceUpdate);
  });
  call.on('error', () => {
    PriceBroadcaster.off('price:update', onPriceUpdate);
  });
  call.on('close', () => {
    PriceBroadcaster.off('price:update', onPriceUpdate);
  });
}

// ── PlaceOrder — Unary ────────────────────────────────────────────────────────

async function placeOrder(call, callback) {
  const user = getUserFromCall(call);
  if (!user) {
    return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });
  }

  const { symbol: symbolCode, type, side, price, quantity, leverage = 1, stop_price } = call.request;
  if (!symbolCode || !type || !side || !quantity || quantity <= 0) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'symbol, type, side, quantity required' });
  }
  if (type !== 'market' && (!price || price <= 0)) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'price required for limit orders' });
  }

  try {
    const prisma = getPrismaClient('trade');

    // Check user status
    const userRec = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { tradingFrozen: true, status: true },
    });
    if (!userRec || userRec.status !== 'active') {
      return callback({ code: grpc.status.PERMISSION_DENIED, message: 'Account locked' });
    }
    if (userRec.tradingFrozen) {
      return callback({ code: grpc.status.PERMISSION_DENIED, message: 'Trading frozen' });
    }

    // Resolve symbol
    const code = String(symbolCode).replace('/', '').toUpperCase();
    const symbol = await prisma.symbol.findUnique({ where: { code } });
    if (!symbol || symbol.status !== 'active') {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Symbol not available' });
    }

    // Get effective price for market orders
    const effectivePrice = price || await prisma.priceHistory.findFirst({
      where:   { symbolId: symbol.id, interval: '1m' },
      orderBy: { timestamp: 'desc' },
    }).then((ph) => (ph ? parseFloat(ph.price) : 0));

    // Freeze margin for buy orders
    if (side === 'buy') {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet) return callback({ code: grpc.status.NOT_FOUND, message: 'No trading wallet' });
      const totalCost = (effectivePrice * quantity) / (leverage || 1);
      const available = parseFloat(wallet.balance) - parseFloat(wallet.frozen);
      if (available < totalCost) {
        return callback({ code: grpc.status.RESOURCE_EXHAUSTED, message: 'Insufficient balance' });
      }
      await prisma.wallet.update({
        where: { id: wallet.id },
        data:  { frozen: { increment: totalCost } },
      });
    }

    const order = await prisma.order.create({
      data: {
        userId:    user.id,
        symbolId:  symbol.id,
        type,
        side,
        price:     effectivePrice,
        quantity:  parseFloat(quantity),
        leverage:  parseInt(leverage, 10),
        ...(stop_price && { stopPrice: parseFloat(stop_price) }),
        status:    'pending',
      },
    });

    // Run matching asynchronously (fire-and-forget)
    const matcher = new OrderMatchingService(prisma, null);
    matcher.match(order).catch(() => {});

    callback(null, {
      order_id:   order.id,
      status:     order.status,
      symbol:     symbol.code,
      side:       order.side,
      price:      parseFloat(order.price),
      quantity:   parseFloat(order.quantity),
      created_at: order.createdAt?.toISOString() || new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[gRPC Trade] placeOrder error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ── CancelOrder — Unary ───────────────────────────────────────────────────────

async function cancelOrder(call, callback) {
  const user = getUserFromCall(call);
  if (!user) return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });

  const { order_id } = call.request;
  if (!order_id) return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'order_id required' });

  try {
    const prisma = getPrismaClient('trade');
    const order = await prisma.order.findFirst({ where: { id: order_id, userId: user.id } });
    if (!order) return callback({ code: grpc.status.NOT_FOUND, message: 'Order not found' });
    if (!['pending', 'partial'].includes(order.status)) {
      return callback({ code: grpc.status.FAILED_PRECONDITION, message: 'Order already processed' });
    }
    await prisma.order.update({ where: { id: order.id }, data: { status: 'cancelled' } });
    callback(null, { success: true, message: 'Order cancelled' });
  } catch (err) {
    logger.error('[gRPC Trade] cancelOrder error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ── GetPairs — Unary (public) ─────────────────────────────────────────────────

async function getPairs(call, callback) {
  const { page = 1, limit = 50 } = call.request;
  try {
    const prisma = getPrismaClient('trade');
    const [symbols, total] = await Promise.all([
      prisma.symbol.findMany({
        where:   { status: 'active' },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { code: 'asc' },
        select:  { id: true, code: true, name: true, baseAsset: true, quoteAsset: true, status: true },
      }),
      prisma.symbol.count({ where: { status: 'active' } }),
    ]);
    callback(null, {
      symbols: symbols.map((s) => ({
        id:          String(s.id),
        code:        s.code,
        name:        s.name || s.code,
        base_asset:  s.baseAsset || '',
        quote_asset: s.quoteAsset || '',
        status:      s.status,
      })),
      total,
    });
  } catch (err) {
    logger.error('[gRPC Trade] getPairs error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ── GetWallet — Unary (auth) ──────────────────────────────────────────────────

async function getWallet(call, callback) {
  const user = getUserFromCall(call);
  if (!user) return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });

  try {
    const prisma = getPrismaClient('trade');
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) return callback(null, { balances: [] });

    const balance  = parseFloat(wallet.balance);
    const frozen   = parseFloat(wallet.frozen   || 0);
    callback(null, {
      balances: [{
        currency:  wallet.currency || 'USDT',
        balance,
        frozen,
        available: balance - frozen,
      }],
    });
  } catch (err) {
    logger.error('[gRPC Trade] getWallet error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

module.exports = { watchPrices, placeOrder, cancelOrder, getPairs, getWallet };
