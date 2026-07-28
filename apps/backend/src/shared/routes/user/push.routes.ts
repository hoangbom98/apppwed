'use strict';
/**
 * Shared push notification routes
 * Mount in each project's route file:
 *
 *   const pushRoutes = require('../../../shared/routes/push.routes');
 *   router.use('/', pushRoutes);
 */

const router = require('express').Router();
const auth   = require('../middlewares/auth');
const pushCtrl = require('../controllers/pushController');

// Public — browser needs VAPID public key before calling pushManager.subscribe()
router.get('/push/vapid-public-key', pushCtrl.getVapidPublicKey);

// Protected — subscription management
router.post('/push/subscribe',    auth, pushCtrl.subscribe);
router.delete('/push/unsubscribe', auth, pushCtrl.unsubscribe);

module.exports = router;
