// @ts-nocheck
/**
 * game/controllers/miningController.ts
 *
 * Máy đào — Mining Machine investment system
 * Modeled on YuebaoService pattern; daily-income staking products
 *
 * Routes:
 *   GET  /game/mining/machines     — machine catalog (public)
 *   GET  /game/mining/machines/:id — single machine detail (public)
 *   GET  /game/mining/my           — user's active machines (protected)
 *   POST /game/mining/invest       — purchase a machine (protected)
 */
'use strict';

const { success, error, badRequest, notFound } = require('../../../shared/utils/network/response');
const { paginate }                             = require('../../../shared/utils/core/helpers');

// ── GET /game/mining/machines — public ───────────────────────────────────────
exports.getMachines = async (req, res) => {
  try {
    const machines = await req.prisma.miningMachine.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, machines);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/mining/machines/:id — public ────────────────────────────────────
exports.getMachine = async (req, res) => {
  try {
    const machine = await req.prisma.miningMachine.findUnique({ where: { id: req.params.id } });
    if (!machine || !machine.isActive) return notFound(res, 'Máy đào không tồn tại');
    return success(res, machine);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/mining/my — protected ──────────────────────────────────────────
exports.getMy = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await Promise.all([
      req.prisma.miningHolding.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { machine: { select: { title: true, image: true, dayIncome: true } } },
      }),
      req.prisma.miningHolding.count({ where }),
    ]);

    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/mining/invest — protected ─────────────────────────────────────
exports.invest = async (req, res) => {
  try {
    const { machineId, quantity = 1, tradingPassword } = req.body;
    if (!machineId) return badRequest(res, 'machineId là bắt buộc');
    if (!tradingPassword) return badRequest(res, 'Mật khẩu giao dịch là bắt buộc');

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const machine = await req.prisma.miningMachine.findUnique({ where: { id: machineId } });
    if (!machine || !machine.isActive) return notFound(res, 'Máy đào không tồn tại');

    // Stock check
    if (machine.totalStock > 0 && machine.stock < qty) {
      return badRequest(res, `Không đủ hàng. Còn ${machine.stock} máy`);
    }

    // Per-user limit check
    if (machine.perUserLimit > 0) {
      const owned = await req.prisma.miningHolding.count({
        where: { userId: req.user.id, machineId, status: 'active' },
      });
      if (owned + qty > machine.perUserLimit) {
        return badRequest(res, `Giới hạn ${machine.perUserLimit} máy/người dùng`);
      }
    }

    const totalCost  = Number(machine.price) * qty;
    const dayIncome  = Number(machine.dayIncome) * qty;

    const user = await req.prisma.user.findUnique({ where: { id: req.user.id }, select: { balance: true } });
    if (Number(user.balance) < totalCost) return badRequest(res, 'Số dư không đủ');

    // Compute end date
    let endDate: Date | null = null;
    if (machine.duration > 0) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + machine.duration);
    }

    const ops: any[] = [
      req.prisma.user.update({
        where: { id: req.user.id },
        data:  { balance: { decrement: totalCost } },
      }),
      req.prisma.miningHolding.create({
        data: { userId: req.user.id, machineId, quantity: qty, deposit: totalCost, dayIncome, endDate },
      }),
      req.prisma.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'mining_invest',
          amount:        -totalCost,
          balanceBefore: Number(user.balance),
          balanceAfter:  Number(user.balance) - totalCost,
          referenceType: 'mining_holding',
          note:          `Mua ${qty} máy đào: ${machine.title}`,
        },
      }),
    ];

    // Decrement stock only when limited
    if (machine.totalStock > 0) {
      ops.push(
        req.prisma.miningMachine.update({
          where: { id: machineId },
          data:  { stock: { decrement: qty } },
        }),
      );
    }

    await req.prisma.$transaction(ops);

    return success(res, { invested: true, quantity: qty, totalCost, dayIncome }, 'Mua máy đào thành công!');
  } catch (e) { return error(res, e.message, 500); }
};
