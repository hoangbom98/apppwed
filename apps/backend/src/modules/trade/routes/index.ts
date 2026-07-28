// @ts-nocheck
'use strict';
const router     = require('express').Router();
const auth       = require('../../../shared/middlewares/auth/auth');
const adminGuard = require('../../../shared/middlewares/auth/adminGuard');

const authCtrl          = require('../controllers/authController');
const marketCtrl        = require('../controllers/marketController');
const orderCtrl         = require('../controllers/orderController');
const walletCtrl        = require('../controllers/walletController');
const depositCtrl       = require('../controllers/depositController');
const investCtrl        = require('../controllers/investmentController');
const referralCtrl      = require('../controllers/referralController');
const kycCtrl           = require('../controllers/kycController');
const notifCtrl         = require('../controllers/notificationController');
const positionCtrl      = require('../controllers/positionController');
const userCtrl          = require('../controllers/userController');
const tradingPwdCtrl    = require('../controllers/tradingPasswordController');
const systemCfgCtrl     = require('../controllers/systemConfigController');
const bankAccCtrl       = require('../controllers/bankAccountController');
const miningCtrl        = require('../controllers/miningController');
const yuebaoCtrl        = require('../controllers/yuebaoController');
const contentCtrl       = require('../controllers/contentController');
const prizeCtrl         = require('../controllers/prizeController');
const riskCtrl          = require('../controllers/riskConfigController');
const rewardCtrl        = require('../controllers/rewardController');
const shopCtrl          = require('../controllers/shopController');
const watchlistCtrl     = require('../controllers/watchlistController');

const { paginate } = require('../../../shared/utils/core/helpers');
const { ok, error } = require('../../../shared/utils/network/response');

// ── Auth ──────────────────────────────────────────────────────────
router.post('/auth/register',         authCtrl.register);
router.post('/auth/login',            authCtrl.login);
router.post('/auth/refresh',          authCtrl.refresh);
router.get('/auth/me',                auth, authCtrl.me);
router.post('/auth/logout',           auth, authCtrl.logout);
router.post('/auth/forgot-password',  authCtrl.forgotPassword);
router.post('/auth/reset-password',   authCtrl.resetPassword);
router.put('/auth/password',          auth, authCtrl.changePassword);

// ── Profile ───────────────────────────────────────────────────────────────────
const uploadMw = require('../../../shared/middlewares/core/upload');
router.patch('/profile',              auth, userCtrl.updateProfile);
router.patch('/profile/avatar',       auth, uploadMw.single('avatar'), userCtrl.uploadAvatar);

// ── Market / Symbols ──────────────────────────────────────────────
router.get('/pairs',                     marketCtrl.getPairs);
router.get('/pairs/:symbol',             marketCtrl.getPairBySymbol);
router.get('/pairs/:symbol/orderbook',   marketCtrl.getOrderbook);
router.get('/pairs/:symbol/trades',      marketCtrl.getRecentTrades);
router.get('/pairs/:symbol/history',     marketCtrl.getPriceHistory);

// ── Orders ────────────────────────────────────────────────────────
router.get('/orders',           auth, orderCtrl.getOrders);
router.get('/orders/:id',       auth, orderCtrl.getOrderById);
router.post('/orders',          auth, orderCtrl.createOrder);
router.delete('/orders/:id',    auth, orderCtrl.cancelOrder);

// ── Positions ─────────────────────────────────────────────────────
router.get('/positions',            auth, positionCtrl.getPositions);
router.get('/positions/:id',        auth, positionCtrl.getPositionById);
router.post('/positions/:id/close', auth, positionCtrl.closePosition);

// ── Portfolio ─────────────────────────────────────────────────────
router.get('/portfolio', auth, positionCtrl.getPortfolio);

// ── Wallet ────────────────────────────────────────────────────────
router.get('/wallet',           auth, walletCtrl.getBalances);
router.get('/wallet/history',   auth, walletCtrl.getHistory);
router.post('/wallet/withdraw', auth, tradingPwdCtrl.requireTradingPassword, walletCtrl.createWithdrawal);

// ── Deposit ───────────────────────────────────────────────────────────────────
router.get('/deposit',           auth, depositCtrl.getDeposits);
router.post('/deposit',          auth, depositCtrl.createDeposit);

// ── Investment Packages (public list) ────────────────────────────────────────
router.get('/investment/packages',     investCtrl.listPackages);
router.get('/investment/packages/:id', investCtrl.getPackage);

// ── Investment (user actions) ─────────────────────────────────────────────────
router.get('/investment/my',   auth, investCtrl.myInvestments);
router.post('/investment/buy', auth, investCtrl.buyInvestment);

// ── Referral ─────────────────────────────────────────────────────────────────
router.get('/referral/code',        auth, referralCtrl.getMyCode);
router.get('/referral/tree',        auth, referralCtrl.getReferralTree);
router.get('/referral/commissions', auth, referralCtrl.getCommissions);
router.get('/referral/summary',     auth, referralCtrl.getSummary);

// ── KYC ───────────────────────────────────────────────────────────
router.get('/kyc',  auth, kycCtrl.getStatus);
router.post('/kyc', auth, kycCtrl.submit);

// ── Notifications ─────────────────────────────────────────────────
router.get('/notifications',              auth, notifCtrl.getNotifications);
router.get('/notifications/unread-count', auth, notifCtrl.getUnreadCount);
router.put('/notifications/:id/read',     auth, notifCtrl.markRead);
router.put('/notifications/read-all',     auth, notifCtrl.markAllRead);

// ── Admin: KYC ────────────────────────────────────────────────────
router.get('/admin/kyc/pending',             auth, adminGuard, kycCtrl.listPending);
router.put('/admin/kyc/:userId/approve',     auth, adminGuard, kycCtrl.approveKyc);
router.put('/admin/kyc/:userId/reject',      auth, adminGuard, kycCtrl.rejectKyc);

// ── Admin: Deposits (Deposit model — proper status: pending|approved|rejected) ──
router.get('/admin/deposits',              auth, adminGuard, depositCtrl.adminListDeposits);
router.put('/admin/deposits/:id/approve',  auth, adminGuard, depositCtrl.approveDeposit);
router.put('/admin/deposits/:id/reject',   auth, adminGuard, depositCtrl.rejectDeposit);

// ── Admin: Withdrawals ────────────────────────────────────────────
// Use Withdrawal model (NOT Transaction) — schema has dedicated withdrawal records
router.get('/admin/withdrawals', auth, adminGuard, async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.withdrawal.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } } },
      }),
      req.prisma.withdrawal.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit });
  } catch (e) { return error(res, e.message, 500); }
});
router.put('/admin/withdrawals/:id/approve', auth, adminGuard, walletCtrl.approveWithdrawal);
router.put('/admin/withdrawals/:id/reject',  auth, adminGuard, walletCtrl.rejectWithdrawal);

// ── Admin: Investment packages ────────────────────────────────────────────────
router.get('/admin/investment/packages',        auth, adminGuard, investCtrl.adminListPackages);
router.get('/admin/investment/packages/:id',    auth, adminGuard, investCtrl.adminGetPackage);
router.post('/admin/investment/packages',       auth, adminGuard, investCtrl.adminCreatePackage);
router.patch('/admin/investment/packages/:id',  auth, adminGuard, investCtrl.adminUpdatePackage);
router.delete('/admin/investment/packages/:id', auth, adminGuard, investCtrl.adminDeletePackage);

// ── Admin: Investments (list only) ────────────────────────────────────────────
router.get('/admin/investments', auth, adminGuard, investCtrl.adminListInvestments);

// ── Admin: Users ──────────────────────────────────────────────────
router.get('/admin/users',     auth, adminGuard, userCtrl.list);
router.put('/admin/users/:id', auth, adminGuard, userCtrl.update);

// ── Admin: Orders (view + cancel) ────────────────────────────────
router.get('/admin/orders',            auth, adminGuard, async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.side)   where.side   = req.query.side;
    const [data, total] = await Promise.all([
      req.prisma.order.findMany({ where, skip, take, orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } } }),
      req.prisma.order.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit });
  } catch (e) { return error(res, e.message, 500); }
});
router.get('/admin/orders/:id',        auth, adminGuard, async (req, res) => {
  try {
    const item = await req.prisma.order.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
});
router.patch('/admin/orders/:id',      auth, adminGuard, async (req, res) => {
  try {
    const item = await req.prisma.order.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Order updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin: Wallets (view + adjust) ────────────────────────────────
router.get('/admin/wallets',           auth, adminGuard, async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.wallet.findMany({ skip, take, orderBy: { balance: 'desc' },
        include: { user: { select: { email: true, fullName: true } } } }),
      req.prisma.wallet.count(),
    ]);
    return ok(res, data, null, { total, page, limit });
  } catch (e) { return error(res, e.message, 500); }
});
router.get('/admin/wallets/:id',       auth, adminGuard, async (req, res) => {
  try {
    const item = await req.prisma.wallet.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
});
router.patch('/admin/wallets/:id',     auth, adminGuard, async (req, res) => {
  try {
    const item = await req.prisma.wallet.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Wallet updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin: Positions (view-only) ──────────────────────────────────
router.get('/admin/positions',         auth, adminGuard, async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.position.findMany({ where, skip, take, orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } } }),
      req.prisma.position.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit });
  } catch (e) { return error(res, e.message, 500); }
});

// ── 2FA ───────────────────────────────────────────────────────────
if (process.env.ENABLE_2FA === 'true') {
  const twoFACtrl = require('../../../shared/controllers/auth/twoFactorController');
  router.post('/auth/2fa/setup',   auth, twoFACtrl.setup);
  router.post('/auth/2fa/enable',  auth, twoFACtrl.enable);
  router.post('/auth/2fa/disable', auth, twoFACtrl.disable);
  router.post('/auth/2fa/verify',  auth, twoFACtrl.verify);
  router.get('/auth/2fa/backup',   auth, twoFACtrl.regenerateBackupCodes);
}

// ── Trading Password ──────────────────────────────────────────────
router.post('/trading-password/set',    auth, tradingPwdCtrl.set);
router.post('/trading-password/change', auth, tradingPwdCtrl.change);
router.post('/trading-password/verify', auth, tradingPwdCtrl.verify);

// ── Bank Accounts ─────────────────────────────────────────────────
router.get('/bank-accounts',              auth, bankAccCtrl.list);
router.post('/bank-accounts',             auth, bankAccCtrl.create);
router.patch('/bank-accounts/:id',        auth, bankAccCtrl.update);
router.put('/bank-accounts/:id/default',  auth, bankAccCtrl.setDefault);
router.delete('/bank-accounts/:id',       auth, bankAccCtrl.remove);

// ── Banners (public) ──────────────────────────────────────────────
router.get('/banners', contentCtrl.listBanners);

// ── News (public + reward) ────────────────────────────────────────
router.get('/news',                          contentCtrl.listNews);
router.get('/news/:slug',                    contentCtrl.getNews);
router.post('/reward/news/:articleId',  auth, rewardCtrl.newsReward);

// ── Sign-in reward ────────────────────────────────────────────────
router.post('/reward/signin',        auth, rewardCtrl.signin);
router.get('/reward/signin/status',  auth, rewardCtrl.signinStatus);

// ── Prize Draw ────────────────────────────────────────────────────
router.get('/prize/configs',  prizeCtrl.listPrizes);
router.get('/prize/recent',   prizeCtrl.recentWinners);
router.get('/prize/records',  auth, prizeCtrl.myRecords);
router.post('/prize/draw',    auth, prizeCtrl.draw);

// ── Yuebao / Money Market ─────────────────────────────────────────
router.get('/yuebao/products', yuebaoCtrl.listProducts);
router.get('/yuebao/my',       auth, yuebaoCtrl.myInvestments);
router.post('/yuebao/invest',  auth, yuebaoCtrl.invest);

// ── Mining ────────────────────────────────────────────────────────
router.get('/mining/machines',      miningCtrl.listMachines);
router.get('/mining/machines/:id',  miningCtrl.getMachine);
router.get('/mining/my',            auth, miningCtrl.myInvestments);
router.post('/mining/invest',       auth, tradingPwdCtrl.requireTradingPassword, miningCtrl.invest);

// ── Shop (Points shop) ────────────────────────────────────────────────────────
router.get('/shop',                     shopCtrl.listItems);
router.get('/shop/orders',        auth,  shopCtrl.myOrders);
router.get('/shop/:id',                 shopCtrl.getItem);
router.post('/shop/exchange',     auth,  shopCtrl.exchange);

// ── Watchlists ────────────────────────────────────────────────────────────────
router.get('/watchlists',              auth, watchlistCtrl.list);
router.post('/watchlists',             auth, watchlistCtrl.create);
router.delete('/watchlists/:id',       auth, watchlistCtrl.remove);
router.post('/watchlists/:id/items',   auth, watchlistCtrl.addItem);
router.delete('/watchlists/:watchlistId/items/:symbolId', auth, watchlistCtrl.removeItem);

// ── System Config (public safe keys) ─────────────────────────────
router.get('/config', systemCfgCtrl.getPublicConfig);

// ── Admin: System Config ──────────────────────────────────────────
router.get('/admin/config',        auth, adminGuard, systemCfgCtrl.listAll);
router.get('/admin/config/:key',   auth, adminGuard, systemCfgCtrl.getOne);
router.put('/admin/config/:key',   auth, adminGuard, systemCfgCtrl.upsert);
router.post('/admin/config/bulk',  auth, adminGuard, systemCfgCtrl.bulkUpsert);
router.delete('/admin/config/:key',auth, adminGuard, systemCfgCtrl.remove);

// ── Admin: Risk Config + Position Override ────────────────────────
router.get('/admin/risk',                         auth, adminGuard, riskCtrl.listAll);
router.get('/admin/risk/:symbolId',               auth, adminGuard, riskCtrl.getBySymbol);
router.put('/admin/risk/:symbolId',               auth, adminGuard, riskCtrl.upsert);
router.patch('/admin/positions/:id/close-price',  auth, adminGuard, riskCtrl.adminOverrideClosePrice);

// ── Admin: Banners ────────────────────────────────────────────────
router.get('/admin/banners',        auth, adminGuard, contentCtrl.adminListBanners);
router.post('/admin/banners',       auth, adminGuard, contentCtrl.adminCreateBanner);
router.patch('/admin/banners/:id',  auth, adminGuard, contentCtrl.adminUpdateBanner);
router.delete('/admin/banners/:id', auth, adminGuard, contentCtrl.adminDeleteBanner);

// ── Admin: News ───────────────────────────────────────────────────
router.get('/admin/news',         auth, adminGuard, contentCtrl.adminListNews);
router.post('/admin/news',        auth, adminGuard, contentCtrl.adminCreateNews);
router.patch('/admin/news/:id',   auth, adminGuard, contentCtrl.adminUpdateNews);
router.delete('/admin/news/:id',  auth, adminGuard, contentCtrl.adminDeleteNews);

// ── Admin: Yuebao ─────────────────────────────────────────────────
router.get('/admin/yuebao/products',               auth, adminGuard, yuebaoCtrl.adminListProducts);
router.post('/admin/yuebao/products',              auth, adminGuard, yuebaoCtrl.adminCreateProduct);
router.patch('/admin/yuebao/products/:id',         auth, adminGuard, yuebaoCtrl.adminUpdateProduct);
router.delete('/admin/yuebao/products/:id',        auth, adminGuard, yuebaoCtrl.adminDeleteProduct);
router.get('/admin/yuebao/investments',            auth, adminGuard, yuebaoCtrl.adminListInvestments);
router.put('/admin/yuebao/investments/:id/settle', auth, adminGuard, yuebaoCtrl.adminSettle);

// ── Admin: Mining ─────────────────────────────────────────────────
router.get('/admin/mining/machines',         auth, adminGuard, miningCtrl.adminListMachines);
router.post('/admin/mining/machines',        auth, adminGuard, miningCtrl.adminCreateMachine);
router.patch('/admin/mining/machines/:id',   auth, adminGuard, miningCtrl.adminUpdateMachine);
router.delete('/admin/mining/machines/:id',  auth, adminGuard, miningCtrl.adminDeleteMachine);
router.get('/admin/mining/investments',      auth, adminGuard, miningCtrl.adminListInvestments);

// ── Admin: Prize ──────────────────────────────────────────────────
router.get('/admin/prize',         auth, adminGuard, prizeCtrl.adminList);
router.post('/admin/prize',        auth, adminGuard, prizeCtrl.adminCreate);
router.patch('/admin/prize/:id',   auth, adminGuard, prizeCtrl.adminUpdate);
router.delete('/admin/prize/:id',  auth, adminGuard, prizeCtrl.adminDelete);

// ── Admin: Shop ───────────────────────────────────────────────────
router.get('/admin/shop',         auth, adminGuard, shopCtrl.adminList);
router.post('/admin/shop',        auth, adminGuard, shopCtrl.adminCreate);
router.patch('/admin/shop/:id',   auth, adminGuard, shopCtrl.adminUpdate);
router.delete('/admin/shop/:id',  auth, adminGuard, shopCtrl.adminDelete);

router.get('/health', (_req, res) => res.json({ status: 'ok', module: 'trade' }));

// ── Shared: Support Chat / Tickets / Knowledge ────────────────────
const supportRoutes = require('../../../shared/routes/support/support.routes');
router.use('/', supportRoutes);

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
