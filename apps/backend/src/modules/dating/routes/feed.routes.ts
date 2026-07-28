const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const auditLogger = require('../../../shared/middlewares/audit/auditLogger');
const feedCtrl = require('../controllers/feedController');

router.use(auth);

router.get('/feed', feedCtrl.getFeed);
router.post('/posts', auditLogger, feedCtrl.createPost);
router.post('/posts/:postId/like', auditLogger, feedCtrl.toggleLike);

module.exports = router;
