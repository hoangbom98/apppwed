// @ts-nocheck
// backend/src/modules/admin/controllers/userController.js
// Admin quản lý users CROSS-PROJECT: mỗi project có DB riêng
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error } = require('../../../shared/utils/response');

const PROJECT_DBS = ['hub', 'game', 'dating', 'trade', 'sports'];

/**
 * GET /admin/users?project=game&page=1&limit=20&search=&status=
 * Liệt kê users của 1 project cụ thể (bắt buộc có ?project=)
 */
exports.listUsers = async (req, res) => {
  try {
    const { project = 'game', page = 1, limit = 20, search, status } = req.query;

    if (!PROJECT_DBS.includes(project)) {
      return error(res, `Invalid project. Must be one of: ${PROJECT_DBS.join(', ')}`, 400);
    }

    const db = getPrismaClient(project);
    const where = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email:    { contains: search } },
      ];
      // hub/trade/dating có thêm fullName
      if (['hub', 'trade', 'dating'].includes(project)) {
        where.OR.push({ fullName: { contains: search } });
      }
    }
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id:        true,
          username:  true,
          email:     true,
          status:    true,
          role:      true,
          balance:   true,
          createdAt: true,
          ...(project !== 'hub' && { fullName: true }),
        },
      }),
      db.user.count({ where }),
    ]);

    return success(res, { data: users, total, page: Number(page), limit: Number(limit), project });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/users/:id?project=game
 * Chi tiết 1 user trong project cụ thể
 */
exports.getUserDetail = async (req, res) => {
  try {
    const { project = 'game' } = req.query;
    if (!PROJECT_DBS.includes(project)) return error(res, 'Invalid project', 400);

    const db = getPrismaClient(project);
    const user = await db.user.findUnique({
      where: { id: req.params.id },
    });
    if (!user) return error(res, 'User not found', 404);

    // Lấy thêm transactions nếu là game DB (Transaction ledger — correct model name)
    let recentTx = [];
    if (project === 'game') {
      recentTx = await db.transaction.findMany({
        where:   { userId: req.params.id },
        take:    10,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []);
    }

    return success(res, { user, recentTransactions: recentTx });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/users/:id/status?project=game
 * Bật/tắt trạng thái user
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { project = 'game' } = req.query;
    if (!PROJECT_DBS.includes(project)) return error(res, 'Invalid project', 400);

    const db = getPrismaClient(project);
    const user = await db.user.findUnique({ where: { id: req.params.id }, select: { status: true } });
    if (!user) return error(res, 'User not found', 404);

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await db.user.update({
      where: { id: req.params.id },
      data:  { status: newStatus, updatedAt: new Date() },
    });
    return success(res, { newStatus, message: `User ${newStatus}` });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/users/:id/balance?project=game
 * Điều chỉnh số dư user trong game DB
 */
exports.adjustBalance = async (req, res) => {
  try {
    const { project = 'game' } = req.query;
    const { amount, reason } = req.body;

    if (!PROJECT_DBS.includes(project)) return error(res, 'Invalid project', 400);
    if (!amount || isNaN(Number(amount))) return error(res, 'Invalid amount', 400);

    const db = getPrismaClient(project);
    const user = await db.user.findUnique({
      where:  { id: req.params.id },
      select: { balance: true },
    });
    if (!user) return error(res, 'User not found', 404);

    const adjustAmount = Number(amount);
    const balanceBefore = Number(user.balance);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.params.id },
        data:  { balance: { increment: adjustAmount }, updatedAt: new Date() },
      });

      // Game DB has Transaction ledger (all projects that have a Transaction model)
      const hasTxModel = ['game', 'sports'].includes(project);
      if (hasTxModel) {
        await tx.transaction.create({
          data: {
            userId:        req.params.id,
            type:          'adjustment',
            amount:        adjustAmount,
            balanceBefore,
            balanceAfter:  balanceBefore + adjustAmount,
            note:          reason || 'Admin manual adjustment',
          },
        });
      }
    });

    return success(res, {
      newBalance: balanceBefore + adjustAmount,
      adjustment: adjustAmount,
      message: 'Balance adjusted successfully',
    });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/users/summary
 * Tổng hợp số lượng users từ tất cả projects
 */
exports.getUserSummary = async (req, res) => {
  try {
    const counts = await Promise.all(
      PROJECT_DBS.map(async (project) => {
        try {
          const db = getPrismaClient(project);
          const count = await db.user.count();
          return { project, count };
        } catch {
          return { project, count: 0 };
        }
      })
    );

    const summary = counts.reduce((acc, { project, count }) => {
      acc[project] = count;
      return acc;
    }, {});

    summary.total = Object.values(summary).reduce((a, b) => a + b, 0);
    return success(res, summary);
  } catch (e) { return error(res, e.message, 500); }
};
