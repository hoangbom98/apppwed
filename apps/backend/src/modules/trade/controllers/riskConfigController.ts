// @ts-nocheck
'use strict';
/**
 * riskConfigController — per-symbol risk parameters (replaces lc_risk)
 * Admin-only routes: /trade/admin/risk
 */
const { success, error, notFound } = require('../../../shared/utils/network/response');

// GET /trade/admin/risk
exports.listAll = async (req, res) => {
  try {
    const configs = await req.prisma.riskConfig.findMany({
      include: { symbol: { select: { code: true, name: true } } },
    });
    return success(res, configs);
  } catch (e: any) { return error(res, e.message, 500); }
};

// GET /trade/admin/risk/:symbolId
exports.getBySymbol = async (req, res) => {
  try {
    const config = await req.prisma.riskConfig.findUnique({
      where:   { symbolId: req.params.symbolId },
      include: { symbol: { select: { code: true, name: true } } },
    });
    if (!config) return notFound(res, 'Cấu hình rủi ro chưa được thiết lập cho symbol này');
    return success(res, config);
  } catch (e: any) { return error(res, e.message, 500); }
};

// PUT /trade/admin/risk/:symbolId  (upsert)
exports.upsert = async (req, res) => {
  try {
    const { symbolId } = req.params;
    const { qybl, qkbl, maxPositionAmt, marginCallRate } = req.body;

    // Verify symbol exists
    const symbol = await req.prisma.symbol.findUnique({ where: { id: symbolId } });
    if (!symbol) return notFound(res, 'Symbol không tồn tại');

    const config = await req.prisma.riskConfig.upsert({
      where:  { symbolId },
      update: {
        ...(qybl            !== undefined && { qybl:            parseFloat(qybl) }),
        ...(qkbl            !== undefined && { qkbl:            parseFloat(qkbl) }),
        ...(maxPositionAmt  !== undefined && { maxPositionAmt:  parseFloat(maxPositionAmt) }),
        ...(marginCallRate  !== undefined && { marginCallRate:  parseFloat(marginCallRate) }),
      },
      create: {
        symbolId,
        qybl:           parseFloat(qybl           || 0),
        qkbl:           parseFloat(qkbl           || 0),
        maxPositionAmt: parseFloat(maxPositionAmt || 0),
        marginCallRate: parseFloat(marginCallRate || 0.1),
      },
    });
    return success(res, config, 'Đã cập nhật cấu hình rủi ro');
  } catch (e: any) { return error(res, e.message, 500); }
};

// Admin override position close price (gaipingcang)
// PATCH /trade/admin/positions/:id/close-price
exports.adminOverrideClosePrice = async (req, res) => {
  try {
    const { closePrice, note } = req.body;
    if (!closePrice) return error(res, 'closePrice là bắt buộc', 400);

    const pos = await req.prisma.position.findUnique({ where: { id: req.params.id } });
    if (!pos) return notFound(res, 'Vị thế không tồn tại');
    if (pos.status !== 'open') return error(res, 'Vị thế đã đóng', 400);

    const closedPriceNum = parseFloat(closePrice);
    const pnl = pos.side === 'long'
      ? (closedPriceNum - parseFloat(pos.entryPrice)) * parseFloat(pos.quantity)
      : (parseFloat(pos.entryPrice) - closedPriceNum) * parseFloat(pos.quantity);

    const updated = await req.prisma.position.update({
      where: { id: req.params.id },
      data:  { status: 'closed', closedPrice: closedPriceNum, closedAt: new Date(), pnl, note: note || null },
    });

    return success(res, updated, 'Đã cập nhật giá đóng vị thế');
  } catch (e: any) { return error(res, e.message, 500); }
};
