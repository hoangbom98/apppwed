const router         = require('express').Router();
const auth           = require('../../../shared/middlewares/auth');
const depositCtrl    = require('../controllers/depositController');

// ── Sub-routes ───────────────────────────────────────────────────
router.use('/', require('./deposit.routes'));
router.use('/', require('./withdraw.routes'));
router.use('/', require('./balance.routes'));
router.use('/', require('./webhook.routes'));
router.use('/', require('./admin.routes'));

// ── Gateway-specific deposit endpoints (delegated to controller) ──
router.post('/deposit/momo',    auth, depositCtrl.createMomoDeposit);
router.post('/deposit/zalopay', auth, depositCtrl.createZaloPayDeposit);
router.post('/deposit/vnpay',   auth, depositCtrl.createVNPayDeposit);

module.exports = router;
