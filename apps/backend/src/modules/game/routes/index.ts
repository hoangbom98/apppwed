// @ts-nocheck
const router          = require('express').Router();
const auth            = require('../../../shared/middlewares/auth/auth');
const adminGuard      = require('../../../shared/middlewares/auth/adminGuard');
const auditLogger     = require('../../../shared/middlewares/audit/auditLogger');
const gameAdminCtrl   = require('../controllers/gameAdminController');
const { httpCache } = require('../../../shared/middlewares/core/httpCache');
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
const rebateCtrl    = require('../controllers/rebateController');
const yuebaoCtrl    = require('../controllers/savingsVaultController');
const miningCtrl    = require('../controllers/miningController');
const statsCtrl     = require('../controllers/statisticsController');
const giftCodeCtrl  = require('../controllers/giftCodeController');
const { validate }  = require('../../../shared/middlewares/validation/validate');
const walletSchemas = require('../validators/walletValidator');

// ── Bank Accounts (protected) ─────────────────────────────────────
const bankAccCtrl = require('../../../shared/controllers/user/bankAccountController');
router.get('/bank-accounts',              auth, bankAccCtrl.list);
router.post('/bank-accounts',             auth, bankAccCtrl.create);
router.patch('/bank-accounts/:id',        auth, bankAccCtrl.update);
router.put('/bank-accounts/:id/default',  auth, bankAccCtrl.setDefault);
router.delete('/bank-accounts/:id',       auth, bankAccCtrl.remove);

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
router.post('/wallet/deposit',         auth, validate(walletSchemas.createDeposit), walletCtrl.createDeposit);
router.get('/wallet/withdraws',        auth, walletCtrl.getWithdraws);
router.post('/wallet/withdraw',        auth, validate(walletSchemas.createWithdraw), walletCtrl.createWithdraw);
router.post('/wallet/transfer',        auth, walletCtrl.transfer);
router.post('/wallet/transfer-user',   auth, walletCtrl.transferUser);

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
  const twoFACtrl = require('../../../shared/controllers/auth/twoFactorController');
  router.post('/auth/2fa/setup',    auth, twoFACtrl.setup);
  router.post('/auth/2fa/enable',   auth, twoFACtrl.enable);
  router.post('/auth/2fa/disable',  auth, twoFACtrl.disable);
  router.post('/auth/2fa/verify',   auth, twoFACtrl.verify);
  router.get('/auth/2fa/backup',    auth, twoFACtrl.regenerateBackupCodes);
}

// ── Admin: Statistics ─────────────────────────────────────────────
router.get('/admin/statistics/overview',       auth, adminGuard, statsCtrl.getOverview);
router.get('/admin/statistics/finance',        auth, adminGuard, statsCtrl.getFinance);
router.get('/admin/statistics/team',           auth, adminGuard, statsCtrl.getTeam);
router.get('/admin/statistics/profit',         auth, adminGuard, statsCtrl.getProfit);
router.get('/admin/statistics/users',          auth, adminGuard, statsCtrl.getUserStats);
router.get('/admin/statistics/recharge-trend', auth, adminGuard, statsCtrl.getRechargeTrend);
router.get('/admin/statistics/bet-trend',      auth, adminGuard, statsCtrl.getBetTrend);

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
  const { paginate } = require('../../../shared/utils/core/helpers');
  const { paginate: paginateRes } = require('../../../shared/utils/network/response');
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
  } catch (e) { const { error } = require('../../../shared/utils/network/response'); return error(res, e.message, 500); }
});
router.put('/admin/users/:id',          auth, adminGuard, auditLogger, async (req, res) => {
  const { success, error } = require('../../../shared/utils/network/response');
  try {
    const u = await req.prisma.user.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) { return error(res, e.message, 500); }
});
router.get('/admin/deposits',           auth, adminGuard, async (req, res) => {
  const { paginate } = require('../../../shared/utils/core/helpers');
  const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const [data, total] = await Promise.all([req.prisma.depositOrder.findMany({ where, skip, take, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'desc' } }), req.prisma.depositOrder.count({ where })]);
  return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
});
router.put('/admin/deposits/:id/approve', auth, adminGuard, walletCtrl.approveDeposit);
router.put('/admin/deposits/:id/reject',  auth, adminGuard, walletCtrl.rejectDeposit);
router.get('/admin/withdraws',          auth, adminGuard, async (req, res) => {
  const { paginate } = require('../../../shared/utils/core/helpers');
  const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const [data, total] = await Promise.all([req.prisma.withdrawOrder.findMany({ where, skip, take, include: { user: { select: { username: true } } }, orderBy: { createdAt: 'desc' } }), req.prisma.withdrawOrder.count({ where })]);
  return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
});
router.put('/admin/withdraws/:id/approve', auth, adminGuard, walletCtrl.approveWithdraw);
router.put('/admin/withdraws/:id/reject',  auth, adminGuard, walletCtrl.rejectWithdraw);

// ── Shared: Support Chat / Tickets / Knowledge ────────────────────
const supportRoutes = require('../../../shared/routes/support/support.routes');
router.use('/', supportRoutes);

// ── Shared: Push Notifications ────────────────────────────────────
router.use('/', require('../../../shared/routes/user/push.routes'));

// ── Lottery ───────────────────────────────────────────────────────
router.get('/lottery/types',                     lotteryCtrl.getTypes);
router.get('/lottery/draws',                     lotteryCtrl.getDraws);
router.get('/lottery/draws/current/:typeId',     lotteryCtrl.getCurrentDraw);
router.get('/lottery/draws/:id/result',          lotteryCtrl.getResult);
router.post('/lottery/bet',                      auth, lotteryCtrl.placeBet);
router.get('/lottery/my-bets',                   auth, lotteryCtrl.getMyBets);
// Admin lottery endpoints — must come before parameterised /:id routes
router.get('/lottery/admin/bets',                auth, adminGuard, lotteryCtrl.listAdminBets);
router.post('/lottery/admin/draws',              auth, adminGuard, lotteryCtrl.createDraw);
router.post('/lottery/admin/draws/:id/result',   auth, adminGuard, lotteryCtrl.setResult);
router.post('/lottery/admin/draws/:id/cancel',   auth, adminGuard, lotteryCtrl.cancelDraw);

// ── Lottery Types CRUD (admin) ────────────────────────────────────────────────
router.post('/admin/lottery/types',              auth, adminGuard, lotteryCtrl.createType);
router.patch('/admin/lottery/types/:id',         auth, adminGuard, lotteryCtrl.updateType);
router.delete('/admin/lottery/types/:id',        auth, adminGuard, lotteryCtrl.deleteType);

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

// ── Rebate / Fanshui ──────────────────────────────────────────────
router.get('/rebate/rates',    rebateCtrl.getRates);              // public — no auth
router.get('/rebate/status',   auth, rebateCtrl.getStatus);
router.post('/rebate/claim',   auth, rebateCtrl.claim);
router.get('/rebate/history',  auth, rebateCtrl.getHistory);

// ── Savings Vault (Số dư Bảo) ────────────────────────────────────────────
router.get('/savings-vault/products',  httpCache(300), yuebaoCtrl.getProducts);  // public
router.get('/savings-vault/my',        auth, yuebaoCtrl.getMy);
router.post('/savings-vault/invest',   auth, yuebaoCtrl.invest);
router.post('/savings-vault/withdraw', auth, yuebaoCtrl.withdraw);

// ── Mining Machines ───────────────────────────────────────────────
router.get('/mining/machines',     httpCache(300), miningCtrl.getMachines);  // public
router.get('/mining/machines/:id', httpCache(300), miningCtrl.getMachine);   // public
router.get('/mining/my',           auth, miningCtrl.getMy);
router.post('/mining/invest',      auth, miningCtrl.invest);

// ── Gift Code ─────────────────────────────────────────────────────
// POST /game/giftcode/redeem — user redeems a code (authenticated)
// GET  /game/giftcode/history — user's redemption history
router.post('/giftcode/redeem',  auth, giftCodeCtrl.redeem);
router.get('/giftcode/history',  auth, giftCodeCtrl.getHistory);

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
router.use('/payment', require('../../../shared/routes/finance/payment.routes'));

// ── Core: Referral (shared) ───────────────────────────────────────
router.use('/', require('../../../shared/routes/user/referral.routes'));

// ── Core: Loyalty (shared) ───────────────────────────────────────
router.use('/', require('../../../shared/routes/user/loyalty.routes'));

// ── Core: Affiliate (shared) ─────────────────────────────────────
router.use('/', require('../../../shared/routes/user/affiliate.routes'));

// ── Core: Leaderboard (shared) ───────────────────────────────────
router.use('/', require('../../../shared/routes/user/leaderboard.routes'));

// ── Core: Marketing Campaigns (admin, shared) ─────────────────────
router.use('/', require('../../../shared/routes/user/campaign.routes'));

module.exports = router;
