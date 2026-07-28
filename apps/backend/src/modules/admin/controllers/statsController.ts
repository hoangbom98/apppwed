// backend/src/modules/admin/controllers/statsController.js
// Cross-project statistics — sử dụng đúng models từ từng project schema
const { success, error } = require('../../../shared/utils/network/response');
const { getPrismaClient } = require('../../../shared/config/databases');

// Helper: safe count (trả về 0 nếu lỗi)
const safeCount = async (model, where = {}) => {
  try { return await model.count({ where }); } catch { return 0; }
};

// Helper: safe aggregate sum
const safeSum = async (model, field, where = {}) => {
  try {
    const result = await model.aggregate({ _sum: { [field]: true }, where });
    return Number(result._sum?.[field] || 0);
  } catch { return 0; }
};

/**
 * GET /admin/stats
 * Quick stats cho legacy dashboard
 */
exports.getStats = async (req, res) => {
  try {
    const hub    = getPrismaClient('hub');
    const game   = getPrismaClient('game');
    const dating = getPrismaClient('dating');
    const trade  = getPrismaClient('trade');
    const sports = getPrismaClient('sports');

    const [hubUsers, gameUsers, datingUsers, tradeUsers, sportsUsers] = await Promise.all([
      safeCount(hub.user),
      safeCount(game.user),
      safeCount(dating.user),
      safeCount(trade.user),
      safeCount(sports.user),
    ]);

    // game DB: DepositOrder + WithdrawOrder (correct schema models)
    const [pendingDeposits, pendingWithdraws] = await Promise.all([
      safeCount(game.depositOrder,  { status: 'pending' }),
      safeCount(game.withdrawOrder, { status: 'pending' }),
    ]);

    return success(res, {
      users: {
        hub:     hubUsers,
        game:    gameUsers,
        dating:  datingUsers,
        trade:   tradeUsers,
        sports:  sportsUsers,
        total:   hubUsers + gameUsers + datingUsers + tradeUsers + sportsUsers,
      },
      pending: {
        deposits:  pendingDeposits,
        withdraws: pendingWithdraws,
      },
      timestamp: new Date(),
    });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/stats/finance
 * Thống kê tài chính chi tiết từ game DB
 */
exports.getFinanceStats = async (req, res) => {
  try {
    const game = getPrismaClient('game');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalDepositToday,
      totalDepositMonth,
      totalWithdrawToday,
      totalWithdrawMonth,
      pendingDeposits,
      pendingWithdrawals,
      completedDeposits,
      completedWithdrawals,
    ] = await Promise.all([
      safeSum(game.transaction, 'amount', { type: 'deposit', createdAt: { gte: today } }),
      safeSum(game.transaction, 'amount', { type: 'deposit', createdAt: { gte: thisMonth } }),
      // withdraw transactions have negative amounts — use abs via depositOrder/withdrawOrder counts
      safeSum(game.transaction, 'amount', { type: 'withdraw', createdAt: { gte: today } }),
      safeSum(game.transaction, 'amount', { type: 'withdraw', createdAt: { gte: thisMonth } }),
      safeCount(game.depositOrder,  { status: 'pending' }),
      safeCount(game.withdrawOrder, { status: 'pending' }),
      safeCount(game.depositOrder,  { status: 'success' }),
      safeCount(game.withdrawOrder, { status: 'success' }),
    ]);

    // Admin DB: AML alerts
    const admin = getPrismaClient('admin');
    const amlAlerts = await safeCount(admin.amlAlert, { status: 'open' });

    return success(res, {
      today: {
        deposit:  Math.abs(totalDepositToday),
        withdraw: Math.abs(totalWithdrawToday),
        net:      Math.abs(totalDepositToday) - Math.abs(totalWithdrawToday),
      },
      month: {
        deposit:  Math.abs(totalDepositMonth),
        withdraw: Math.abs(totalWithdrawMonth),
        net:      Math.abs(totalDepositMonth) - Math.abs(totalWithdrawMonth),
      },
      pending:   { deposits: pendingDeposits, withdrawals: pendingWithdrawals },
      completed: { deposits: completedDeposits, withdrawals: completedWithdrawals },
      alerts:    { aml: amlAlerts },
      timestamp: new Date(),
    });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/stats/revenue-chart?days=30
 */
exports.getRevenueChart = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const game = getPrismaClient('game');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await game.transaction.findMany({
      where: {
        type:      { in: ['deposit', 'withdraw'] },
        createdAt: { gte: startDate },
      },
      select: { type: true, amount: true, createdAt: true },
    }).catch(() => []);

    // Group by date
    const chartMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      chartMap[key] = { date: key, deposit: 0, withdraw: 0, net: 0 };
    }

    for (const tx of transactions) {
      const key = tx.createdAt.toISOString().split('T')[0];
      if (chartMap[key]) {
        const amount = Math.abs(Number(tx.amount));
        if (tx.type === 'deposit')  chartMap[key].deposit  += amount;
        if (tx.type === 'withdraw') chartMap[key].withdraw += amount;
        chartMap[key].net = chartMap[key].deposit - chartMap[key].withdraw;
      }
    }

    return success(res, Object.values(chartMap));
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/stats/system
 * Server health, memory, uptime, maintenance mode flag
 */
exports.getSystemInfo = async (req, res) => {
  try {
    const admin = getPrismaClient('admin');

    // Maintenance mode from system_settings table
    let maintenanceMode = false;
    try {
      const setting = await admin.systemSetting.findUnique({ where: { key: 'maintenance_mode' } });
      maintenanceMode = setting?.value === 'true';
    } catch { /* table may not exist yet */ }

    const mem    = process.memoryUsage();
    const uptime = process.uptime();

    return success(res, {
      node:    process.version,
      env:     process.env.NODE_ENV || 'development',
      uptime:  Math.floor(uptime),
      uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        rss:       Math.round(mem.rss        / 1024 / 1024),
        heapUsed:  Math.round(mem.heapUsed   / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal  / 1024 / 1024),
        external:  Math.round(mem.external   / 1024 / 1024),
      },
      pid:             process.pid,
      platform:        process.platform,
      maintenanceMode,
      timestamp:       new Date(),
    });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/stats/system/maintenance
 * Toggle or set maintenance mode
 * Body: { enabled: true|false }
 */
exports.setMaintenanceMode = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return error(res, 'Body must include { enabled: boolean }', 400);

    const admin = getPrismaClient('admin');
    await admin.systemSetting.upsert({
      where:  { key: 'maintenance_mode' },
      create: { key: 'maintenance_mode', value: String(enabled), group: 'general', description: 'Bật/tắt chế độ bảo trì' },
      update: { value: String(enabled) },
    });

    return success(res, { maintenanceMode: enabled }, `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
  } catch (e) { return error(res, e.message, 500); }
};
