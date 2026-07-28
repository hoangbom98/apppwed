// @ts-nocheck
const { success, error } = require('../../../shared/utils/network/response');
const TransferService = require('../services/transferService');
const AmlService = require('../services/amlService');
const notifSvc = require('../../../shared/services/notificationService');
const { paginate } = require('../../../shared/utils/core/helpers');

// ── Withdrawals ──────────────────────────────────────────────────

exports.listWithdrawals = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      req.prisma.withdrawalRequest.findMany({
        where,
        include: { user: { select: { username: true, fullName: true, email: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.withdrawalRequest.count({ where }),
    ]);

    return success(res, { data, total, page: p, limit: l });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const transferService = new TransferService(req.prisma);
    const result = await transferService.approveWithdrawal(id, adminId);

    // Push real-time update
    notifSvc.sendToUser(result.user.id, 'balance:update', {
      balance: Number(result.user.balance),
    });
    notifSvc.sendToUser(result.user.id, 'notification', {
      title: 'Rút tiền thành công',
      content: `Lệnh rút ${parseFloat(result.withdrawal.amount).toLocaleString('vi-VN')} VND đã được xử lý`,
    });

    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const transferService = new TransferService(req.prisma);
    const result = await transferService.rejectWithdrawal(id, reason || '');

    notifSvc.sendToUser(result.userId, 'notification', {
      title: 'Rút tiền bị từ chối',
      content: `Lệnh rút tiền bị từ chối${reason ? ': ' + reason : ''}. Số tiền đã được hoàn lại.`,
    });

    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

// ── Virtual Accounts ─────────────────────────────────────────────

exports.listVirtualAccounts = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      req.prisma.virtualAccount.findMany({
        where,
        include: { user: { select: { username: true, fullName: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.virtualAccount.count({ where }),
    ]);

    return success(res, { data, total, page: p, limit: l });
  } catch (err) {
    return error(res, err.message);
  }
};

// ── AML Alerts ───────────────────────────────────────────────────

exports.listAmlAlerts = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      req.prisma.amlAlert.findMany({
        where,
        include: { user: { select: { username: true, fullName: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.amlAlert.count({ where }),
    ]);

    return success(res, { data, total, page: p, limit: l });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.resolveAmlAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { resolution } = req.body;

    const amlService = new AmlService(req.prisma);
    const result = await amlService.resolveAlert(id, adminId, resolution);

    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

// ── Bank Accounts ────────────────────────────────────────────────

exports.listBankAccounts = async (req, res) => {
  try {
    const accounts = await req.prisma.bankAccount.findMany({
      orderBy: [{ isMain: 'desc' }, { createdAt: 'desc' }],
    });
    return success(res, accounts);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createBankAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, bankBin, isMain } = req.body;

    // Only one main account allowed
    if (isMain) {
      await req.prisma.bankAccount.updateMany({
        where: { isMain: true },
        data: { isMain: false },
      });
    }

    const account = await req.prisma.bankAccount.create({
      data: { bankName, accountNumber, accountName, bankBin, isMain: isMain || false },
    });

    return success(res, account, 'Tạo tài khoản ngân hàng thành công');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName, accountName, bankBin, isActive, isMain } = req.body;

    if (isMain) {
      await req.prisma.bankAccount.updateMany({
        where: { isMain: true },
        data: { isMain: false },
      });
    }

    const account = await req.prisma.bankAccount.update({
      where: { id },
      data: { bankName, accountName, bankBin, isActive, isMain },
    });

    return success(res, account);
  } catch (err) {
    return error(res, err.message);
  }
};
