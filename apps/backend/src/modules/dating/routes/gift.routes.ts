const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth');
const auditLogger = require('../../../shared/middlewares/auditLogger');
const giftCtrl = require('../controllers/giftController');

router.use(auth);

router.get('/gifts',       giftCtrl.getGifts);
router.post('/send',       auditLogger, giftCtrl.sendGift);

module.exports = router;
