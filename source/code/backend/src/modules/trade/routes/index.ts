// @ts-nocheck
'use strict';
const router     = require('express').Router();
const auth       = require('../../../shared/middlewares/auth');
const adminGuard = require('../../../shared/middlewares/adminGuard');

const authCtrl       = require('../controllers/authController');
const marketCtrl     = require('../controllers/marketController');
const orderCtrl      = require('../controllers/orderController');
const walletCtrl     = require('../controllers/walletController');
const depositCtrl    = require('../controllers/depositController');
const investCtrl     = require('../controllers/investmentController');
const referralCtrl   = require('../controllers/referralController');
const kycCtrl        = require('../controllers/kycController');
const notifCtrl      = require('../controllers/notificationController');
const positionCtrl   = require('../controllers/positionController');
const userCtrl       = require('../controllers/userController');

const { paginate } = require('../../../shared/utils/helpers');
const { ok, error } = require('../../../shared/utils/response');

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
router.get('/wallet',           auth, walletCtrl.getBalances);
router.get('/wallet/history',   auth, walletCtrl.getHistory);
router.post('/wallet/withdraw', auth, walletCtrl.createWithdrawal);

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
