const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const auditLogger = require('../../../shared/middlewares/audit/auditLogger');
const storyCtrl = require('../controllers/storyController');

router.use(auth);

router.get('/stories',           storyCtrl.getStories);
router.post('/stories',          auditLogger, storyCtrl.createStory);
router.post('/stories/:id/view', auditLogger, storyCtrl.viewStory);

module.exports = router;
