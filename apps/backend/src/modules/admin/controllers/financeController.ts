// @ts-nocheck
/* eslint-disable */

// backend/src/modules/admin/controllers/financeController.ts
// Finance summary — aggregates deposit/withdrawal/bet stats from game DB
// GET /api/admin/finance/summary
'use strict';
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error }  = require('../../../shared/utils/response');

const safe = async (fn) => { try { return await fn(); } catch { return null; } };

exports.getSummary = async (req, res) => {
  try {
    const project = req.project || 'game';
    const db      = getPrismaClient(project);
    const days    = Math.min(90, Math.max(1, parseInt(req.query.days || '30')));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodStart = new Date(today);
    periodStart.setDate(today.getDate() - days);

    // ── Aggregate totals for the period ────────────────────────────────────────
    const [depAgg, withAgg, depPending, withPending, depToday, withToday] = await Promise.all([
      // total completed deposits in period
      safe(() => db.depositOrder.aggregate({
        where:  { status: 'success', createdAt: { gte: periodStart } },
        _sum:   { amount: true },
        _count: { _all: true },
      })),
      // total completed withdrawals in period
      safe(() => db.withdrawOrder.aggregate({
        where:  { status: 'success', createdAt: { gte: periodStart } },
        _sum:   { amount: true },
        _count: { _all: true },
      })),
      // pending deposits (all time — for the queue badge)
      safe(() => db.depositOrder.count({ where: { status: 'pending' } })),
      // pending withdrawals
      safe(() => db.withdrawOrder.count({ where: { status: 'pending' } })),
      // today deposits
      safe(() => db.depositOrder.aggregate({
        where: { status: 'success', createdAt: { gte: today } },
        _sum:  { amount: true },
      })),
      // today withdrawals
      safe(() => db.withdrawOrder.aggregate({
        where: { status: 'success', createdAt: { gte: today } },
        _sum:  { amount: true },
      })),
    ]);

    // ── Method breakdown (deposit channel distribution) ────────────────────────
    const channelBreakdown = await safe(() =>
      db.depositOrder.groupBy({
        by:    ['method'],
        where: { status: 'success', createdAt: { gte: periodStart } },
        _sum:  { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
      })
    );

    // ── 7-day daily trend ──────────────────────────────────────────────────────
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(today.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);

      const [dep, wit] = await Promise.all([
        safe(() => db.depositOrder.aggregate({
          where: { status: 'success', createdAt: { gte: dayStart, lt: dayEnd } },
          _sum:  { amount: true },
          _count: { _all: true },
        })),
        safe(() => db.withdrawOrder.aggregate({
          where: { status: 'success', createdAt: { gte: dayStart, lt: dayEnd } },
          _sum:  { amount: true },
          _count: { _all: true },
        })),
      ]);
      trend.push({
        date:          dayStart.toISOString().slice(0, 10),
        deposits:      Number(dep?._sum?.amount   || 0),
        withdrawals:   Number(wit?._sum?.amount   || 0),
        depositCount:  dep?._count?._all  ?? 0,
        withdrawCount: wit?._count?._all  ?? 0,
        net:           Number(dep?._sum?.amount || 0) - Number(wit?._sum?.amount || 0),
      });
    }

    const totalDeposits    = Number(depAgg?._sum?.amount  || 0);
    const totalWithdrawals = Number(withAgg?._sum?.amount || 0);

    return success(res, {
      period: { days, from: periodStart.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
      totals: {
        deposits:       totalDeposits,
        withdrawals:    totalWithdrawals,
        net:            totalDeposits - totalWithdrawals,
        depositCount:   depAgg?._count?._all  ?? 0,
        withdrawCount:  withAgg?._count?._all ?? 0,
      },
      pending: {
        deposits:    pendingDeposits  ?? 0,
        withdrawals: pendingWithdrawals ?? 0,
      },
      today: {
        deposits:    Number(depToday?._sum?.amount  || 0),
        withdrawals: Number(withToday?._sum?.amount || 0),
      },
      channels: (channelBreakdown ?? []).map(c => ({
        method: c.method,
        total:  Number(c._sum?.amount || 0),
        count:  c._count?._all ?? 0,
      })),
      trend,
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};
