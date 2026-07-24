// @ts-nocheck
'use strict';
/**
 * game/controllers/lotteryController.js
 * Lottery draw management.
 * DB models: LotteryType, LotteryDraw, LotteryBet (all CUID string IDs)
 */
const { success, error, notFound, created } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const missionSvc = require('../services/missionService');

// Prisma accessors on req.prisma
const lDraw = (req) => req.prisma.lotteryDraw;
const lBet  = (req) => req.prisma.lotteryBet;
const lType = (req) => req.prisma.lotteryType;

exports.getTypes = async (req, res) => {
  try {
    const types = await req.prisma.lotteryType.findMany({ where: { status: 'active' } });
    return success(res, types);
  } catch (e) { return error(res, e.message, 500); }
};

exports.getDraws = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, take } = paginate(page, limit);
    const where = {};
    if (req.query.typeId) where.typeId = req.query.typeId;   // CUID string
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await Promise.all([
      lDraw(req).findMany({ where, skip, take, orderBy: { drawTime: 'desc' } }),
      lDraw(req).count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /lottery/draws/current/:typeId
 * Returns the current open draw for a lottery type.
 */
exports.getCurrentDraw = async (req, res) => {
  try {
    const typeId = req.params.typeId;            // CUID string
    const draw = await lDraw(req).findFirst({
      where:   { typeId, isClosed: false, status: 'PENDING' },
      orderBy: { drawTime: 'asc' },
    });
    if (!draw) return notFound(res, 'Không có kỳ quay nào đang mở');
    return success(res, draw);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /lottery/draws/:id/result
 * Returns result for a specific draw.
 */
exports.getResult = async (req, res) => {
  try {
    const draw = await lDraw(req).findUnique({ where: { id: req.params.id } });
    if (!draw) return notFound(res);
    if (!draw.resultOfficial) return error(res, 'Kỳ quay chưa có kết quả', 404);
    return success(res, { result: draw.resultOfficial, drawTime: draw.drawTime, status: draw.status });
  } catch (e) { return error(res, e.message, 500); }
};

exports.placeBet = async (req, res) => {
  try {
    const { drawId, typeId, betType, betChoice, amount } = req.body;
    if (!drawId || !betType || !betChoice || !amount || Number(amount) <= 0) {
      return error(res, 'Thông tin đặt cược không hợp lệ', 400);
    }
    const drawObj = await lDraw(req).findUnique({ where: { id: drawId } });
    if (!drawObj) return notFound(res, 'Kỳ quay không tồn tại');
    if (drawObj.isClosed) return error(res, 'Kỳ quay đã đóng', 400);

    const newBet = await lBet(req).create({
      data: { userId: req.user.id, drawId, typeId: typeId || drawObj.typeId, betType, betChoice, amount: Number(amount) },
    });
    // Fire-and-forget: advance BET + LOTTERY mission progress
    missionSvc.incrementProgress(req.user.id, 'BET',     1, req.prisma);
    missionSvc.incrementProgress(req.user.id, 'LOTTERY', 1, req.prisma);
    return created(res, newBet, 'Đặt cược thành công');
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /lottery/my-bets
 */
exports.getMyBets = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      lBet(req).findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { draw: true } }),
      lBet(req).count({ where }),
    ]);
    return success(res, { data, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /lottery/admin/draws  (admin only)
 * Create a new lottery draw.
 */
exports.createDraw = async (req, res) => {
  try {
    const { typeId, drawTime } = req.body;
    if (!typeId || !drawTime) return error(res, 'typeId và drawTime là bắt buộc', 400);

    const type = await lType(req).findUnique({ where: { id: typeId } });
    if (!type) return notFound(res, 'Loại xổ số không tồn tại');

    const draw = await lDraw(req).create({
      data: { typeId, drawTime: new Date(drawTime), status: 'PENDING', isClosed: false },
    });
    return created(res, draw, 'Tạo kỳ quay thành công');
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /lottery/admin/draws/:id/result  (admin only)
 * Set official result and settle all bets.
 */
exports.setResult = async (req, res) => {
  try {
    const drawId = req.params.id;              // CUID string
    const { result } = req.body;
    if (!result) return error(res, 'Kết quả là bắt buộc', 400);

    const drawObj = await lDraw(req).findUnique({ where: { id: drawId } });
    if (!drawObj) return notFound(res);

    await lDraw(req).update({
      where: { id: drawId },
      data:  { resultOfficial: result, status: 'DRAWN', isClosed: true },
    });

    const bets       = await lBet(req).findMany({ where: { drawId, status: 'PENDING' } });
    const oddsSetting = await req.prisma.oddsSetting.findFirst({ where: { typeId: drawObj.typeId } }).catch(() => null);
    const multiplier  = oddsSetting?.rate ?? 2;

    await Promise.all(bets.map((b) => {
      const won = String(b.betChoice) === String(result);
      return lBet(req).update({
        where: { id: b.id },
        data:  { status: won ? 'WIN' : 'LOSE', payout: won ? Number(b.amount) * Number(multiplier) : 0 },
      });
    }));

    return success(res, null, 'Kết quả đã được cập nhật');
  } catch (e) { return error(res, e.message, 500); }
};
