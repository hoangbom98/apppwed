// @ts-nocheck
'use strict';
/**
 * miningController — Mining Machine (矿机) investments
 *
 * User:  GET /trade/mining/machines, POST /trade/mining/invest, GET /trade/mining/my
 * Admin: CRUD /trade/admin/mining/machines, GET /trade/admin/mining/investments
 */
const { success, error, notFound } = require('../../../shared/utils/response');
const { paginate }                  = require('../../../shared/utils/helpers');
const notifSvc                      = require('../../../shared/services/notificationService');

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

exports.listMachines = async (req, res) => {
  try {
    const machines = await req.prisma.miningMachine.findMany({
      where:   { status: 'active' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return success(res, machines);
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.getMachine = async (req, res) => {
  try {
    const machine = await req.prisma.miningMachine.findUnique({ where: { id: req.params.id } });
    if (!machine || machine.status === 'deleted') return notFound(res, 'Máy không tồn tại');
    return success(res, machine);
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.myInvestments = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.miningInvestment.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: { machine: { select: { title: true, dayIncome: true } } },
      }),
      req.prisma.miningInvestment.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.invest = async (req, res) => {
  try {
    const { machineId, quantity = 1 } = req.body;
    if (!machineId) return error(res, 'machineId là bắt buộc', 400);
    const qty = parseInt(quantity);

    const machine = await req.prisma.miningMachine.findUnique({ where: { id: machineId } });
    if (!machine || machine.status !== 'active') return error(res, 'Máy không tồn tại hoặc hết hàng', 400);

    // Check stock
    if (machine.totalStock > 0 && machine.stock < qty)
      return error(res, `Chỉ còn ${machine.stock} máy trong kho`, 400);

    // Check per-user limit
    if (machine.perUserLimit > 0) {
      const owned = await req.prisma.miningInvestment.count({
        where: { userId: req.user.id, machineId, status: { in: ['active', 'completed'] } },
      });
      if (owned + qty > machine.perUserLimit)
        return error(res, `Giới hạn ${machine.perUserLimit} máy/người dùng`, 400);
    }

    const deposit = parseFloat(machine.price) * qty;
    const wallet  = await req.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.frozen) : 0;
    if (available < deposit) return error(res, 'Số dư không đủ để đặt cọc', 400);

    const endDate = machine.duration > 0 ? new Date(Date.now() + machine.duration * 86400000) : null;

    const investment = await req.prisma.$transaction(async (tx: any) => {
      const inv = await tx.miningInvestment.create({
        data: {
          userId:    req.user.id,
          machineId,
          quantity:  qty,
          deposit,
          dayIncome: parseFloat(machine.dayIncome) * qty,
          endDate,
          status:    'active',
        },
      });
      await tx.wallet.update({
        where: { userId: req.user.id },
        data:  { frozen: { increment: deposit } },
      });
      if (machine.totalStock > 0) {
        await tx.miningMachine.update({
          where: { id: machineId },
          data:  { stock: { decrement: qty } },
        });
      }
      await tx.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'mining_invest',
          amount:        -deposit,
          balanceAfter:  available - deposit,
          referenceId:   inv.id,
          referenceType: 'mining_investment',
          note:          `Đặt cọc máy đào: ${machine.title} x${qty}`,
        },
      });
      return inv;
    });

    return success(res, investment, 'Đã mua máy đào thành công');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

exports.adminListMachines = async (req, res) => {
  try {
    const machines = await req.prisma.miningMachine.findMany({
      where:   { status: { not: 'deleted' } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return success(res, machines);
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminCreateMachine = async (req, res) => {
  try {
    const { title, description, image, price, totalStock = 0, dayIncome, cost = 0, duration = 0, perUserLimit = 0, sortOrder = 0 } = req.body;
    if (!title || !price || !dayIncome) return error(res, 'title, price, dayIncome là bắt buộc', 400);
    if (parseFloat(dayIncome) < parseFloat(cost)) return error(res, 'dayIncome phải >= cost', 400);
    const machine = await req.prisma.miningMachine.create({
      data: { title, description, image, price: parseFloat(price), totalStock: parseInt(totalStock),
              stock: parseInt(totalStock), dayIncome: parseFloat(dayIncome), cost: parseFloat(cost),
              duration: parseInt(duration), perUserLimit: parseInt(perUserLimit), sortOrder },
    });
    return success(res, machine, 'Đã tạo máy đào');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminUpdateMachine = async (req, res) => {
  try {
    const machine = await req.prisma.miningMachine.update({ where: { id: req.params.id }, data: req.body });
    return success(res, machine, 'Đã cập nhật');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminDeleteMachine = async (req, res) => {
  try {
    await req.prisma.miningMachine.update({ where: { id: req.params.id }, data: { status: 'deleted' } });
    return success(res, null, 'Đã xóa máy đào');
  } catch (e: any) { return error(res, e.message, 500); }
};

exports.adminListInvestments = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.miningInvestment.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } }, machine: { select: { title: true } } },
      }),
      req.prisma.miningInvestment.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e: any) { return error(res, e.message, 500); }
};
