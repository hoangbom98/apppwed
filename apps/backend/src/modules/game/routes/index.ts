// @ts-nocheck
const router          = require('express').Router();
const auth            = require('../../../shared/middlewares/auth');
const adminGuard      = require('../../../shared/middlewares/adminGuard');
const auditLogger     = require('../../../shared/middlewares/auditLogger');
const gameAdminCtrl   = require('../controllers/gameAdminController');
const { httpCache } = require('../../../shared/middlewares/httpCache');
const autocompleteCtrl = require('../controllers/autocompleteController');
const authCtrl      = require('../controllers/authController');
const walletCtrl    = require('../controllers/walletController');
const gameCtrl      = require('../controllers/gameController');
const vipCtrl       = require('../controllers/vipController');
const notifCtrl     = require('../controllers/notificationController');
const lotteryCtrl   = require('../controllers/lotteryController');
const sessionCtrl   = require('../controllers/sessionController');
const agentCtrl     = require('../controllers/agentController');
const checkinCtrl   = require('../controllers/checkinController');
const missionCtrl   = require('../controllers/missionController');
const spinCtrl      = require('../controllers/spinController');

// ── Autocomplete (public, rate-limited by global middleware) ──────
router.get('/autocomplete', autocompleteCtrl.autocomplete);

// ── Public ────────────────────────────────────────────────────────
router.post('/auth/register',        authCtrl.register);
router.post('/auth/login',           authCtrl.login);
router.post('/auth/refresh',         authCtrl.refresh);

router.get('/games',           httpCache(300), gameCtrl.getGames);
router.get('/games/:slug',     httpCache(600), gameCtrl.getGameBySlug);
router.get('/game-categories', httpCache(600), gameCtrl.getCategories);
router.get('/promotions',      httpCache(180), gameCtrl.getPromotions);
router.get('/promotions/:id',  httpCache(300), gameCtrl.getPromotionById);
router.get('/vip/levels',      httpCache(600), vipCtrl.getVipLevels);

// ── Protected ─────────────────────────────────────────────────────
router.get('/auth/me',               auth, authCtrl.me);
router.post('/auth/logout',          auth, authCtrl.logout);
router.put('/auth/profile',          auth, authCtrl.updateProfile);
router.put('/auth/password',         auth, authCtrl.changePassword);

router.get('/wallet/balance',          auth, walletCtrl.getBalance);
router.get('/wallet/history',          auth, walletCtrl.getHistory);
router.get('/wallet/deposit-config',   auth, walletCtrl.getDepositConfig);
router.get('/wallet/withdraw-config',  auth, walletCtrl.getWithdrawConfig);
router.get('/wallet/deposits',         auth, walletCtrl.getDeposits);
router.post('/wallet/deposit',         auth, walletCtrl.createDeposit);
router.get('/wallet/withdraws',        auth, walletCtrl.getWithdraws);
router.post('/wallet/withdraw',        auth, walletCtrl.createWithdraw);

router.post('/promotions/:id/claim', auth, gameCtrl.claimPromotion);
router.get('/promotions/my-claims',  auth, gameCtrl.getMyClaims);

router.get('/vip/me',              auth, vipCtrl.getMyVip);
router.get('/vip/level',           auth, vipCtrl.getVipLevel);         // frontend compat alias
router.post('/vip/claim/daily',    auth, vipCtrl.claimDailyReward);
router.post('/vip/claim/monthly',  auth, vipCtrl.claimMonthlyReward);
router.get('/vip/cashbacks',       auth, vipCtrl.getCashbacks);
router.get('/vip/interests',       auth, vipCtrl.getInterests);

router.get('/notifications',         auth, notifCtrl.getNotifications);
router.get('/notifications/unread-count', auth, notifCtrl.getUnreadCount);
router.put('/notifications/:id/read', auth, notifCtrl.markRead);
router.put('/notifications/read-all', auth, notifCtrl.markAllRead);

// ── 2FA ───────────────────────────────────────────────────────────
if (process.env.ENABLE_2FA === 'true') {
  const twoFACtrl = require('../../../shared/controllers/twoFactorController');
  router.post('/auth/2fa/setup',    auth, twoFACtrl.setup);
  router.post('/auth/2fa/enable',   auth, twoFACtrl.enable);
  router.post('/auth/2fa/disable',  auth, twoFACtrl.disable);
  router.post('/auth/2fa/verify',   auth, twoFACtrl.verify);
  router.get('/auth/2fa/backup',    auth, twoFACtrl.regenerateBackupCodes);
}

// ── Admin: Rounds (game sessions) ────────────────────────────────
router.get('/admin/rounds',             auth, adminGuard, gameAdminCtrl.listRounds);
router.get('/admin/rounds/:id',         auth, adminGuard, gameAdminCtrl.getRound);
router.patch('/admin/rounds/:id',       auth, adminGuard, auditLogger, gameAdminCtrl.updateRound);

// ── Admin: Providers ──────────────────────────────────────────────
router.get('/admin/providers',          auth, adminGuard, gameAdminCtrl.listProviders);
router.get('/admin/providers/:id',      auth, adminGuard, gameAdminCtrl.getProvider);
router.post('/admin/providers',         auth, adminGuard, auditLogger, gameAdminCtrl.createProvider);
router.put('/admin/providers/:id',      auth, adminGuard, auditLogger, gameAdminCtrl.updateProvider);
router.delete('/admin/providers/:id',   auth, adminGuard, auditLogger, gameAdminCtrl.deleteProvider);

// ── Admin: Users / Deposits / Withdrawals ─────────────────────────
router.get('/admin/users',              auth, adminGuard, async (req, res) => {
  const { paginate } = require('../../../shared/utils/helpers');
  const { paginate: paginateRes } = require('../../../shared/utils/response');
  const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.search) where.OR = [
    { username: { contains: req.query.search } },
    { email:    { contains: req.query.search } },
    { fullName: { contains: req.query.search } },
  ];
  try {
    const [data, total] = await Promise.all([
      req.prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: { id: true, username: true, email: true, phone: true, fullName: true, balance: true, frozen: true, vipLevel: true, role: true, status: true, createdAt: true } }),
      req.prisma.user.count({ where }),
    ]);
    return paginateRes(res, data, { total, page, limit, pages: Math.ceil(total / take) });
  } catch (e) { const { error } = require('../../../shared/utils/response'); return error(res, e.message, 500); }
});
router.put('/admin/users/:id',          auth, adminGuard, auditLogger, async (req, res) => {
  const { success, error } = require('../../../shared/utils/response');
  try {
    const u = await req.prisma.user.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) { return error(res, e.message, 500); }
});
router.get('/admin/deposits',           auth, adminGuard, async (req, res) => {
  const { paginate } = require('../../../shared/utils/helpers');
  const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const [data, total] = await Promise.all([req.prisma.depositOrder.findMany({ where, skip, take, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'desc' } }), req.prisma.depositOrder.count({ where })]);
  return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
});
router.put('/admin/deposits/:id/approve', auth, adminGuard, walletCtrl.approveDeposit);
router.put('/admin/deposits/:id/reject',  auth, adminGuard, walletCtrl.rejectDeposit);
router.get('/admin/withdraws',          auth, adminGuard, async (req, res) => {
  const { paginate } = require('../../../shared/utils/helpers');
  const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const [data, total] = await Promise.all([req.prisma.withdrawOrder.findMany({ where, skip, take, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'desc' } }), req.prisma.withdrawOrder.count({ where })]);
  return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
});
router.put('/admin/withdraws/:id/approve', auth, adminGuard, walletCtrl.approveWithdraw);
router.put('/admin/withdraws/:id/reject',  auth, adminGuard, walletCtrl.rejectWithdraw);

// ── Shared: Support Chat / Tickets / Knowledge ────────────────────
const supportRoutes = require('../../../shared/routes/support.routes.js');
router.use('/', supportRoutes);

// ── Shared: Push Notifications ────────────────────────────────────
router.use('/', require('../../../shared/routes/push.routes'));

// ── Lottery ───────────────────────────────────────────────────────
router.get('/lottery/types',                     lotteryCtrl.getTypes);
router.get('/lottery/draws',                     lotteryCtrl.getDraws);
router.get('/lottery/draws/current/:typeId',     lotteryCtrl.getCurrentDraw);
router.get('/lottery/draws/:id/result',          lotteryCtrl.getResult);
router.post('/lottery/bet',                      auth, lotteryCtrl.placeBet);
router.get('/lottery/my-bets',                   auth, lotteryCtrl.getMyBets);
router.post('/lottery/admin/draws',              auth, adminGuard, lotteryCtrl.createDraw);
router.post('/lottery/admin/draws/:id/result',   auth, adminGuard, lotteryCtrl.setResult);

// ── Sessions ──────────────────────────────────────────────────────
router.post('/sessions/launch',                  auth, sessionCtrl.launch);
router.get('/sessions/history',                  auth, sessionCtrl.getHistory);
router.get('/sessions/:id',                      auth, sessionCtrl.getSession);
router.post('/sessions/:id/end',                 auth, sessionCtrl.endSession);

// ── Game Launch API (GAME_LAUNCH_API.md — frontend interface never changes) ──
// Paths available at:
//   /api/game/v1/categories, /api/game/v1/platforms, /api/game/v1/list, /api/game/v1/launch
// AND (via alias in server.js):
//   /api/v1/game/categories, /api/v1/game/platforms, /api/v1/game/list, /api/v1/game/launch
const gameLaunchCtrl = require('../controllers/api/GameLaunchController');

// Public endpoints (no auth required — frontend reads categories/platforms without login)
router.get('/v1/categories',   gameLaunchCtrl.getCategories);
router.get('/v1/platforms',    gameLaunchCtrl.getPlatforms);
router.get('/v1/list',         gameLaunchCtrl.getGameList);
router.get('/v1/launch',  auth, gameLaunchCtrl.launch);

// Legacy single-endpoint alias kept for backward compat
router.get('/launch',     auth, gameLaunchCtrl.launch);

// ── Check-in ──────────────────────────────────────────────────────
router.get('/checkin/config',    httpCache(600), checkinCtrl.getConfig);
router.get('/checkin/status',    auth, checkinCtrl.getStatus);
router.post('/checkin/claim',    auth, checkinCtrl.claim);

// ── Daily Missions ────────────────────────────────────────────────
router.get('/missions',                    auth, missionCtrl.getMissions);
router.post('/missions/:templateId/claim', auth, missionCtrl.claimMission);

// ── Lucky Wheel ───────────────────────────────────────────────────
router.get('/wheel',           httpCache(300), spinCtrl.getWheel);
router.get('/wheel/my-spins',  auth, spinCtrl.getMySpins);
router.post('/wheel/spin',     auth, spinCtrl.spin);
router.get('/wheel/history',   auth, spinCtrl.getHistory);

// ── Agent / Commission ────────────────────────────────────────────
router.get('/agent/check',       auth, agentCtrl.checkAgent);
router.post('/agent/register',   auth, agentCtrl.registerAgent);
router.get('/agent/info',        auth, agentCtrl.getAgentInfo);
router.get('/agent/referrals',   auth, agentCtrl.getReferrals);
router.get('/agent/tree',        auth, agentCtrl.getAgentTree);
router.get('/agent/downlines',   auth, agentCtrl.getDownlines);
router.get('/agent/commissions', auth, agentCtrl.getCommissions);

// ── GSC+ Seamless Wallet callbacks (inbound from GSC — no auth, signature-verified) ──
// GSC v2.0.6 calls: POST {{callback_url}}/v1/api/seamless/{action}
const gscSeamless = require('../controllers/gscSeamlessController');
router.post('/v1/api/seamless/balance',     gscSeamless.balance);
router.post('/v1/api/seamless/withdraw',    gscSeamless.withdraw);
router.post('/v1/api/seamless/deposit',     gscSeamless.deposit);
router.post('/v1/api/seamless/pushbetdata', gscSeamless.pushbetdata);

// ── Other Provider Callbacks (no auth — verified by signature) ────
const providerCallbackCtrl = require('../controllers/providerCallbackController');
router.post('/callbacks/gsc',        providerCallbackCtrl.gsc);
router.post('/callbacks/goldgate/balance',     providerCallbackCtrl.goldgateBalance);
router.post('/callbacks/goldgate/transaction', providerCallbackCtrl.goldgateTransaction);
router.post('/callbacks/tc-gaming/seamless',   providerCallbackCtrl.tcGamingSeamless);

// ── Payment Engine ─────────────────────────────────────────────────────────
// POST /api/game/payment/deposit       — create deposit order
// POST /api/game/payment/withdraw      — create withdrawal request
// GET  /api/game/payment/gateways      — list active gateways (public)
// GET  /api/game/payment/orders/deposit  — user deposit history
// POST /api/game/payment/webhook/:code — inbound payment webhook
router.use('/payment', require('../../../shared/routes/payment.routes'));

module.exports = router;
