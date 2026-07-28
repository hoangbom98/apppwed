// @ts-nocheck
'use strict';
/**
 * prizeController — Lucky wheel / prize draw (抽奖)
 *
 * User:  GET /trade/prize/configs, POST /trade/prize/draw, GET /trade/prize/records
 * Admin: CRUD /trade/admin/prize/configs
 */
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { paginate }                  = require('../../../shared/utils/core/helpers');
const notifSvc                      = require('../../../shared/services/notificationService');

// ── Odds-based draw algorithm ─────────────────────────────────────────────────
function drawPrize(prizes: any[]): any {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += parseFloat(prize.odds);
    if (rand <= cumulative) return prize;
  }
  return prizes[prizes.length - 1]; // fallback to last prize
}

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

// GET /trade/prize/configs
exports.listPrizes = async (req, res) => {
  try {
    const prizes = await req.prisma.prizeConfig.findMany({
      where:   { isActive: true, OR: [{ endTime: null }, { endTime: { gt: new Date() } }] },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, prizes);
  } catch (e: any) { return error(res, e.message, 500); }
};

// GET /trade/prize/records
exports.myRecords = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.prizeRecord.findMany({
        where: { userId: req.user.id }, skip, take, orderBy: { wonAt: 'desc' },
        include: { prize: { select: { name: true, type: true, amount: true } } },
      }),
      req.prisma.prizeRecord.count({ where: { userId: req.user.id } }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e: any) { return error(res, e.message, 500); }
};

// GET /trade/prize/recent — public recent winners (masked phone)
exports.recentWinners = async (req, res) => {
  try {
    const records = await req.prisma.prizeRecord.findMany({
      take:    20,
      orderBy: { wonAt: 'desc' },
      include: {
        prize: { select: { name: true, type: true, amount: true } },
        user:  { select: { phone: true, fullName: true } },
      },
    });
    const masked = records.map((r: any) => ({
      prizeId:  r.prizeId,
      prize:    r.prize,
      wonAt:    r.wonAt,
      username: r.user.fullName
        ? r.user.fullName.substring(0, 1) + '***'
        : r.user.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '***',
    }));
    return success(res, masked);
  } catch (e: any) { return error(res, e.message, 500); }
};

// POST /trade/prize/draw
exports.draw = async (req, res) => {
  try {
    const prizes = await req.prisma.prizeConfig.findMany({
      where:   { isActive: true, OR: [{ endTime: null }, { endTime: { gt: new Date() } }] },
      orderBy: { sortOrder: 'asc' },
    });
    if (prizes.length === 0) return error(res, 'Không có giải thưởng nào', 400);

    // Check user has draw credits (implement via integral or separate counter)
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (parseFloat(user.integral) < 1) return error(res, 'Không đủ điểm để quay (cần 1 điểm)', 400);

    const won = drawPrize(prizes);

    const record = await req.prisma.$transaction(async (tx: any) => {
      // Deduct 1 integral point
      await tx.user.update({ where: { id: req.user.id }, data: { integral: { decrement: 1 } } });

      const rec = await tx.prizeRecord.create({
        data: { userId: req.user.id, prizeId: won.id },
      });

      // If cash prize: credit wallet immediately
      if (won.type === 'cash' && parseFloat(won.amount) > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
        const newBal = (wallet ? parseFloat(wallet.balance) : 0) + parseFloat(won.amount);
        await tx.wallet.upsert({
          where:  { userId: req.user.id },
          update: { balance: { increment: parseFloat(won.amount) } },
          create: { userId: req.user.id, balance: parseFloat(won.amount), frozen: 0 },
        });
        await tx.transaction.create({
          data: {
            userId:        req.user.id,
            type:          'prize',
            amount:        parseFloat(won.amount),
            balanceAfter:  newBal,
            referenceId:   rec.id,
            referenceType: 'prize_record',
            note:          `Trúng thưởng: ${won.name}`,
          },
        });
        await tx.prizeRecord.update({ where: { id: rec.id }, data: { claimed: true, claimedAt: new Date() } });
      }
      return rec;
    });

    notifSvc.sendToUser(req.user.id, 'notification', {
      title:   'Chúc mừng!',
      content: `Bạn đã trúng: ${won.name}${won.type === 'cash' ? ` — ${won.amount} USD` : ''}`,
    });

    return success(res, { record, prize: won }, `Chúc mừng! Bạn trúng: ${won.name}`);
  } catch (e: any) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

exports.adminList         = async (req, res) => {
  const data = await req.prisma.prizeConfig.findMany({ orderBy: { sortOrder: 'asc' } });
  return success(res, data);
};
exports.adminCreate       = async (req, res) => {
  const p = await req.prisma.prizeConfig.create({ data: req.body });
  return success(res, p, 'Đã tạo giải thưởng');
};
exports.adminUpdate       = async (req, res) => {
  const p = await req.prisma.prizeConfig.update({ where: { id: req.params.id }, data: req.body });
  return success(res, p, 'Đã cập nhật');
};
exports.adminDelete       = async (req, res) => {
  await req.prisma.prizeConfig.update({ where: { id: req.params.id }, data: { isActive: false } });
  return success(res, null, 'Đã ẩn giải thưởng');
};
