'use strict';
/**
 * payment.routes.js — Shared payment engine routes.
 *
 * Mount in each project module (hub, game, dating, trade, sports) that needs
 * payment:
 *
 *   // In routes/index.js:
 *   const paymentRoutes = require('../../../shared/routes/payment.routes');
 *   router.use('/payment', paymentRoutes);
 *
 * This gives each project its own deposit/withdraw endpoints that share
 * the same controller/adapter logic but write to the project's own DB.
 *
 * Admin gateway management is mounted separately at /api/admin (see below).
 */
const router     = require('express').Router();
const auth       = require('../middlewares/auth');
const ctrl       = require('../controllers/paymentController');

// ── Public ────────────────────────────────────────────────────────────────────
// Get active payment methods (no auth required — used for payment page)
router.get('/gateways', ctrl.getGateways);

// Webhook — NO auth; provider posts directly here; signature verified inside adapter
// e.g. POST /api/game/payment/webhook/lkvip
router.post('/webhook/:gatewayCode', ctrl.handleWebhook);

// ── Authenticated user ────────────────────────────────────────────────────────
router.use(auth);

router.post('/deposit',          ctrl.createDeposit);
router.post('/withdraw',         ctrl.createWithdraw);
router.get('/orders/deposit',    ctrl.getDepositHistory);
router.get('/orders/withdraw',   ctrl.getWithdrawHistory);

module.exports = router;
