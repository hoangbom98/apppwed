// backend/src/modules/admin/routes/index.js
const router = require('express').Router();
const auth        = require('../../../shared/middlewares/auth');
const adminGuard  = require('../../../shared/middlewares/adminGuard');

// ── Controllers ───────────────────────────────────────────────────────────────
const authCtrl        = require('../controllers/authController');
const dashboardCtrl   = require('../controllers/dashboardController');
const statsCtrl       = require('../controllers/statsController');
const userCtrl        = require('../controllers/userController');
const transactionCtrl = require('../controllers/transactionController');
const gameConfigCtrl  = require('../controllers/gameConfigController');
const settingCtrl     = require('../controllers/settingController');
const uiConfigCtrl    = require('../controllers/uiConfigController');
const announcementCtrl = require('../controllers/announcementController');
const auditCtrl       = require('../controllers/auditController');
const adminUserCtrl   = require('../controllers/adminUserController');
const financeCtrl     = require('../controllers/financeController');
const lotteryCtrl     = require('../controllers/lotteryController');
const agentCtrl       = require('../controllers/agentController');
const promotionCtrl   = require('../controllers/promotionController');
const riskCtrl        = require('../controllers/riskController');
const opsCtrl          = require('../controllers/opsController');
const securityCtrl     = require('../controllers/securityController');
const appCatalogCtrl   = require('../controllers/appCatalogController');
const monitorCtrl      = require('../controllers/monitorController');
const gameProviderCtrl = require('../controllers/gameProviderController');
const paymentAdminRoutes  = require('../../../shared/routes/payment-admin.routes');
const mineRoutes           = require('./mine.routes');
const notifCtrl            = require('../controllers/notificationController');

// ── Auth (public) ─────────────────────────────────────────────────────────────
router.post('/auth/login',   authCtrl.login);
router.post('/auth/refresh', authCtrl.refresh);

// ─────────────────────────────────────────────────────────────────────────────
// ALL ROUTES BELOW REQUIRE: valid JWT + admin/superadmin role
// ─────────────────────────────────────────────────────────────────────────────
router.use(auth, adminGuard);

// ── Auth me ────────────────────────────────────────────────────────────────
router.get('/auth/me', authCtrl.me);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard',                dashboardCtrl.getStats);
router.get('/dashboard/chart/revenue',  dashboardCtrl.getRevenueChart);
router.get('/dashboard/project-stats',  dashboardCtrl.getProjectStats ?? dashboardCtrl.getStats);

// ── Quick Stats (legacy + extended) ───────────────────────────────────────────
router.get('/stats',                      statsCtrl.getStats);
router.get('/stats/finance',              statsCtrl.getFinanceStats);
router.get('/stats/revenue-chart',        statsCtrl.getRevenueChart);
router.get('/stats/system',               statsCtrl.getSystemInfo);
router.post('/stats/system/maintenance',  statsCtrl.setMaintenanceMode);

// ── Admin Users (quản lý admin accounts) ──────────────────────────────────────
router.get('/admins',                   adminUserCtrl.list);
router.get('/admins/:id',               adminUserCtrl.get);
router.post('/admins',                  adminUserCtrl.create);
router.patch('/admins/:id',             adminUserCtrl.update);
router.patch('/admins/:id/password',    adminUserCtrl.resetPassword);
router.delete('/admins/:id',            adminUserCtrl.remove);

// ── Users (cross-project member management) ───────────────────────────────────
router.get('/users/summary',            userCtrl.getUserSummary);
router.get('/users',                    userCtrl.listUsers);
router.get('/users/:id',                userCtrl.getUserDetail);
router.patch('/users/:id/status',       userCtrl.toggleUserStatus);
router.post('/users/:id/balance',       userCtrl.adjustBalance);

// ── Finance — Transactions ────────────────────────────────────────────────────
router.get('/finance/summary',                  financeCtrl.getSummary);
router.get('/finance/transactions',             transactionCtrl.listTransactions);
router.get('/finance/deposits',                 transactionCtrl.listDeposits);
router.patch('/finance/deposits/:id/approve',   transactionCtrl.approveDeposit);
router.patch('/finance/deposits/:id/reject',    transactionCtrl.rejectDeposit);
router.get('/finance/withdrawals',              transactionCtrl.listWithdrawals);
router.patch('/finance/withdrawals/:id/approve', transactionCtrl.approveWithdrawal);
router.patch('/finance/withdrawals/:id/reject',  transactionCtrl.rejectWithdrawal);

// Legacy alias (backward compat for older frontend code)
router.get('/transactions', transactionCtrl.listTransactions);

// ── Game Config (project registry & settings) ─────────────────────────────────
router.get('/game/config',                       gameConfigCtrl.getAll);
router.get('/game/config/:project',              gameConfigCtrl.getByProject);
router.put('/game/config/:project',              gameConfigCtrl.update);

// ── Game Providers / Aggregators ──────────────────────────────────────────────
router.get('/game/providers',                    gameProviderCtrl.list);
router.get('/game/providers/:id',                gameProviderCtrl.getDetail);
router.post('/game/providers',                   gameProviderCtrl.create);
router.patch('/game/providers/:id',              gameProviderCtrl.update);
router.patch('/game/providers/:id/status',       gameProviderCtrl.toggleStatus);
router.get('/game/providers/:id/products',       gameProviderCtrl.listProducts);

// ── Security Settings (must be before /settings/:key to avoid shadowing) ───────
router.get('/settings/security',                 securityCtrl.get);
router.post('/settings/security',                securityCtrl.save);
router.post('/settings/security/reset',          securityCtrl.reset);
router.post('/settings/security/test-captcha',   securityCtrl.testCaptcha);

// ── System Settings ───────────────────────────────────────────────────────────
router.get('/settings',                 settingCtrl.getAll);
router.get('/settings/:key',            settingCtrl.getOne);
router.put('/settings/:key',            settingCtrl.update);
router.post('/settings',                settingCtrl.create);
router.delete('/settings/:key',         settingCtrl.remove);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements',            announcementCtrl.list);
router.post('/announcements',           announcementCtrl.create);
router.patch('/announcements/:id',      announcementCtrl.update);
router.delete('/announcements/:id',     announcementCtrl.remove);

// ── Agents ───────────────────────────────────────────────────────────────────
router.get('/agents',                                        agentCtrl.list);
router.get('/agents/:id',                                    agentCtrl.getDetail);
router.post('/agents/:id/commission/calculate',              agentCtrl.calculateCommission);
router.post('/agents/:id/commission/:commId/pay',            agentCtrl.payCommission);

// ── Promotions ────────────────────────────────────────────────────────────────
router.get('/promotions',                                    promotionCtrl.list);
router.get('/promotions/:id',                                promotionCtrl.getDetail);
router.post('/promotions',                                   promotionCtrl.create);
router.patch('/promotions/:id',                              promotionCtrl.update);
router.delete('/promotions/:id',                             promotionCtrl.remove);
router.patch('/promotions/:id/status',                       promotionCtrl.toggleStatus);
router.get('/promotions/:id/participants',                   promotionCtrl.listParticipants);
router.patch('/promotions/participants/:pid/cancel',         promotionCtrl.cancelParticipant);

// ── Lottery ───────────────────────────────────────────────────────────────────
router.get('/lottery',                  lotteryCtrl.list);
router.get('/lottery/bets',             lotteryCtrl.listBets);
router.get('/lottery/bets/:id',         lotteryCtrl.getBet);
router.patch('/lottery/bets/:id/refund', lotteryCtrl.refundBet);
router.get('/lottery/rounds',           lotteryCtrl.listRounds);
router.get('/logs/audit',               auditCtrl.getLogs);

// ── Risk Detection & Response Engine ─────────────────────────────────────────
router.get('/risk/summary',                       riskCtrl.getSummary);

// Suspicious users (high/medium risk score list — used by RiskAudit.jsx)
router.get('/risk/users',                         riskCtrl.getSuspiciousUsers);

// Risk Alerts
router.get('/risk/alerts',                        riskCtrl.listAlerts);
router.get('/risk/alerts/:id',                    riskCtrl.getAlert);
router.patch('/risk/alerts/:id',                  riskCtrl.updateAlert);

// AML Alerts
router.get('/risk/aml',                           riskCtrl.listAmlAlerts);
router.patch('/risk/aml/:id',                     riskCtrl.updateAmlAlert);

// Security Logs
router.get('/risk/security-logs',                 riskCtrl.listSecurityLogs);

// IP Blacklist
router.get('/risk/ip-blacklist',                  riskCtrl.listIpBlacklist);
router.post('/risk/ip-blacklist',                 riskCtrl.addIpBlacklist);
router.delete('/risk/ip-blacklist/:ip',           riskCtrl.removeIpBlacklist);

// User risk score & actions (must come AFTER /risk/users to avoid param conflict)
router.get('/risk/users/:userId/score',           riskCtrl.getUserRiskScore);
router.post('/risk/users/:userId/recalculate',    riskCtrl.recalculateUserScore);
router.post('/risk/users/:userId/lock',           riskCtrl.lockUser);

// Risk Rules (configurable detection thresholds)
router.get('/risk/rules',                         riskCtrl.listRules);
router.patch('/risk/rules/:id',                   riskCtrl.updateRule);

// ── UI / Branding / Feature Config (per-project) ──────────────────────────────
router.get('/ui-config',                uiConfigCtrl.getAll);
router.put('/ui-config',                uiConfigCtrl.bulkUpdate);
router.post('/ui-config/create',        uiConfigCtrl.create);
router.delete('/ui-config/:id',         uiConfigCtrl.remove);

// Legacy alias: /admin/config → same as ui-config (backward compat for Config.jsx)
router.get('/config',                   uiConfigCtrl.getAll);
router.put('/config',                   uiConfigCtrl.bulkUpdate);

// ── App Catalog ───────────────────────────────────────────────────────────────
router.get('/app-catalog',              appCatalogCtrl.list);
router.get('/app-catalog/:id',          appCatalogCtrl.get);
router.post('/app-catalog',             appCatalogCtrl.create);
router.put('/app-catalog/:id',          appCatalogCtrl.update);
router.delete('/app-catalog/:id',       appCatalogCtrl.destroy);

// ── Payment Gateway Management ────────────────────────────────────────────────
router.use('/payment/gateways',         paymentAdminRoutes);

// ── Mine (personal profile) ───────────────────────────────────────────────────
router.use('/mine', mineRoutes);

// ── Auto-Ops Platform ─────────────────────────────────────────────────────────
// Overview
router.get('/ops/stats',                      opsCtrl.getStats);

// RFM / Segmentation
router.get('/ops/segments',                   opsCtrl.getSegments);
router.get('/ops/segments/distribution',      opsCtrl.getSegmentDistribution);
router.post('/ops/users/:userId/analyze',     opsCtrl.analyzeUser);

// Churn
router.get('/ops/churn/alerts',               opsCtrl.getChurnAlerts);
router.post('/ops/churn/scan',                opsCtrl.triggerChurnScan);

// CLV
router.get('/ops/clv/top',                    opsCtrl.getTopCLV);

// Tasks
router.get('/ops/tasks',                      opsCtrl.listTasks);
router.post('/ops/tasks',                     opsCtrl.createTask);
router.patch('/ops/tasks/:id/complete',       opsCtrl.completeTask);
router.post('/ops/tasks/rebalance',           opsCtrl.rebalanceTasks);

// Reports
router.get('/ops/reports/daily',              opsCtrl.getDailyReports);
router.post('/ops/reports/generate',          opsCtrl.triggerDailyReport);

// Campaigns & Marketing
router.get('/ops/campaigns/stats',            opsCtrl.getCampaignStats);
router.get('/ops/campaigns/log',              opsCtrl.getCampaignLog);
router.post('/ops/campaigns/run',             opsCtrl.runCampaigns);
router.post('/ops/marketing/run',             opsCtrl.runMarketing);

// Cash Flow
router.get('/ops/finance/forecast',           opsCtrl.getCashFlowForecast);
router.get('/ops/finance/reserve',            opsCtrl.getCashReserve);

// Expenses
router.get('/ops/finance/expenses',           opsCtrl.listExpenses);
router.post('/ops/finance/expenses',          opsCtrl.submitExpense);

// Ticket automation
router.post('/ops/tickets/auto-process',      opsCtrl.runTicketAutoProcess);

// ── Realtime Monitor ──────────────────────────────────────────────────────────
router.get('/monitor/alerts',                monitorCtrl.listAlerts);
router.patch('/monitor/alerts/:id/ack',      monitorCtrl.acknowledgeAlert);
router.patch('/monitor/alerts/:id/resolve',  monitorCtrl.resolveAlert);
router.get('/monitor/logs',                  monitorCtrl.listAdminLogs);
router.get('/monitor/online',                monitorCtrl.getOnlineStats);

// ── Push Notifications ────────────────────────────────────────────────────────
router.get('/notifications/status',        notifCtrl.getNotificationStatus);
router.post('/notifications/send',         notifCtrl.sendNotification);
router.post('/notifications/send-user',    notifCtrl.sendToUser);
router.post('/notifications/broadcast',    notifCtrl.broadcastNotification);

module.exports = router;
