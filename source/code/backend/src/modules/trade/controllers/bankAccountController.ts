// @ts-nocheck
'use strict';
/**
 * bankAccountController — user bank / e-wallet accounts management
 * Routes: /trade/bank-accounts
 */
const { success, error, notFound } = require('../../../shared/utils/response');

// ── GET /trade/bank-accounts ──────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const accounts = await req.prisma.bankAccount.findMany({
      where:   { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return success(res, accounts);
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── POST /trade/bank-accounts ─────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { type = 'bank', bankName, accountNumber, accountName, branch, isDefault = false } = req.body;
    if (!accountNumber || !accountName) return error(res, 'accountNumber và accountName là bắt buộc', 400);

    // If setting as default, clear other defaults first
    if (isDefault) {
      await req.prisma.bankAccount.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data:  { isDefault: false },
      });
    }

    const account = await req.prisma.bankAccount.create({
      data: {
        userId: req.user.id,
        type,
        bankName:      bankName || null,
        accountNumber,
        accountName,
        branch:        branch || null,
        isDefault:     Boolean(isDefault),
      },
    });
    return success(res, account, 'Đã thêm tài khoản ngân hàng');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── PATCH /trade/bank-accounts/:id ────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const account = await req.prisma.bankAccount.findUnique({ where: { id: req.params.id } });
    if (!account || account.userId !== req.user.id) return notFound(res, 'Tài khoản không tồn tại');

    const { bankName, accountName, branch, isDefault } = req.body;

    if (isDefault) {
      await req.prisma.bankAccount.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data:  { isDefault: false },
      });
    }

    const updated = await req.prisma.bankAccount.update({
      where: { id: req.params.id },
      data: {
        ...(bankName     !== undefined && { bankName }),
        ...(accountName  !== undefined && { accountName }),
        ...(branch       !== undefined && { branch }),
        ...(isDefault    !== undefined && { isDefault: Boolean(isDefault) }),
      },
    });
    return success(res, updated, 'Đã cập nhật tài khoản');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── DELETE /trade/bank-accounts/:id ───────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const account = await req.prisma.bankAccount.findUnique({ where: { id: req.params.id } });
    if (!account || account.userId !== req.user.id) return notFound(res, 'Tài khoản không tồn tại');
    await req.prisma.bankAccount.delete({ where: { id: req.params.id } });
    return success(res, null, 'Đã xóa tài khoản');
  } catch (e: any) { return error(res, e.message, 500); }
};
