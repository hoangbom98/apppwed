const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const auditLogger = require('../../../shared/middlewares/audit/auditLogger');
const matchCtrl = require('../controllers/matchController');

router.use(auth);

router.get('/suggestions',                 matchCtrl.getSuggestions);
router.post('/like',       auditLogger,    matchCtrl.like);
router.post('/super-like', auditLogger,    matchCtrl.superLike);
router.post('/nope',       auditLogger,    matchCtrl.nope);
router.get('/matches',                     matchCtrl.getMatches);
router.post('/matches/:matchId/accept', auditLogger, matchCtrl.acceptMatch);
router.post('/matches/:matchId/reject', auditLogger, matchCtrl.rejectMatch);

module.exports = router;
