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
const { enqueueLotterySettlement } = require('../../workers/lottery-settlement.worker');

// Prisma accessors on req.prisma
const lDraw = (req) => req.prisma.lotteryDraw;
const lBet  = (req) => req.prisma.lotteryBet;
const lType = (req) => req.prisma.lotteryType;

exports.getTypes = async (req, res) => {
  try {
    // Admin: trả tất cả. User public: chỉ active
    const where = req.user?.role === 'admin' || req.user?.role === 'super_admin'
      ? {}
      : { active: true };
    const types = await req.prisma.lotteryType.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return success(res, types);
  } catch (e) { return error(res, e.message, 500); }
};

exports.getDraws = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, take } = paginate(page, limit);
    const where = {};
    if (req.query.typeId) where.typeId = req.query.typeId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.from || req.query.to) {
      where.drawTime = {};
      if (req.query.from) where.drawTime.gte = new Date(req.query.from);
      if (req.query.to)   where.drawTime.lte = new Date(req.query.to + 'T23:59:59Z');
    }

    const [data, total] = await Promise.all([
      lDraw(req).findMany({
        where, skip, take, orderBy: { drawTime: 'desc' },
        include: { type: { select: { id: true, name: true, code: true } } },
      }),
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
    if (req.query.typeId) where.typeId = req.query.typeId;
    const [data, total] = await Promise.all([
      lBet(req).findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: { draw: { select: { period: true, status: true, resultOfficial: true } } },
      }),
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

    // 1. Persist result + mark draw closed — instant
    await lDraw(req).update({
      where: { id: drawId },
      data:  { resultOfficial: result, status: 'DRAWN', isClosed: true },
    });

    // 2. Enqueue async settlement (BullMQ) — returns immediately, settles in background
    //    Worker handles: idempotency, payout credit, Socket.IO realtime push, retries.
    await enqueueLotterySettlement(drawId);

    return success(res, null, 'Kết quả đã được ghi nhận. Đang xử lý thanh toán...');
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /lottery/lottery/admin/bets  (admin only)
 * List all lottery bets with filters.
 */
exports.listAdminBets = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status)  where.status  = req.query.status;
    if (req.query.drawId)  where.drawId  = req.query.drawId;
    if (req.query.typeId)  where.typeId  = req.query.typeId;
    if (req.query.search)  where.user    = { OR: [{ username: { contains: req.query.search } }, { email: { contains: req.query.search } }] };
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(req.query.from);
      if (req.query.to)   where.createdAt.lte = new Date(req.query.to + 'T23:59:59Z');
    }
    const [data, total] = await Promise.all([
      lBet(req).findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true } },
          draw: { select: { period: true, status: true, resultOfficial: true } },
        },
      }),
      lBet(req).count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /lottery/admin/draws/:id/cancel  (admin only)
 * Cancel a pending draw and refund all bets.
 */
exports.cancelDraw = async (req, res) => {
  try {
    const drawId  = req.params.id;
    const drawObj = await lDraw(req).findUnique({ where: { id: drawId } });
    if (!drawObj) return notFound(res);
    if (drawObj.status !== 'WAITING' && drawObj.status !== 'PENDING') {
      return error(res, 'Chỉ có thể huỷ kỳ đang chờ', 400);
    }

    // Refund all pending bets in one transaction
    const bets = await lBet(req).findMany({ where: { drawId, status: { in: ['PENDING', 'WAITING'] } } });

    await req.prisma.$transaction([
      lDraw(req).update({ where: { id: drawId }, data: { status: 'CANCELLED', isClosed: true } }),
      ...bets.map(b => lBet(req).update({ where: { id: b.id }, data: { status: 'CANCELLED', payout: 0 } })),
      ...bets.map(b => req.prisma.user.update({
        where: { id: b.userId },
        data:  { balance: { increment: Number(b.amount) } },
      })),
      ...bets.map(b => req.prisma.transaction.create({ data: {
        userId:        b.userId,
        type:          'refund',
        amount:        Number(b.amount),
        balanceBefore: 0,
        balanceAfter:  0,
        referenceId:   b.id,
        referenceType: 'lottery_bet_cancel',
        note:          `Hoàn cược kỳ ${drawObj.period} bị huỷ`,
      }})),
    ]);

    return success(res, { cancelledBets: bets.length }, `Đã huỷ kỳ và hoàn ${bets.length} cược`);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Lottery Type CRUD (admin only) ────────────────────────────────────────────

/**
 * POST /admin/lottery/types
 */
exports.createType = async (req, res) => {
  try {
    const { code, name, drawIntervalMin = 5, description, active = true } = req.body;
    if (!code || !name) return error(res, 'code và name là bắt buộc', 400);

    const existing = await lType(req).findFirst({ where: { code } });
    if (existing) return error(res, `Code "${code}" đã tồn tại`, 409);

    const type = await lType(req).create({
      data: { code, name, drawIntervalMin: Number(drawIntervalMin), description, active: !!active },
    });
    return created(res, type, 'Đã tạo loại xổ số');
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/lottery/types/:id
 */
exports.updateType = async (req, res) => {
  try {
    const { id }  = req.params;
    const allowed = ['name', 'drawIntervalMin', 'description', 'active'];
    const data    = Object.fromEntries(
      Object.entries(req.body)
        .filter(([k]) => allowed.includes(k))
        .map(([k, v]) => [k, k === 'drawIntervalMin' ? Number(v) : k === 'active' ? !!v : v]),
    );
    if (!Object.keys(data).length) return error(res, 'Không có trường nào cần cập nhật', 400);

    const type = await lType(req).update({ where: { id }, data });
    return success(res, type, 'Đã cập nhật');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res, 'Loại xổ số không tồn tại');
    return error(res, e.message, 500);
  }
};

/**
 * DELETE /admin/lottery/types/:id
 */
exports.deleteType = async (req, res) => {
  try {
    const count = await lDraw(req).count({ where: { typeId: req.params.id } });
    if (count > 0) return error(res, `Không thể xoá — còn ${count} kỳ quay liên kết`, 409);

    await lType(req).delete({ where: { id: req.params.id } });
    return success(res, null, 'Đã xoá loại xổ số');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res, 'Loại xổ số không tồn tại');
    return error(res, e.message, 500);
  }
};
