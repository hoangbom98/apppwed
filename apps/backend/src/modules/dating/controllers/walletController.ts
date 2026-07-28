'use strict';
/**
 * dating/controllers/walletController.js
 *
 * Dating User fields: { coins, isVip, status }
 * NO diamonds, vipTier, level, exp on User.
 *
 * Wallet models in dating schema:
 *   - Transaction (@@map "transactions")  — { userId, amount, coins?, type, status, note }
 *   - VipPlan     (@@map "vip_plans")     — { id (cuid), name, duration, price, coinBonus, status }
 *   - VipMembership (@@map "vip_memberships") — per-user VIP subscription record
 *   - Gift        (@@map "gifts")         — { id (cuid), name, coinCost, category, status, sortOrder }
 *   - GiftSend    (@@map "gift_sends")    — { giftId, senderId, receiverId, liveStreamId?, quantity, coinValue }
 */
const { success, created, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

// ── GET /dating/wallet/balance ────────────────────────────────────────────────
exports.getBalance = async (req, res) => {
  try {
    const u = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { coins: true, isVip: true },
    });
    return success(res, u);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/wallet/history ────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.transaction.findMany({ where: { userId: req.user.id }, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.transaction.count({ where: { userId: req.user.id } }),
    ]);
    return res.json({ success: true, transactions: data, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/wallet/deposit ───────────────────────────────────────────────
exports.deposit = async (req, res) => {
  try {
    const { amount, method: _method } = req.body;
    if (!amount || amount <= 0) return error(res, 'Số tiền không hợp lệ', 400);
    const coins = Math.floor(amount / 1000);
    const txn = await req.prisma.transaction.create({
      data: {
        userId: req.user.id,
        type:   'deposit',
        amount: parseFloat(amount),
        coins:  coins,
        status: 'pending',
        note:   `Nạp ${Number(amount).toLocaleString('vi-VN')}đ = ${coins} xu`,
      },
    });
    return created(res, { transaction: txn, coins_to_receive: coins });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/wallet/withdraw ──────────────────────────────────────────────
exports.withdraw = async (req, res) => {
  try {
    const { amount, bank_account } = req.body;
    const u = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (parseFloat(u.coins) < parseFloat(amount)) return error(res, 'Không đủ xu', 400);
    await req.prisma.$transaction([
      req.prisma.user.update({ where: { id: req.user.id }, data: { coins: { decrement: parseFloat(amount) } } }),
      req.prisma.transaction.create({
        data: {
          userId: req.user.id,
          type:   'withdraw',
          amount: -parseFloat(amount),
          status: 'pending',
          note:   `Rút ${amount} xu về ${bank_account}`,
        },
      }),
    ]);
    return success(res, null, 'Yêu cầu rút tiền đã gửi');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/wallet/vip ───────────────────────────────────────────────────
// Purchase VIP using coin balance — VipPlan.id is CUID string
exports.subscribeVip = async (req, res) => {
  try {
    const { plan_id } = req.body;
    if (!plan_id) return error(res, 'plan_id là bắt buộc', 400);

    // plan_id is a CUID string — never coerce to int
    const plan = await req.prisma.vipPlan.findUnique({ where: { id: String(plan_id) } });
    if (!plan || plan.status !== 'active') return error(res, 'Gói không tồn tại hoặc không khả dụng', 400);

    const u = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (parseFloat(u.coins) < parseFloat(plan.price)) return error(res, 'Không đủ xu', 400);

    const start = new Date();
    const end   = new Date(start.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    await req.prisma.$transaction([
      // Deduct coins — update isVip flag
      req.prisma.user.update({
        where: { id: req.user.id },
        data:  { coins: { decrement: parseFloat(plan.price) }, isVip: true },
      }),
      // Create VipMembership record
      req.prisma.vipMembership.create({
        data: {
          userId:    req.user.id,
          planId:    plan.id,
          startDate: start,
          endDate:   end,
          status:    'active',
        },
      }),
      // Transaction ledger entry
      req.prisma.transaction.create({
        data: {
          userId: req.user.id,
          type:   'vip_purchase',
          amount: -parseFloat(plan.price),
          status: 'success',
          note:   `Mua VIP ${plan.name}`,
        },
      }),
    ]);

    return success(res, null, 'Nâng cấp VIP thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/wallet/gifts ──────────────────────────────────────────────────
// Gift.coinCost is the field name (not price); Gift.category for grouping
exports.getGifts = async (req, res) => {
  try {
    const gifts = await req.prisma.gift.findMany({
      where:   { status: 'active' },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    return success(res, { gifts });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/wallet/gift ──────────────────────────────────────────────────
// Send a gift to another user using coin balance
// GiftSend fields: { senderId, receiverId, giftId, quantity, coinValue }
// receiver_id and gift_id are CUID strings — never coerce to int
exports.sendGift = async (req, res) => {
  try {
    const { receiver_id, gift_id, quantity = 1 } = req.body;
    if (!receiver_id || !gift_id) return error(res, 'receiver_id và gift_id là bắt buộc', 400);

    const gift = await req.prisma.gift.findUnique({ where: { id: String(gift_id) } });
    if (!gift) return error(res, 'Quà không tồn tại', 400);

    const totalCost = parseFloat(gift.coinCost) * parseInt(quantity);
    const u = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (parseFloat(u.coins) < totalCost) return error(res, 'Không đủ xu', 400);

    // receiver_id must be a CUID string
    await req.prisma.$transaction([
      req.prisma.user.update({ where: { id: req.user.id },        data: { coins: { decrement: totalCost } } }),
      req.prisma.user.update({ where: { id: String(receiver_id) }, data: { coins: { increment: totalCost } } }),
      req.prisma.giftSend.create({
        data: {
          senderId:   req.user.id,
          receiverId: String(receiver_id),
          giftId:     gift.id,
          quantity:   parseInt(quantity),
          coinValue:  totalCost,
        },
      }),
    ]);

    return success(res, null, 'Đã gửi quà');
  } catch (e) { return error(res, e.message, 500); }
};
