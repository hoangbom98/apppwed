'use strict';
/**
 * OpsController — REST handlers for the Auto-Ops Platform.
 *
 * All routes live under /api/admin/ops/ and require auth + adminGuard.
 */
const { success, error, paginate } = require('../../../shared/utils/network/response');
const { getPrismaClient }           = require('../../../shared/config/databases');

// ── Lazy service factory (avoids circular deps at module load time) ─────────
function svc() {
  const game  = getPrismaClient('game');
  const admin = getPrismaClient('admin');

  const RFMAnalyzer         = require('../ops/analytics/rfmAnalyzer');
  const ChurnPredictor      = require('../ops/analytics/churnPredictor');
  const CLVPredictor        = require('../ops/analytics/clvPredictor');
  const ReportGenerator     = require('../ops/analytics/reportGenerator');
  const TaskManager         = require('../ops/automation/taskManager');
  const CampaignTrigger     = require('../ops/automation/campaignTrigger');
  const TicketAutomation    = require('../ops/automation/ticketAutomation');
  const MarketingAutomation = require('../ops/automation/marketingAutomation');
  const CashFlowForecast    = require('../ops/financial/cashFlowForecast');
  const ExpenseApprover     = require('../ops/financial/expenseApprover');

  return {
    rfm:       new RFMAnalyzer(game, admin),
    churn:     new ChurnPredictor(game, admin),
    clv:       new CLVPredictor(game, admin),
    report:    new ReportGenerator(game, admin),
    tasks:     new TaskManager(admin),
    campaigns: new CampaignTrigger(admin),
    tickets:   new TicketAutomation(admin),
    marketing: new MarketingAutomation(game, admin),
    cashflow:  new CashFlowForecast(game, admin),
    expenses:  new ExpenseApprover(admin),
  };
}

// ── Dashboard summary ──────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const s     = svc();
    const admin = getPrismaClient('admin');

    const safeCount = async (model, where = {}) => {
      try { return await model.count({ where }); } catch { return 0; }
    };

    const [
      churnSummary,
      segDistribution,
      topCLVUsers,
      pendingTasks,
      inProgressTasks,
      completedTasksToday,
      campaignStats,
    ] = await Promise.all([
      s.churn.getSummary(),
      s.rfm.getDistribution(),
      s.clv.getTopUsers(5),
      safeCount(admin.opsTask, { status: 'pending' }),
      safeCount(admin.opsTask, { status: 'in_progress' }),
      safeCount(admin.opsTask, { status: 'completed', completedAt: { gte: new Date(Date.now() - 86400000) } }),
      s.campaigns.getStats(7),
    ]);

    return success(res, {
      churn:     churnSummary,
      segments:  segDistribution,
      topCLV:    topCLVUsers,
      tasks:     { pending: pendingTasks, inProgress: inProgressTasks, completedToday: completedTasksToday },
      campaigns: campaignStats,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Segment distribution ───────────────────────────────────────────────────
exports.getSegments = async (req, res) => {
  try {
    const admin = getPrismaClient('admin');
    const rows  = await admin.opsUserSegment.findMany({
      orderBy: { clv: 'desc' },
      take:    parseInt(req.query.limit) || 100,
    }).catch(() => []);
    return success(res, rows);
  } catch (err) { return error(res, err.message, 500); }
};

exports.getSegmentDistribution = async (req, res) => {
  try {
    const dist = await svc().rfm.getDistribution();
    return success(res, dist);
  } catch (err) { return error(res, err.message, 500); }
};

// ── Manually trigger RFM for a user ───────────────────────────────────────
exports.analyzeUser = async (req, res) => {
  try {
    const result = await svc().rfm.analyze(req.params.userId);
    return success(res, result);
  } catch (err) { return error(res, err.message, 500); }
};

// ── Churn ─────────────────────────────────────────────────────────────────
exports.getChurnAlerts = async (req, res) => {
  try {
    const admin = getPrismaClient('admin');
    const since = new Date(Date.now() - 7 * 86400000);
    const rows  = await admin.opsChurnAlert.findMany({
      where:   { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take:    parseInt(req.query.limit) || 100,
    }).catch(() => []);
    return success(res, rows);
  } catch (err) { return error(res, err.message, 500); }
};

exports.triggerChurnScan = async (req, res) => {
  try {
    const atRisk = await svc().churn.scanAll({ limit: 500 });
    return success(res, { scanned: atRisk.length, atRisk });
  } catch (err) { return error(res, err.message, 500); }
};

// ── CLV ───────────────────────────────────────────────────────────────────
exports.getTopCLV = async (req, res) => {
  try {
    const top = await svc().clv.getTopUsers(parseInt(req.query.limit) || 20);
    return success(res, top);
  } catch (err) { return error(res, err.message, 500); }
};

// ── Tasks ─────────────────────────────────────────────────────────────────
exports.listTasks = async (req, res) => {
  try {
    const { status, assignedTo, type, page, limit } = req.query;
    const result = await svc().tasks.list({ status, assignedTo, type, page, limit });
    return paginate(res, result.tasks, { total: result.total, page: result.page, limit: Number(limit) || 20 });
  } catch (err) { return error(res, err.message, 500); }
};

exports.createTask = async (req, res) => {
  try {
    const task = await svc().tasks.autoAssign(req.body);
    return success(res, task, 'Task created', 201);
  } catch (err) { return error(res, err.message, 500); }
};

exports.completeTask = async (req, res) => {
  try {
    const task = await svc().tasks.complete(req.params.id, req.user?.id);
    return success(res, task);
  } catch (err) { return error(res, err.message, 500); }
};

exports.rebalanceTasks = async (req, res) => {
  try {
    const moved = await svc().tasks.rebalance();
    return success(res, { moved });
  } catch (err) { return error(res, err.message, 500); }
};

// ── Reports ───────────────────────────────────────────────────────────────
exports.getDailyReports = async (req, res) => {
  try {
    const days    = parseInt(req.query.days) || 7;
    const reports = await svc().report.getRecent(days);
    return success(res, reports);
  } catch (err) { return error(res, err.message, 500); }
};

exports.triggerDailyReport = async (req, res) => {
  try {
    const report = await svc().report.generateDaily();
    return success(res, report);
  } catch (err) { return error(res, err.message, 500); }
};

// ── Campaigns ─────────────────────────────────────────────────────────────
exports.getCampaignStats = async (req, res) => {
  try {
    const days  = parseInt(req.query.days) || 7;
    const stats = await svc().campaigns.getStats(days);
    return success(res, stats);
  } catch (err) { return error(res, err.message, 500); }
};

exports.getCampaignLog = async (req, res) => {
  try {
    const admin = getPrismaClient('admin');
    const since = new Date(Date.now() - (parseInt(req.query.days) || 7) * 86400000);
    const rows  = await admin.opsCampaignLog.findMany({
      where:   { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take:    100,
    }).catch(() => []);
    return success(res, rows);
  } catch (err) { return error(res, err.message, 500); }
};

exports.runCampaigns = async (req, res) => {
  try {
    const sent = await svc().campaigns.runAll();
    return success(res, { sent });
  } catch (err) { return error(res, err.message, 500); }
};

exports.runMarketing = async (req, res) => {
  try {
    const result = await svc().marketing.runAll();
    return success(res, result);
  } catch (err) { return error(res, err.message, 500); }
};

// ── Cash flow ─────────────────────────────────────────────────────────────
exports.getCashFlowForecast = async (req, res) => {
  try {
    const days     = parseInt(req.query.days) || 30;
    const forecast = await svc().cashflow.forecast(days);
    return success(res, forecast);
  } catch (err) { return error(res, err.message, 500); }
};

exports.getCashReserve = async (req, res) => {
  try {
    const reserve = await svc().cashflow.checkReserve();
    return success(res, reserve);
  } catch (err) { return error(res, err.message, 500); }
};

// ── Expenses ──────────────────────────────────────────────────────────────
exports.listExpenses = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await svc().expenses.list({ status, page, limit });
    return paginate(res, result.rows, { total: result.total, page: result.page, limit: Number(limit) || 20 });
  } catch (err) { return error(res, err.message, 500); }
};

exports.submitExpense = async (req, res) => {
  try {
    const admin   = getPrismaClient('admin');
    const { amount, category, note, title } = req.body;

    // Create the request record
    const expReq = await admin.opsExpenseRequest.create({
      data: {
        title:       title || category,
        amount:      Number(amount),
        category:    category || 'general',
        note:        note || '',
        status:      'pending',
        requestedBy: req.user?.id || null,
      },
    });

    // Evaluate auto-approval
    const decision = await svc().expenses.evaluate({
      id:          expReq.id,
      amount:      expReq.amount,
      category:    expReq.category,
      note:        expReq.note,
      requestedBy: req.user?.id,
    });

    return success(res, { expense: expReq, decision }, 'Submitted', 201);
  } catch (err) { return error(res, err.message, 500); }
};

// ── Ticket automation ─────────────────────────────────────────────────────
exports.runTicketAutoProcess = async (req, res) => {
  try {
    const processed = await svc().tickets.processAll();
    return success(res, { processed });
  } catch (err) { return error(res, err.message, 500); }
};
