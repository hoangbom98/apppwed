const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const balanceController = require('../controllers/balanceController');

router.get('/balance', auth, balanceController.getBalance);
router.get('/transactions', auth, balanceController.getTransactions);

module.exports = router;
