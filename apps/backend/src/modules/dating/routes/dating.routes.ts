const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const auditLogger = require('../../../shared/middlewares/audit/auditLogger');
const datingP1 = require('../controllers/datingP1Controller');
const datingP2 = require('../controllers/datingP2Controller');
const datingP2Plus = require('../controllers/datingP2PlusController');

router.use(auth);

// P1
router.post('/gifts/send', auditLogger, datingP1.sendGift);
router.post('/vip/purchase', auditLogger, datingP1.purchaseVip);

// P2
router.get('/feed', datingP2.getFeed);
router.post('/feed/post', auditLogger, datingP2.createPost);
router.get('/stories', datingP2.getStories);

// P2+
router.get('/live/active', datingP2Plus.getActive);
router.get('/call/history', datingP2Plus.getHistory);

module.exports = router;
