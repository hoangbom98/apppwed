const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const withdrawController = require('../controllers/withdrawController');

router.post('/withdraw', auth, withdrawController.requestWithdraw);
router.get('/withdraw/history', auth, withdrawController.getWithdrawHistory);

module.exports = router;
