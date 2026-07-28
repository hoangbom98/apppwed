// @ts-nocheck
'use strict';
/**
 * trade/controllers/depositController.js
 *
 * Manages Deposit model lifecycle (pending → approved | rejected).
 * Separate from Transaction ledger — Deposit is a user-submitted request
 * with proof, admin reviews and approves to credit the wallet.
 *
 * Schema model used: Deposit (@@map "deposits")
 */
const { success, created, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');
const notifSvc = require('../../../shared/services/notificationService');

// ── POST /trade/deposit ────────────────────────────────────────────────────────
exports.createDeposit = async (req, res) => {
  try {
    const { amount, method = 'bank', txHash, proof, note, bankInfo } = req.body;
    if (!amount || parseFloat(amount) <= 0) return error(res, 'Số tiền không hợp lệ', 400);
    if (!method) return error(res, 'Phương thức nạp tiền là bắt buộc', 400);

    const deposit = await req.prisma.deposit.create({
      data: {
        userId:  req.user.id,
        amount:  parseFloat(amount),
        method,
        txHash:  txHash  || null,
        proof:   proof   || null,
        note:    note    || null,
        bankInfo: bankInfo || null,
        status:  'pending',
      },
    });
    return created(res, deposit, 'Yêu cầu nạp tiền đã gửi, chờ duyệt');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /trade/deposit — user's deposit history ───────────────────────────────
exports.getDeposits = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.deposit.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.deposit.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: GET /trade/admin/deposits ─────────────────────────────────────────
exports.adminListDeposits = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await Promise.all([
      req.prisma.deposit.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } } },
      }),
      req.prisma.deposit.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: PUT /trade/admin/deposits/:id/approve ─────────────────────────────
exports.approveDeposit = async (req, res) => {
  try {
    const dep = await req.prisma.deposit.findUnique({ where: { id: req.params.id } });
    if (!dep)                    return notFound(res);
    if (dep.status !== 'pending') return error(res, 'Yêu cầu đã được xử lý', 400);

    const amtNum = parseFloat(dep.amount);

    await req.prisma.$transaction(async (tx) => {
      // Mark deposit approved
      await tx.deposit.update({
        where: { id: dep.id },
        data: {
          status:      'approved',
          processedBy: req.user.id,
          processedAt: new Date(),
        },
      });
      // Credit wallet
      const updatedWallet = await tx.wallet.upsert({
        where:  { userId: dep.userId },
        create: { userId: dep.userId, balance: amtNum, frozen: 0 },
        update: { balance: { increment: amtNum } },
      });
      // Ledger entry
      await tx.transaction.create({
        data: {
          userId:        dep.userId,
          type:          'deposit',
          amount:        amtNum,
          referenceId:   dep.id,
          referenceType: 'deposit',
          note:          `Nạp tiền duyệt bởi admin — ${dep.method}`,
          balanceAfter:  parseFloat(updatedWallet.balance),
        },
      });
    });

    notifSvc.sendToUser(dep.userId, 'balance:update', { amount: dep.amount });
    notifSvc.sendToUser(dep.userId, 'notification', {
      title:   'Nạp tiền thành công',
      content: `${amtNum.toLocaleString()} USD đã được cộng vào ví`,
    });
    return success(res, null, 'Đã duyệt nạp tiền');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: PUT /trade/admin/deposits/:id/reject ──────────────────────────────
exports.rejectDeposit = async (req, res) => {
  try {
    const dep = await req.prisma.deposit.findUnique({ where: { id: req.params.id } });
    if (!dep)                    return notFound(res);
    if (dep.status !== 'pending') return error(res, 'Yêu cầu đã được xử lý', 400);

    await req.prisma.deposit.update({
      where: { id: dep.id },
      data: {
        status:      'rejected',
        adminNote:   req.body.reason || null,
        processedBy: req.user.id,
        processedAt: new Date(),
      },
    });

    notifSvc.sendToUser(dep.userId, 'notification', {
      title:   'Nạp tiền bị từ chối',
      content: `Yêu cầu nạp ${dep.amount} USD bị từ chối. ${req.body.reason ? `Lý do: ${req.body.reason}` : ''}`,
    });
    return success(res, null, 'Đã từ chối');
  } catch (e) { return error(res, e.message, 500); }
};
