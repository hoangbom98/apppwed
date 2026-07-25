// @ts-nocheck
'use strict';
/**
 * shared/controllers/bankAccountController.ts
 * User bank account management — shared across game, trade, and other sub-projects.
 * Routes are registered per-project in each module's routes/index.ts:
 *   GET    /bank-accounts
 *   POST   /bank-accounts
 *   PATCH  /bank-accounts/:id
 *   DELETE /bank-accounts/:id
 */
const { success, error, notFound } = require('../utils/response');

const MAX_ACCOUNTS = 5;

// ── GET /bank-accounts ────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const accounts = await req.prisma.bankAccount.findMany({
      where:   { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return success(res, accounts);
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── POST /bank-accounts ───────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { bank_code, bank_name, account_number, account_holder, branch, isDefault = false } = req.body;
    if (!bank_code || !account_number || !account_holder) {
      return error(res, 'bank_code, account_number và account_holder là bắt buộc', 400);
    }

    // Enforce max 5 accounts per user
    const count = await req.prisma.bankAccount.count({ where: { userId: req.user.id } });
    if (count >= MAX_ACCOUNTS) {
      return error(res, `Tối đa ${MAX_ACCOUNTS} tài khoản ngân hàng`, 400);
    }

    // Clear other defaults if setting as default
    if (isDefault) {
      await req.prisma.bankAccount.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data:  { isDefault: false },
      });
    }

    const account = await req.prisma.bankAccount.create({
      data: {
        userId:        req.user.id,
        type:          'bank',
        bankName:      bank_name  || bank_code,
        accountNumber: account_number,
        accountName:   account_holder.toUpperCase(),
        branch:        branch || null,
        isDefault:     Boolean(isDefault),
      },
    });
    return success(res, account, 'Đã thêm tài khoản ngân hàng');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── PATCH /bank-accounts/:id ──────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const account = await req.prisma.bankAccount.findUnique({ where: { id: req.params.id } });
    if (!account || account.userId !== req.user.id) return notFound(res, 'Tài khoản không tồn tại');

    const { isDefault } = req.body;
    if (isDefault) {
      await req.prisma.bankAccount.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data:  { isDefault: false },
      });
    }

    const updated = await req.prisma.bankAccount.update({
      where: { id: req.params.id },
      data:  {
        ...(req.body.bank_name        !== undefined && { bankName:      req.body.bank_name }),
        ...(req.body.account_holder   !== undefined && { accountName:   req.body.account_holder.toUpperCase() }),
        ...(req.body.branch           !== undefined && { branch:        req.body.branch }),
        ...(isDefault                 !== undefined && { isDefault:     Boolean(isDefault) }),
      },
    });
    return success(res, updated, 'Đã cập nhật tài khoản');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── DELETE /bank-accounts/:id ─────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const account = await req.prisma.bankAccount.findUnique({ where: { id: req.params.id } });
    if (!account || account.userId !== req.user.id) return notFound(res, 'Tài khoản không tồn tại');
    await req.prisma.bankAccount.delete({ where: { id: req.params.id } });
    return success(res, null, 'Đã xóa tài khoản');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── PUT /bank-accounts/:id/default ────────────────────────────────────────────
exports.setDefault = async (req, res) => {
  try {
    const account = await req.prisma.bankAccount.findUnique({ where: { id: req.params.id } });
    if (!account || account.userId !== req.user.id) return notFound(res, 'Tài khoản không tồn tại');
    await req.prisma.bankAccount.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data:  { isDefault: false },
    });
    const updated = await req.prisma.bankAccount.update({
      where: { id: req.params.id },
      data:  { isDefault: true },
    });
    return success(res, updated, 'Đã đặt làm tài khoản mặc định');
  } catch (e: any) { return error(res, e.message, 500); }
};
