'use strict';
/**
 * shared/routes/wallet.routes.ts
 * Mount per-project: router.use('/', require('../../../shared/routes/wallet.routes'));
 *
 * Endpoints:
 *   GET  /wallet/balance           — user: balance + frozen amount
 *   GET  /wallet/transactions      — user: transaction history (paginated)
 *   POST /wallet/deposit           — user: create deposit order
 *   POST /wallet/withdraw          — user: create withdrawal request
 *   POST /admin/wallet/deposit/:orderId/confirm  — admin: confirm deposit
 *   POST /admin/wallet/withdraw/:orderId/approve — admin: approve withdrawal
 *   POST /admin/wallet/withdraw/:orderId/reject  — admin: reject withdrawal
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');
const auditLog   = require('../middlewares/auditLogger');
const ctrl       = require('../controllers/walletController');

// ── User ──────────────────────────────────────────────────────────────────────
router.get('/wallet/balance',          auth,             ctrl.getBalance);
router.get('/wallet/transactions',     auth,             ctrl.getTransactions);
router.post('/wallet/deposit',         auth, auditLog,   ctrl.createDeposit);
router.post('/wallet/withdraw',        auth, auditLog,   ctrl.createWithdraw);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post('/admin/wallet/deposit/:orderId/confirm',    auth, adminGuard, auditLog, ctrl.confirmDeposit);
router.post('/admin/wallet/withdraw/:orderId/approve',   auth, adminGuard, auditLog, ctrl.approveWithdraw);
router.post('/admin/wallet/withdraw/:orderId/reject',    auth, adminGuard, auditLog, ctrl.rejectWithdraw);

module.exports = router;
