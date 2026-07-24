// @ts-nocheck
// backend/src/modules/admin/controllers/rebateController.js
// Rebate (hoàn trả) management — học từ RebateService.php + RebateController.php của Boyue
// Rebate = hoàn trả % tiền cược cho người chơi theo kỳ (ngày/tuần/tháng)
'use strict';

const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, paginate } = require('../../../shared/utils/response');

const adminDb  = () => getPrismaClient('admin');
const safe = async (fn) => { try { return await fn(); } catch { return null; } };

// ─────────────────────────────────────────────────────────────────────────────
// REBATE RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/rebates/rules?page=1&limit=20
 * Danh sách cấu hình luật hoàn trả
 */
exports.listRules = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const prisma = adminDb();
    const where  = status ? { status } : {};

    const [rules, total] = await Promise.all([
      prisma.rebateRule.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.rebateRule.count({ where }),
    ]);

    return paginate(res, rules, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/rebates/rules
 * Tạo luật hoàn trả mới
 * Body: { name, gameType?, rebateRate, minBet, period, project, status }
 */
exports.createRule = async (req, res) => {
  try {
    const {
      name, gameType, rebateRate, minBet = 0,
      period = 'daily', project = 'game', status = 'active', sortOrder = 0,
    } = req.body;

    if (!name || rebateRate == null) return error(res, 'name và rebateRate bắt buộc', 400);
    if (Number(rebateRate) <= 0 || Number(rebateRate) > 100) {
      return error(res, 'rebateRate phải từ 0.01 đến 100', 400);
    }

    const rule = await adminDb().rebateRule.create({
      data: {
        name,
        gameType:   gameType   || null,
        rebateRate: Number(rebateRate),
        minBet:     Number(minBet),
        period,
        project,
        status,
        sortOrder:  Number(sortOrder),
      },
    });
    return success(res, rule, 'Đã tạo luật hoàn trả', 201);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/rebates/rules/:id
 */
exports.updateRule = async (req, res) => {
  try {
    const { name, gameType, rebateRate, minBet, period, project, status, sortOrder } = req.body;
    const data = {};
    if (name        !== undefined) data.name        = name;
    if (gameType    !== undefined) data.gameType    = gameType;
    if (rebateRate  !== undefined) data.rebateRate  = Number(rebateRate);
    if (minBet      !== undefined) data.minBet      = Number(minBet);
    if (period      !== undefined) data.period      = period;
    if (project     !== undefined) data.project     = project;
    if (status      !== undefined) data.status      = status;
    if (sortOrder   !== undefined) data.sortOrder   = Number(sortOrder);

    const rule = await adminDb().rebateRule.update({
      where: { id: Number(req.params.id) },
      data,
    });
    return success(res, rule, 'Đã cập nhật');
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * DELETE /admin/rebates/rules/:id
 */
exports.deleteRule = async (req, res) => {
  try {
    await adminDb().rebateRule.delete({ where: { id: Number(req.params.id) } });
    return success(res, null, 'Đã xoá');
  } catch (e) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// REBATE CLAIMS (lịch sử hoàn trả của người chơi)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/rebates/claims?page=1&limit=20&status=pending&project=game
 * Danh sách yêu cầu hoàn trả cần xét duyệt
 */
exports.listClaims = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, project, userId } = req.query;
    const prisma = adminDb();
    const where  = {};
    if (status)  where.status  = status;
    if (project) where.project = project;
    if (userId)  where.userId  = userId;

    const [claims, total] = await Promise.all([
      prisma.rebateClaim.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { rule: { select: { name: true, rebateRate: true, period: true } } },
      }),
      prisma.rebateClaim.count({ where }),
    ]);

    return paginate(res, claims, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/rebates/claims/:id/approve
 * Duyệt hoàn trả — cộng tiền vào ví user
 */
exports.approveClaim = async (req, res) => {
  try {
    const { note } = req.body;
    const prisma   = adminDb();

    const claim = await prisma.rebateClaim.findUnique({ where: { id: Number(req.params.id) } });
    if (!claim) return error(res, 'Không tìm thấy yêu cầu', 404);
    if (claim.status !== 'pending') return error(res, 'Chỉ duyệt được claim ở trạng thái pending', 400);

    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái claim
      await tx.rebateClaim.update({
        where: { id: Number(req.params.id) },
        data:  {
          status:      'approved',
          approvedBy:  String(req.user?.id || 'admin'),
          approvedAt:  new Date(),
          note:        note || null,
        },
      });

      // 2. Cộng tiền vào ví game DB
      const game = getPrismaClient(claim.project || 'game');
      await safe(() => game.user.update({
        where: { id: claim.userId },
        data:  { balance: { increment: Number(claim.rebateAmount) } },
      }));

      // 3. Ghi transaction ledger nếu có
      await safe(() => game.transaction.create({
        data: {
          userId:       claim.userId,
          type:         'rebate',
          amount:       Number(claim.rebateAmount),
          balanceBefore: 0,
          balanceAfter:  Number(claim.rebateAmount),
          note:         `Hoàn trả kỳ ${claim.period || ''} — ${claim.ruleId}`,
        },
      }));
    });

    return success(res, { id: claim.id, status: 'approved', rebateAmount: claim.rebateAmount });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/rebates/claims/:id/reject
 * Từ chối yêu cầu hoàn trả
 */
exports.rejectClaim = async (req, res) => {
  try {
    const { note } = req.body;
    const claim = await adminDb().rebateClaim.update({
      where: { id: Number(req.params.id) },
      data:  {
        status:     'rejected',
        approvedBy: String(req.user?.id || 'admin'),
        approvedAt: new Date(),
        note:       note || null,
      },
    });
    return success(res, { id: claim.id, status: 'rejected' });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/rebates/stats
 * Tổng hợp hoàn trả: pending count, total disbursed today/month
 */
exports.getStats = async (req, res) => {
  try {
    const prisma  = adminDb();
    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const month   = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      pendingCount,
      approvedToday,
      approvedMonth,
    ] = await Promise.all([
      safe(() => prisma.rebateClaim.count({ where: { status: 'pending' } })),
      safe(() => prisma.rebateClaim.aggregate({
        where:  { status: 'approved', approvedAt: { gte: today } },
        _sum:   { rebateAmount: true },
        _count: { _all: true },
      })),
      safe(() => prisma.rebateClaim.aggregate({
        where:  { status: 'approved', approvedAt: { gte: month } },
        _sum:   { rebateAmount: true },
        _count: { _all: true },
      })),
    ]);

    return success(res, {
      pending:        pendingCount ?? 0,
      today:  { amount: Number(approvedToday?._sum?.rebateAmount || 0), count: approvedToday?._count?._all ?? 0 },
      month:  { amount: Number(approvedMonth?._sum?.rebateAmount || 0), count: approvedMonth?._count?._all ?? 0 },
    });
  } catch (e) { return error(res, e.message, 500); }
};
