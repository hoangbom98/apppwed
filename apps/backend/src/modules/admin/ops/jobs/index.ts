// @ts-nocheck
'use strict';
/**
 * Auto-Ops Cron Jobs — scheduled background tasks.
 *
 * Schedule matrix:
 *   06:00 daily  → daily report (all 5 projects)
 *   every hour   → RFM segment update (all projects, sampling)
 *   every 15 min → task rebalance
 *   every 30 min → churn risk scan (all projects)
 *   28th monthly → cash flow forecast
 *
 * Uses node-cron if available; falls back to setInterval for environments
 * that don't have node-cron installed.
 */
const logger = require('../../../../shared/services/logger');
const { getPrismaClient } = require('../../../../config/databases');

let cron;
try { cron = require('node-cron'); } catch { cron = null; }

// ── All 5 project DB clients ─────────────────────────────────────────────────
const ALL_PROJECTS = ['hub', 'game', 'trade', 'dating', 'sports'];

// ── Lazy service factory ────────────────────────────────────────────────────
function makeServices() {
  const admin = getPrismaClient('admin');

  // Build a project→prisma map for multi-project analytics
  const projectClients = {};
  for (const p of ALL_PROJECTS) {
    try { projectClients[p] = getPrismaClient(p); } catch { /* project not configured */ }
  }

  const RFMAnalyzer         = require('../analytics/rfmAnalyzer');
  const ChurnPredictor      = require('../analytics/churnPredictor');
  const ReportGenerator     = require('../analytics/reportGenerator');
  const TaskManager         = require('../automation/taskManager');
  const CampaignTrigger     = require('../automation/campaignTrigger');
  const TicketAutomation    = require('../automation/ticketAutomation');
  const MarketingAutomation = require('../automation/marketingAutomation');
  const CashFlowForecast    = require('../financial/cashFlowForecast');
  const InterestWorker      = require('../financial/interestWorker');

  return {
    // Multi-project analyzers — receive all project clients
    rfm:       new RFMAnalyzer(projectClients, admin),
    churn:     new ChurnPredictor(projectClients, admin),
    report:    new ReportGenerator(projectClients, admin),
    marketing: new MarketingAutomation(projectClients, admin),
    cashflow:  new CashFlowForecast(projectClients.game, admin),  // financial still game-primary

    // Admin-only services
    tasks:      new TaskManager(admin),
    campaigns:  new CampaignTrigger(admin),
    tickets:    new TicketAutomation(admin),
    // Group Finance workers
    interest:   new InterestWorker(admin),
  };
}

// ── Safe job runner ─────────────────────────────────────────────────────────
async function run(name, fn) {
  try {
    logger.info(`[OpsJob] START ${name}`);
    await fn();
    logger.info(`[OpsJob] DONE  ${name}`);
  } catch (err) {
    logger.error(`[OpsJob] FAIL  ${name}: ${err.message}`);
  }
}

// ── Register all cron jobs ──────────────────────────────────────────────────
function register() {
  if (!cron) {
    logger.warn('[OpsJobs] node-cron not installed — auto-ops jobs disabled');
    return;
  }

  const svc = makeServices();

  // Daily report at 06:00 (all projects)
  cron.schedule('0 6 * * *', () => run('dailyReport', () => svc.report.generateDaily()));

  // Hourly RFM update (all projects, first 500 users per project as rolling batch)
  cron.schedule('0 * * * *', () => run('segmentUpdate', () => svc.rfm.updateAll()));

  // Every 15 min: rebalance task load
  cron.schedule('*/15 * * * *', () => run('taskRebalance', () => svc.tasks.rebalance()));

  // Every 30 min: churn risk scan (all projects)
  cron.schedule('*/30 * * * *', () => run('churnScan', () => svc.churn.scanAll({ limit: 500 })));

  // Every 30 min: auto-process open tickets
  cron.schedule('*/30 * * * *', () => run('ticketAutoProcess', () => svc.tickets.processAll()));

  // Hourly: marketing automation runs (all projects)
  cron.schedule('30 * * * *', () => run('marketingAutomation', () => svc.marketing.runAll()));

  // Daily at 07:00: campaign triggers based on segments
  cron.schedule('0 7 * * *', () => run('campaignTrigger', () => svc.campaigns.runAll()));

  // Monthly on 28th: cash flow forecast + reserve check
  cron.schedule('0 0 28 * *', () => run('cashFlowForecast', () => svc.cashflow.checkReserve()));

  // Daily at 00:05: internal loan interest calculation (Group Finance)
  cron.schedule('5 0 * * *', () => run('internalInterest', () => svc.interest.run()));

  logger.info(`[OpsJobs] All auto-ops cron jobs registered (projects: ${ALL_PROJECTS.join(', ')})`);
}

module.exports = { register, ALL_PROJECTS };
