'use strict';
/**
 * payment-monitor.routes.js — Admin-only payment channel monitoring.
 *
 * Mount in admin routes:
 *   router.use('/payment/monitor', require('../../../shared/routes/payment-monitor.routes'));
 *
 * All routes require auth + adminGuard (applied in admin router).
 */
const router = require('express').Router();
const ctrl   = require('../controllers/paymentMonitorController');

router.get('/summary',           ctrl.getSummary);
router.get('/channels',          ctrl.getChannels);
router.get('/pending',           ctrl.getPendingOrders);
router.post('/retry/:orderId',   ctrl.retryOrder);

module.exports = router;
