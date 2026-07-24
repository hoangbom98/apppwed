// @ts-nocheck
const { success, error } = require('../../../shared/utils/response');

exports.getBalance = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { balance: true, frozen: true, status: true },
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, {
      balance:   Number(user.balance),
      frozen:    Number(user.frozen),
      available: Number(user.balance) - Number(user.frozen),
      status:    user.status,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      req.prisma.lkvipTransaction.findMany({
        where,
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.lkvipTransaction.count({ where }),
    ]);

    return success(res, { data: transactions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, err.message);
  }
};
