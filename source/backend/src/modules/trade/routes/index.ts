// @ts-nocheck
'use strict';
const router     = require('express').Router();
const auth       = require('../../../shared/middlewares/auth');
const adminGuard = require('../../../shared/middlewares/adminGuard');

const authCtrl       = require('../controllers/authController');
const marketCtrl     = require('../controllers/marketController');
const orderCtrl      = require('../controllers/orderController');
const walletCtrl     = require('../controllers/walletController');
const kycCtrl        = require('../controllers/kycController');
const notifCtrl      = require('../controllers/notificationController');
const positionCtrl   = require('../controllers/positionController');
const userCtrl       = require('../controllers/userController');
const investCtrl     = require('../controllers/investmentController');
const referralCtrl   = require('../controllers/referralController');

const { paginate }        = require('../../../shared/utils/helpers');
const { ok, error }       = require('../../../shared/utils/response');

// ── Auth ──────────────────────────────────────────────────────────
router.post('/auth/register',   authCtrl.register);
router.post('/auth/login',      authCtrl.login);
router.post('/auth/refresh',    authCtrl.refresh);
router.get('/auth/me',          auth, authCtrl.me);
router.post('/auth/logout',     auth, authCtrl.logout);

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
router.get('/wallet',                   auth, walletCtrl.getBalances);
router.get('/wallet/history',           auth, walletCtrl.getHistory);
router.get('/wallet/deposits',          auth, walletCtrl.getDeposits);
router.get('/wallet/company-banks',     walletCtrl.getCompanyBanks);   // public — needed for deposit instructions
router.post('/wallet/deposit',          auth, walletCtrl.createDeposit);
router.post('/wallet/withdraw',         auth, walletCtrl.createWithdrawal);

// ── Investment ────────────────────────────────────────────────────
router.get('/investment/packages',      investCtrl.getPackages);        // public
router.get('/investment/packages/:id',  investCtrl.getPackageById);     // public
router.post('/investment/buy',          auth, investCtrl.buyPackage);
router.get('/investment/history',       auth, investCtrl.getHistory);

// ── Referral ──────────────────────────────────────────────────────
router.get('/referral/my-code',         auth, referralCtrl.getMyCode);
router.get('/referral/downline',        auth, referralCtrl.getDownline);
router.get('/referral/commissions',     auth, referralCtrl.getCommissions);
router.get('/referral/stats',           auth, referralCtrl.getStats);

// ── KYC ───────────────────────────────────────────────────────────
router.get('/kyc',  auth, kycCtrl.getStatus);
router.post('/kyc', auth, kycCtrl.submit);

// ── Notifications ─────────────────────────────────────────────────
router.get('/notifications',              auth, notifCtrl.getNotifications);
router.get('/notifications/unread-count', auth, notifCtrl.getUnreadCount);
router.put('/notifications/:id/read',     auth, notifCtrl.markRead);
router.put('/notifications/read-all',     auth, notifCtrl.markAllRead);

// ── Watchlist ─────────────────────────────────────────────────────
router.get('/watchlists', auth, async (req, res) => {
  try {
    const data = await req.prisma.watchlist.findMany({
      where:   { userId: req.user.id },
      include: { items: { include: { symbol: { select: { code: true, name: true, baseAsset: true, quoteAsset: true } } } } },
    });
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});
router.post('/watchlists', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'name is required', 400);
    const wl = await req.prisma.watchlist.create({ data: { userId: req.user.id, name } });
    return res.status(201).json({ success: true, data: wl });
  } catch (e) { return error(res, e.message, 500); }
});
router.delete('/watchlists/:id', auth, async (req, res) => {
  try {
    await req.prisma.watchlist.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    return ok(res, null, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});
router.post('/watchlists/:id/items', auth, async (req, res) => {
  try {
    const { symbolId } = req.body;
    if (!symbolId) return error(res, 'symbolId is required', 400);
    const item = await req.prisma.watchlistItem.create({
      data: { watchlistId: req.params.id, symbolId },
      include: { symbol: true },
    });
    return res.status(201).json({ success: true, data: item });
  } catch (e) { return error(res, e.message, 500); }
});
router.delete('/watchlists/:id/items/:symbolId', auth, async (req, res) => {
  try {
    await req.prisma.watchlistItem.deleteMany({
      where: { watchlistId: req.params.id, symbolId: req.params.symbolId },
    });
    return ok(res, null, 'Removed');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Price Alerts ──────────────────────────────────────────────────
router.get('/alerts', auth, async (req, res) => {
  try {
    const data = await req.prisma.priceAlert.findMany({
      where:   { userId: req.user.id },
      include: { symbol: { select: { code: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});
router.post('/alerts', auth, async (req, res) => {
  try {
    const { symbolId, condition, price, note } = req.body;
    if (!symbolId || !condition || !price) return error(res, 'symbolId, condition, price required', 400);
    const alert = await req.prisma.priceAlert.create({
      data: { userId: req.user.id, symbolId, condition, price: parseFloat(price), note: note || null },
    });
    return res.status(201).json({ success: true, data: alert });
  } catch (e) { return error(res, e.message, 500); }
});
router.delete('/alerts/:id', auth, async (req, res) => {
  try {
    await req.prisma.priceAlert.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    return ok(res, null, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin: KYC ────────────────────────────────────────────────────
router.get('/admin/kyc/pending',             auth, adminGuard, kycCtrl.listPending);
router.put('/admin/kyc/:userId/approve',     auth, adminGuard, kycCtrl.approveKyc);
router.put('/admin/kyc/:userId/reject',      auth, adminGuard, kycCtrl.rejectKyc);

// ── Admin: Deposits ───────────────────────────────────────────────
router.get('/admin/deposits', auth, adminGuard, async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.deposit.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } } },
      }),
      req.prisma.deposit.count({ where }),
    ]);
    return ok(res, data, null, { total, page, limit });
  } catch (e) { return error(res, e.message, 500); }
});
router.put('/admin/deposits/:id/approve', auth, adminGuard, walletCtrl.approveDeposit);
router.put('/admin/deposits/:id/reject',  auth, adminGuard, walletCtrl.rejectDeposit);

// ── Admin: Withdrawals ────────────────────────────────────────────
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

// ── Admin: Users ──────────────────────────────────────────────────
router.get('/admin/users',     auth, adminGuard, userCtrl.list);
router.put('/admin/users/:id', auth, adminGuard, userCtrl.update);

// ── Admin: Orders ─────────────────────────────────────────────────
router.get('/admin/orders', auth, adminGuard, async (req, res) => {
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
router.get('/admin/orders/:id', auth, adminGuard, async (req, res) => {
  try {
    const item = await req.prisma.order.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
});
router.patch('/admin/orders/:id', auth, adminGuard, async (req, res) => {
  try {
    const item = await req.prisma.order.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Order updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin: Wallets ────────────────────────────────────────────────
router.get('/admin/wallets', auth, adminGuard, async (req, res) => {
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
router.get('/admin/wallets/:id', auth, adminGuard, async (req, res) => {
  try {
    const item = await req.prisma.wallet.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
});
router.patch('/admin/wallets/:id', auth, adminGuard, async (req, res) => {
  try {
    const item = await req.prisma.wallet.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, item, 'Wallet updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin: Positions ──────────────────────────────────────────────
router.get('/admin/positions', auth, adminGuard, async (req, res) => {
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

// ── Admin: Investments ────────────────────────────────────────────
router.get('/admin/investments',        auth, adminGuard, investCtrl.adminList);

// ── Admin: Investment Packages (CRUD) ─────────────────────────────
router.get('/admin/investment/packages', auth, adminGuard, async (req, res) => {
  try {
    const data = await req.prisma.investmentPackage.findMany({ orderBy: { sortOrder: 'asc' } });
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});
router.post('/admin/investment/packages', auth, adminGuard, async (req, res) => {
  try {
    const pkg = await req.prisma.investmentPackage.create({ data: req.body });
    return res.status(201).json({ success: true, data: pkg });
  } catch (e) { return error(res, e.message, 500); }
});
router.put('/admin/investment/packages/:id', auth, adminGuard, async (req, res) => {
  try {
    const pkg = await req.prisma.investmentPackage.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, pkg, 'Package updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin: Company Banks (CRUD) ───────────────────────────────────
router.get('/admin/company-banks', auth, adminGuard, async (req, res) => {
  try {
    const data = await req.prisma.companyBank.findMany({ orderBy: { sortOrder: 'asc' } });
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});
router.post('/admin/company-banks', auth, adminGuard, async (req, res) => {
  try {
    const bank = await req.prisma.companyBank.create({ data: req.body });
    return res.status(201).json({ success: true, data: bank });
  } catch (e) { return error(res, e.message, 500); }
});
router.put('/admin/company-banks/:id', auth, adminGuard, async (req, res) => {
  try {
    const bank = await req.prisma.companyBank.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, bank, 'Bank updated');
  } catch (e) { return error(res, e.message, 500); }
});
router.delete('/admin/company-banks/:id', auth, adminGuard, async (req, res) => {
  try {
    await req.prisma.companyBank.delete({ where: { id: req.params.id } });
    return ok(res, null, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Admin: Trade Config ───────────────────────────────────────────
router.get('/admin/configs', auth, adminGuard, async (req, res) => {
  try {
    const data = await req.prisma.tradeConfig.findMany({ orderBy: { key: 'asc' } });
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
});
router.put('/admin/configs/:key', auth, adminGuard, async (req, res) => {
  try {
    const cfg = await req.prisma.tradeConfig.upsert({
      where:  { key: req.params.key },
      create: { key: req.params.key, value: req.body.value, description: req.body.description || null },
      update: { value: req.body.value },
    });
    return ok(res, cfg, 'Config updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── 2FA ───────────────────────────────────────────────────────────
if (process.env.ENABLE_2FA === 'true') {
  const twoFACtrl = require('../../../shared/controllers/twoFactorController');
  router.post('/auth/2fa/setup',   auth, twoFACtrl.setup);
  router.post('/auth/2fa/enable',  auth, twoFACtrl.enable);
  router.post('/auth/2fa/disable', auth, twoFACtrl.disable);
  router.post('/auth/2fa/verify',  auth, twoFACtrl.verify);
  router.get('/auth/2fa/backup',   auth, twoFACtrl.regenerateBackupCodes);
}

router.get('/health', (_req, res) => res.json({ status: 'ok', module: 'trade' }));

// ── Shared: Support Chat / Tickets / Knowledge ────────────────────
const supportRoutes = require('../../../shared/routes/support.routes.js');
router.use('/', supportRoutes);

module.exports = router;
