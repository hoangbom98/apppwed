'use strict';
/**
 * payment-admin.routes.js — Admin-only payment gateway management.
 *
 * Mount inside admin module routes (already protected by auth + adminGuard):
 *
 *   // In src/modules/admin/routes/index.js  (after router.use(auth, adminGuard)):
 *   router.use('/payment', require('../../../shared/routes/payment-admin.routes'));
 */
const router  = require('express').Router();
const ctrl    = require('../controllers/paymentController');

// All routes here are already protected by admin module's auth + adminGuard

router.get   ('/',                  ctrl.adminListGateways);
router.get   ('/available',         ctrl.adminAvailableAdapters);
router.put   ('/:code',             ctrl.adminUpdateGateway);
router.post  ('/:code/toggle',      ctrl.adminToggleGateway);

module.exports = router;
