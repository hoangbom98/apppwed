const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const adminGuard = require('../../../shared/middlewares/auth/adminGuard');
const adminController = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(auth, adminGuard);

// Withdrawal management
router.get('/admin/withdrawals', adminController.listWithdrawals);
router.post('/admin/withdrawals/:id/approve', adminController.approveWithdrawal);
router.post('/admin/withdrawals/:id/reject', adminController.rejectWithdrawal);

// Virtual accounts
router.get('/admin/virtual-accounts', adminController.listVirtualAccounts);

// AML alerts
router.get('/admin/aml-alerts', adminController.listAmlAlerts);
router.post('/admin/aml-alerts/:id/resolve', adminController.resolveAmlAlert);

// Bank accounts
router.get('/admin/bank-accounts', adminController.listBankAccounts);
router.post('/admin/bank-accounts', adminController.createBankAccount);
router.put('/admin/bank-accounts/:id', adminController.updateBankAccount);

module.exports = router;
