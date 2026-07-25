// @ts-nocheck
'use strict';
/**
 * groupFinanceController — REST API for Group Finance admin panel.
 *
 * Routes (all under /api/admin/group-finance):
 *   GET  /fee-configs                    — list all fee configs
 *   GET  /fee-configs/source/:source     — list active configs for a source
 *   POST /fee-configs                    — create or update a fee config (upsert)
 *   POST /fee-configs/seed               — seed default recommended fees
 *   PATCH /fee-configs/:id/toggle        — toggle isActive
 *   DELETE /fee-configs/:id              — hard delete
 *
 *   GET  /project-balances               — snapshot of all sub-project pool positions
 *   GET  /loans                          — list internal loans
 *   GET  /fee-logs                       — paginated fee collection log
 *   GET  /pnl?from=YYYY-MM-DD&to=YYYY-MM-DD — P&L report by date range
 *   POST /interest/run                   — manually trigger interest worker (admin only)
 */

const { getPrismaClient }   = require('../../../shared/config/databases');
const { success, error }    = require('../../../shared/utils/response');
const GroupFinanceService   = require('../services/groupFinanceService');
const FeeConfigService      = require('../services/feeConfigService');
const InterestWorker        = require('../ops/financial/interestWorker');
const ReportGenerator       = require('../ops/analytics/reportGenerator');
const { getPrismaClient: getAdminPrisma } = require('../../../shared/config/databases');

// ── Lazy service factory ─────────────────────────────────────────────────────
let _svc: { gf: any; feeConfig: any; interest: any; report: any } | null = null;

function getServices() {
  if (!_svc) {
    const admin = getAdminPrisma('admin');
    const gf    = new GroupFinanceService(admin);

    // Build projectClients for ReportGenerator
    const ALL_PROJECTS = ['hub', 'game', 'trade', 'dating', 'sports'];
    const projectClients: Record<string, any> = {};
    for (const p of ALL_PROJECTS) {
      try { projectClients[p] = getPrismaClient(p); } catch { /* not configured */ }
    }

    _svc = {
      gf,
      feeConfig: new FeeConfigService(admin, gf),
      interest:  new InterestWorker(admin),
      report:    new ReportGenerator(projectClients, admin),
    };
  }
  return _svc;
}

// ── Fee Config ───────────────────────────────────────────────────────────────

exports.listFeeConfigs = async (req, res) => {
  try {
    const { feeConfig } = getServices();
    const data = await feeConfig.list();
    return success(res, data);
  } catch (e) {
    return error(res, e.message, e.status || 500);
  }
};

exports.listFeeConfigsBySource = async (req, res) => {
  try {
    const { feeConfig } = getServices();
    const data = await feeConfig.listBySource(req.params.source);
    return success(res, data);
  } catch (e) {
    return error(res, e.message, e.status || 500);
  }
};

exports.upsertFeeConfig = async (req, res) => {
  try {
    const { source, txType, feeType, value } = req.body;
    if (!source || !txType || !feeType || value === undefined) {
      return error(res, 'source, txType, feeType và value là bắt buộc', 400);
    }
    const { feeConfig } = getServices();
    const data = await feeConfig.upsert(req.body);
    return success(res, data, 'Cấu hình phí đã được cập nhật');
  } catch (e) {
    return error(res, e.message, e.status || 500);
  }
};

exports.seedFeeConfigs = async (req, res) => {
  try {
    const { feeConfig } = getServices();
    await feeConfig.seedDefaults();
    return success(res, null, 'Đã seed cấu hình phí mặc định');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.toggleFeeConfig = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return error(res, 'isActive phải là boolean', 400);
    }
    const { feeConfig } = getServices();
    const data = await feeConfig.setActive(req.params.id, isActive);
    return success(res, data, `Phí đã được ${isActive ? 'kích hoạt' : 'vô hiệu hoá'}`);
  } catch (e) {
    return error(res, e.message, e.status || 500);
  }
};

exports.deleteFeeConfig = async (req, res) => {
  try {
    const { feeConfig } = getServices();
    await feeConfig.delete(req.params.id);
    return success(res, null, 'Cấu hình phí đã xoá');
  } catch (e) {
    return error(res, e.message, e.status || 500);
  }
};

// ── Project Balances ──────────────────────────────────────────────────────────

exports.getProjectBalances = async (req, res) => {
  try {
    const { report } = getServices();
    const data = await report.getProjectBalances();
    return success(res, data);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── Internal Loans ────────────────────────────────────────────────────────────

exports.listLoans = async (req, res) => {
  try {
    const admin  = getAdminPrisma('admin');
    const status = req.query.status || undefined;
    const loans  = await admin.internalLoan.findMany({
      where:   status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take:    100,
    });
    return success(res, loans.map((l: any) => ({
      ...l,
      amount:        Number(l.amount),
      interestRate:  Number(l.interestRate),
      totalInterest: Number(l.totalInterest),
    })));
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── Fee Logs ──────────────────────────────────────────────────────────────────

exports.listFeeLogs = async (req, res) => {
  try {
    const admin  = getAdminPrisma('admin');
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(100, parseInt(req.query.limit || '20'));
    const source = req.query.source as string | undefined;

    const where: any = {};
    if (source) where.source = source.toUpperCase();

    const [items, total] = await Promise.all([
      admin.feeLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      admin.feeLog.count({ where }),
    ]);

    return success(res, {
      items: items.map((f: any) => ({
        ...f,
        grossAmount: Number(f.grossAmount),
        feeAmount:   Number(f.feeAmount),
        netAmount:   Number(f.netAmount),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── P&L Report ────────────────────────────────────────────────────────────────

exports.getPnL = async (req, res) => {
  try {
    const { report } = getServices();
    const now = new Date();

    // Default: yesterday → now
    const from = req.query.from
      ? new Date(req.query.from as string)
      : new Date(now.getTime() - 86400000);
    const to = req.query.to ? new Date(req.query.to as string) : now;

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return error(res, 'from và to phải là ngày hợp lệ (YYYY-MM-DD)', 400);
    }

    const [pnl, projectBalances] = await Promise.all([
      report.generatePnL(from, to),
      report.getProjectBalances(),
    ]);

    const totalFee        = Object.values(pnl).reduce((s: number, p: any) => s + p.totalFee,        0);
    const totalInterest   = Object.values(pnl).reduce((s: number, p: any) => s + p.totalInterest,   0);
    const groupNetRevenue = Object.values(pnl).reduce((s: number, p: any) => s + p.netRevenue,       0);

    return success(res, {
      period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
      pnlBySource: pnl,
      projectBalances,
      totals: { totalFee, totalInterest, groupNetRevenue },
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ── Interest worker (manual trigger) ─────────────────────────────────────────

exports.runInterest = async (req, res) => {
  try {
    const { interest } = getServices();
    const result = await interest.run();
    return success(res, result, 'Tính lãi vay nội bộ hoàn tất');
  } catch (e) {
    return error(res, e.message, 500);
  }
};
