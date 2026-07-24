// @ts-nocheck
'use strict';
/**
 * watchlistController — User symbol watchlists
 *
 * User: GET /trade/watchlists, POST /trade/watchlists, DELETE /trade/watchlists/:id
 *       POST /trade/watchlists/:id/items, DELETE /trade/watchlists/:watchlistId/items/:symbolId
 */
const { success, created, error, notFound } = require('../../../shared/utils/response');

// ── GET /trade/watchlists ─────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const lists = await req.prisma.watchlist.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: { symbol: { select: { id: true, code: true, name: true, baseAsset: true, quoteAsset: true, status: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return success(res, lists);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /trade/watchlists ────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'name là bắt buộc', 400);
    const list = await req.prisma.watchlist.create({
      data: { userId: req.user.id, name },
    });
    return created(res, list, 'Đã tạo danh sách theo dõi');
  } catch (e) { return error(res, e.message, 500); }
};

// ── DELETE /trade/watchlists/:id ──────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const list = await req.prisma.watchlist.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!list) return notFound(res, 'Danh sách không tồn tại');
    await req.prisma.watchlistItem.deleteMany({ where: { watchlistId: list.id } });
    await req.prisma.watchlist.delete({ where: { id: list.id } });
    return success(res, null, 'Đã xóa danh sách theo dõi');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /trade/watchlists/:id/items — add a symbol ──────────────────────────
exports.addItem = async (req, res) => {
  try {
    const { symbolId, symbolCode } = req.body;
    if (!symbolId && !symbolCode) return error(res, 'symbolId hoặc symbolCode là bắt buộc', 400);

    const list = await req.prisma.watchlist.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!list) return notFound(res, 'Danh sách không tồn tại');

    // Resolve symbol
    let sym;
    if (symbolId) {
      sym = await req.prisma.symbol.findUnique({ where: { id: symbolId } });
    } else {
      sym = await req.prisma.symbol.findUnique({ where: { code: String(symbolCode).toUpperCase() } });
    }
    if (!sym) return notFound(res, 'Symbol không tồn tại');

    // Count current items for sort order
    const count = await req.prisma.watchlistItem.count({ where: { watchlistId: list.id } });

    const item = await req.prisma.watchlistItem.upsert({
      where:  { watchlistId_symbolId: { watchlistId: list.id, symbolId: sym.id } },
      create: { watchlistId: list.id, symbolId: sym.id, sortOrder: count },
      update: {},
    });
    return created(res, item, 'Đã thêm vào danh sách theo dõi');
  } catch (e) { return error(res, e.message, 500); }
};

// ── DELETE /trade/watchlists/:watchlistId/items/:symbolId ─────────────────────
exports.removeItem = async (req, res) => {
  try {
    const list = await req.prisma.watchlist.findFirst({
      where: { id: req.params.watchlistId, userId: req.user.id },
    });
    if (!list) return notFound(res, 'Danh sách không tồn tại');

    await req.prisma.watchlistItem.deleteMany({
      where: { watchlistId: list.id, symbolId: req.params.symbolId },
    });
    return success(res, null, 'Đã xóa khỏi danh sách theo dõi');
  } catch (e) { return error(res, e.message, 500); }
};
