const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth');
const depositController = require('../controllers/depositController');

router.post('/deposit', auth, depositController.createDeposit);
router.get('/deposit/history', auth, depositController.getDepositHistory);

module.exports = router;
