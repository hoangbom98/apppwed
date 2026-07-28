const { success, error } = require('../../../shared/utils/network/response');
const TransferService = require('../services/transferService');
const ConfigService = require('../../../shared/services/configService');

exports.requestWithdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bankAccountNumber, bankName, bankBin, accountHolder } = req.body;

    if (!amount || amount <= 0) return error(res, 'Số tiền không hợp lệ', 400);

    // Check config — daily limit & withdraw enabled flag
    const configService = new ConfigService(req.prisma);
    const enabled       = await configService.get('game', 'payment', 'lkvip', 'withdraw.enabled') !== false;
    if (!enabled) return error(res, 'Rút tiền tạm thời đóng', 400);

    // Fetch daily limit from config (default: 50,000,000 VND)
    const dailyLimitCfg = await configService.get('game', 'payment', 'lkvip', 'withdraw.daily_limit');
    const dailyLimit = Number(dailyLimitCfg) || 50_000_000;

    // Check user balance
    const user = await req.prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true, kycStatus: true },
    });

    if (!user) return error(res, 'Người dùng không tồn tại', 404);

    if (user.kycStatus !== 'verified') {
      return error(res, 'Cần xác minh danh tính trước khi rút tiền', 400);
    }

    if (Number(user.balance) < amount) {
      return error(res, 'Số dư không đủ', 400);
    }

    // Compute how much the user has already withdrawn today from the Transaction table
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayWithdrawn = await req.prisma.lkvipTransaction.aggregate({
      where: {
        userId,
        type:      'withdraw',
        status:    'completed',
        createdAt: { gte: startOfDay },
      },
      _sum: { amount: true },
    });

    const totalWithdrawToday = Number(todayWithdrawn._sum.amount ?? 0);

    if (totalWithdrawToday + Number(amount) > dailyLimit) {
      return error(res, `Vượt quá hạn mức rút tiền trong ngày (${dailyLimit.toLocaleString('vi-VN')} VND)`, 400);
    }

    // Create withdrawal request
    const transferService = new TransferService(req.prisma);
    const withdrawal = await transferService.createWithdrawal(userId, amount, {
      accountNumber: bankAccountNumber,
      bankName,
      bankBin,
      accountHolder,
    });

    return success(res, {
      withdrawal_id: withdrawal.id,
      amount:        withdrawal.amount,
      status:        withdrawal.status,
      created_at:    withdrawal.createdAt,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getWithdrawHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const withdrawals = await req.prisma.withdrawalRequest.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await req.prisma.withdrawalRequest.count({
      where: { userId },
    });

    return success(res, { data: withdrawals, total, page, limit });
  } catch (err) {
    return error(res, err.message);
  }
};
