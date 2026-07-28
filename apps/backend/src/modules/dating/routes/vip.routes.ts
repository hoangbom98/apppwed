const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const auditLogger = require('../../../shared/middlewares/audit/auditLogger');
const vipCtrl = require('../controllers/vipController');

router.get('/plans',       vipCtrl.getPlans);
router.get('/status',      auth, vipCtrl.getStatus);
router.post('/purchase',   auth, auditLogger, vipCtrl.purchaseVip);

module.exports = router;
