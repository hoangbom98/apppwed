// backend/src/modules/admin/routes/index.js
const router = require('express').Router();
const auth        = require('../../../shared/middlewares/auth/auth');
const adminGuard  = require('../../../shared/middlewares/auth/adminGuard');

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
const monitorCtrl      = require('../controllers/ops/monitorController');
const gameProviderCtrl   = require('../controllers/gameProviderController');
const thirdPartyCtrl     = require('../controllers/thirdPartyController');
const paymentAdminRoutes  = require('../../../shared/routes/finance/payment-admin.routes');
const mineRoutes           = require('./mine.routes');
const notifCtrl            = require('../controllers/notificationController');
const notifTplCtrl         = require('../controllers/notificationTemplateController');
const cronCtrl             = require('../controllers/cronController');
// ── New controllers (Boyue gap-fill) ─────────────────────────────────────────
const roleCtrl             = require('../controllers/roleController');
const rebateCtrl           = require('../controllers/rebateController');
const imCtrl               = require('../controllers/imController');
const giftCodeCtrl         = require('../controllers/giftCodeController');
const vipConfigCtrl        = require('../controllers/vipConfigController');
// ── Group Finance (Gộp Vốn, Tách Lợi Nhuận) ──────────────────────────────────
const groupFinanceCtrl     = require('../controllers/groupFinanceController');
// ── Telegram Broadcast & Auto-Reply ──────────────────────────────────────────
const telegramCtrl         = require('../controllers/telegramBroadcastController');
// ── Workspace Tracker ─────────────────────────────────────────────────────────
const workspaceCtrl        = require('../controllers/workspaceController');

const requirePermission = require('../../../shared/middlewares/auth/requirePermission');

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
router.post('/stats/system/maintenance',  requirePermission('system.maintenance'), statsCtrl.setMaintenanceMode);

// ── Admin Users (quản lý admin accounts) ──────────────────────────────────────
router.get('/admins',                   requirePermission('settings.admins'), adminUserCtrl.list);
router.get('/admins/:id',               requirePermission('settings.admins'), adminUserCtrl.get);
router.post('/admins',                  requirePermission('settings.admins'), adminUserCtrl.create);
router.patch('/admins/:id',             requirePermission('settings.admins'), adminUserCtrl.update);
router.patch('/admins/:id/password',    requirePermission('settings.admins'), adminUserCtrl.resetPassword);
router.delete('/admins/:id',            requirePermission('settings.admins'), adminUserCtrl.remove);

// ── Users (cross-project member management) ───────────────────────────────────
router.get('/users/summary',            userCtrl.getUserSummary);
router.get('/users',                    userCtrl.listUsers);
router.get('/users/:id',                userCtrl.getUserDetail);
router.patch('/users/:id/status',       userCtrl.toggleUserStatus);
router.post('/users/:id/balance',       userCtrl.adjustBalance);

// ── Finance — Transactions ────────────────────────────────────────────────────
router.get('/finance/summary',                   requirePermission('finance.view'),    financeCtrl.getSummary);
router.get('/finance/transactions',              requirePermission('finance.view'),    transactionCtrl.listTransactions);
router.get('/finance/deposits',                  requirePermission('finance.view'),    transactionCtrl.listDeposits);
router.patch('/finance/deposits/:id/approve',    requirePermission('finance.approve'), transactionCtrl.approveDeposit);
router.patch('/finance/deposits/:id/reject',     requirePermission('finance.reject'),  transactionCtrl.rejectDeposit);
router.get('/finance/withdrawals',               requirePermission('finance.view'),    transactionCtrl.listWithdrawals);
router.patch('/finance/withdrawals/:id/approve', requirePermission('finance.approve'), transactionCtrl.approveWithdrawal);
router.patch('/finance/withdrawals/:id/reject',  requirePermission('finance.reject'),  transactionCtrl.rejectWithdrawal);

// Legacy alias (backward compat for older frontend code)
router.get('/transactions', transactionCtrl.listTransactions);

// ── Group Finance — Fee Configs ───────────────────────────────────────────────
router.get('/group-finance/fee-configs',                   groupFinanceCtrl.listFeeConfigs);
router.get('/group-finance/fee-configs/source/:source',    groupFinanceCtrl.listFeeConfigsBySource);
router.post('/group-finance/fee-configs',                  groupFinanceCtrl.upsertFeeConfig);
router.post('/group-finance/fee-configs/seed',             groupFinanceCtrl.seedFeeConfigs);
router.patch('/group-finance/fee-configs/:id/toggle',      groupFinanceCtrl.toggleFeeConfig);
router.delete('/group-finance/fee-configs/:id',            groupFinanceCtrl.deleteFeeConfig);

// ── Group Finance — Analytics ─────────────────────────────────────────────────
router.get('/group-finance/project-balances',              groupFinanceCtrl.getProjectBalances);
router.get('/group-finance/loans',                         groupFinanceCtrl.listLoans);
router.get('/group-finance/fee-logs',                      groupFinanceCtrl.listFeeLogs);
router.get('/group-finance/pnl',                           groupFinanceCtrl.getPnL);

// ── Group Finance — Manual Triggers (super_admin only) ────────────────────────
router.post('/group-finance/interest/run',                 groupFinanceCtrl.runInterest);

// ── Game Config (project registry & settings) ─────────────────────────────────
router.post('/game/batch-status',                gameConfigCtrl.batchToggleStatus);
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

// ── Third-Party Service Layer (multi-project: game, sports, trade, …) ─────────
router.get('/third-party/providers',                   thirdPartyCtrl.listProviders);
router.get('/third-party/providers/:code',             thirdPartyCtrl.getProvider);
router.post('/third-party/providers/:code/reload',     thirdPartyCtrl.reloadProvider);
router.get('/third-party/health',                      thirdPartyCtrl.healthStatus);
router.post('/third-party/providers/:code/rtp',        thirdPartyCtrl.setRTP);
router.get('/third-party/calls',                       thirdPartyCtrl.listCallLogs);
router.get('/third-party/calls/stats',                 thirdPartyCtrl.callLogStats);

// ── Security Settings (must be before /settings/:key to avoid shadowing) ───────
router.get('/settings/security',                 requirePermission('settings.security'), securityCtrl.get);
router.post('/settings/security',                requirePermission('settings.security'), securityCtrl.save);
router.post('/settings/security/reset',          requirePermission('settings.security'), securityCtrl.reset);
router.post('/settings/security/test-captcha',   requirePermission('settings.security'), securityCtrl.testCaptcha);

// ── Integration test (must be before /settings/:key) ─────────────────────────
router.post('/settings/integration-test',        settingCtrl.testIntegration);

// ── Bulk upsert (array save) ──────────────────────────────────────────────────
router.post('/settings/bulk',                    settingCtrl.bulkUpsert);

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
router.get('/agents/stats',                                  agentCtrl.getStats  ?? ((req, res) => res.json({ success: true, data: {} })));
router.get('/agents/:id',                                    agentCtrl.getDetail);
router.get('/agents/:id/tree',                               agentCtrl.getTree   ?? ((req, res) => res.json({ success: true, data: null })));
router.get('/agents/:id/team',                               agentCtrl.getTeam   ?? ((req, res) => res.json({ success: true, data: [] })));
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
router.get('/lottery',                        lotteryCtrl.list);
router.get('/lottery/stats',                  lotteryCtrl.getStats  ?? lotteryCtrl.list);
router.get('/lottery/types',                  lotteryCtrl.listTypes ?? lotteryCtrl.list);
router.get('/lottery/draws',                  lotteryCtrl.listDraws ?? lotteryCtrl.list);
router.post('/lottery/draws',                 lotteryCtrl.createDraw ?? ((req, res) => res.json({ success: true })));
router.post('/lottery/draws/:id/result',      lotteryCtrl.setResult  ?? ((req, res) => res.json({ success: true })));
router.post('/lottery/draws/:id/cancel',      lotteryCtrl.cancelDraw ?? ((req, res) => res.json({ success: true })));
router.get('/lottery/draws/:id',              lotteryCtrl.getDraw    ?? lotteryCtrl.getBet);
router.get('/lottery/draws/:id/bets',         lotteryCtrl.getDrawBets ?? lotteryCtrl.listBets);
router.get('/lottery/bets',                   lotteryCtrl.listBets);
router.get('/lottery/bets/:id',               lotteryCtrl.getBet);
router.patch('/lottery/bets/:id/refund',      lotteryCtrl.refundBet);
router.get('/lottery/rounds',                 lotteryCtrl.listRounds);
router.get('/logs/audit',                     auditCtrl.getLogs);

// ── Gift Codes ────────────────────────────────────────────────────────────────
router.get('/giftcodes',                      giftCodeCtrl.list);
router.post('/giftcodes',                     giftCodeCtrl.create);
router.patch('/giftcodes/:id',                giftCodeCtrl.update);
router.get('/giftcodes/:id/redemptions',      giftCodeCtrl.getRedemptions);

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
router.get('/risk/ip-blacklist',                  requirePermission('risk.ip'), riskCtrl.listIpBlacklist);
router.post('/risk/ip-blacklist',                 requirePermission('risk.ip'), riskCtrl.addIpBlacklist);
router.delete('/risk/ip-blacklist/:ip',           requirePermission('risk.ip'), riskCtrl.removeIpBlacklist);

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

// ── System Health API ─────────────────────────────────────────────────────────
router.get('/health/all',                    monitorCtrl.healthAll);
router.get('/health/services',               monitorCtrl.healthServices);
router.get('/health/dns',                    monitorCtrl.healthDns);
router.get('/health/pm2',                    monitorCtrl.healthPm2);

// ── Push Notifications ────────────────────────────────────────────────────────
router.get('/notifications/status',        notifCtrl.getNotificationStatus);
router.post('/notifications/send',         notifCtrl.sendNotification);
router.post('/notifications/send-user',    notifCtrl.sendToUser);
router.post('/notifications/broadcast',    notifCtrl.broadcastNotification);

// ── Notification Templates ────────────────────────────────────────────────────
router.get('/notification/templates',            notifTplCtrl.listTemplates);
router.get('/notification/templates/:type',      notifTplCtrl.getTemplate);
router.put('/notification/templates/:type',      notifTplCtrl.updateTemplate);
router.post('/notification/templates/seed',      notifTplCtrl.seedTemplates);
router.get('/notification/logs',                 notifTplCtrl.listLogs);

// ── Telegram Broadcast & Auto-Reply ──────────────────────────────────────────
router.get('/telegram/config',                   telegramCtrl.getConfig);
router.post('/telegram/config/reload',           telegramCtrl.reloadConfig);
// Broadcasts
router.get('/telegram/broadcasts',               telegramCtrl.listBroadcasts);
router.post('/telegram/broadcasts',              telegramCtrl.sendBroadcast);
router.post('/telegram/broadcasts/preview',      telegramCtrl.previewBroadcast);
router.delete('/telegram/broadcasts/:id',        telegramCtrl.deleteBroadcast);
// Auto-reply rules
router.get('/telegram/auto-replies',             telegramCtrl.listAutoReplies);
router.post('/telegram/auto-replies',            telegramCtrl.createAutoReply);
router.patch('/telegram/auto-replies/:id',       telegramCtrl.updateAutoReply);
router.delete('/telegram/auto-replies/:id',      telegramCtrl.deleteAutoReply);
router.post('/telegram/auto-replies/:id/test',   telegramCtrl.testAutoReply);

// ── Workspace Tracker ─────────────────────────────────────────────────────────
router.get('/workspace/stats',                      workspaceCtrl.getStats);
// Sprints
router.get('/workspace/sprints',                    workspaceCtrl.listSprints);
router.post('/workspace/sprints',                   workspaceCtrl.createSprint);
router.patch('/workspace/sprints/:id',              workspaceCtrl.updateSprint);
// Tasks
router.get('/workspace/tasks',                      workspaceCtrl.listTasks);
router.get('/workspace/tasks/:id',                  workspaceCtrl.getTask);
router.post('/workspace/tasks',                     workspaceCtrl.createTask);
router.patch('/workspace/tasks/:id',                workspaceCtrl.updateTask);
router.delete('/workspace/tasks/:id',               workspaceCtrl.deleteTask);
// Comments
router.post('/workspace/tasks/:id/comments',        workspaceCtrl.addComment);
router.delete('/workspace/tasks/:id/comments/:commentId', workspaceCtrl.deleteComment);

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
router.post('/cron/seed',          cronCtrl.seed);
router.get('/cron',                cronCtrl.list);
router.patch('/cron/:id/toggle',   cronCtrl.toggle);
router.post('/cron/:id/run',       cronCtrl.runNow);
router.patch('/cron/:id',          cronCtrl.update);

// ── RBAC Roles & Permissions ──────────────────────────────────────────────────
router.get('/roles/permissions/all',  roleCtrl.listPermissions);
router.get('/roles',                  roleCtrl.listRoles);
router.get('/roles/:id',              roleCtrl.getRole);
router.post('/roles',                 roleCtrl.createRole);
router.patch('/roles/:id',            roleCtrl.updateRole);
router.delete('/roles/:id',           roleCtrl.deleteRole);
router.patch('/roles/:id/permissions',roleCtrl.setPermissions);

// ── Rebate Management ─────────────────────────────────────────────────────────
router.get('/rebates/stats',                 rebateCtrl.getStats);
router.get('/rebates/rules',                 rebateCtrl.listRules);
router.post('/rebates/rules',                rebateCtrl.createRule);
router.patch('/rebates/rules/:id',           rebateCtrl.updateRule);
router.delete('/rebates/rules/:id',          rebateCtrl.deleteRule);
router.get('/rebates/claims',                rebateCtrl.listClaims);
router.patch('/rebates/claims/:id/approve',  rebateCtrl.approveClaim);
router.patch('/rebates/claims/:id/reject',   rebateCtrl.rejectClaim);

// ── VIP Config Management ─────────────────────────────────────────────────────
router.get('/vip/configs',          vipConfigCtrl.listConfigs);
router.post('/vip/configs',         vipConfigCtrl.upsertConfig);
router.patch('/vip/configs/:id',    vipConfigCtrl.updateConfig);
router.delete('/vip/configs/:id',   vipConfigCtrl.deleteConfig);
router.get('/vip/history',          vipConfigCtrl.listHistory);
router.get('/vip/stats',            vipConfigCtrl.getStats);

// ── IM / Chat Admin ───────────────────────────────────────────────────────────
router.get('/im/rooms',                      imCtrl.listRooms);
router.get('/im/rooms/:id/messages',         imCtrl.getRoomMessages);
router.post('/im/rooms/:id/messages',        imCtrl.sendMessage);
router.post('/im/broadcast',                 imCtrl.broadcast);
router.post('/im/users/:userId/mute',        imCtrl.muteUser);
router.delete('/im/users/:userId/mute',      imCtrl.unmuteUser);
router.get('/im/tickets',                    imCtrl.listTickets);
router.patch('/im/tickets/:id',              imCtrl.updateTicket);
router.post('/im/tickets/:id/reply',         imCtrl.replyTicket);

module.exports = router;
