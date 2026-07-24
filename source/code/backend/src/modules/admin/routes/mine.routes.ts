// backend/src/modules/admin/routes/mine.routes.js
// Mine (personal profile) routes — all require valid JWT + admin role
// Mounted at /api/admin/mine
'use strict';

const router    = require('express').Router();
const mineCtrl  = require('../controllers/mineController');

// Profile
router.get   ('/profile',                  mineCtrl.getProfile);
router.patch ('/profile',                  mineCtrl.updateProfile);

// Balance (latest from game DB)
router.get   ('/balance',                  mineCtrl.getBalance);

// VIP
router.get   ('/vip',                      mineCtrl.getVip);
router.get   ('/vip-configs',              mineCtrl.getVipConfigs);
router.put   ('/vip-configs/:id',          mineCtrl.updateVipConfig);

// Transactions
router.get   ('/transactions',             mineCtrl.getTransactions);

// Referrals
router.get   ('/referrals',                mineCtrl.getReferrals);

// Notifications
router.get   ('/notifications',            mineCtrl.getNotifications);
router.patch ('/notifications/:id/read',   mineCtrl.markNotificationRead);

// Support tickets
router.get   ('/tickets',                  mineCtrl.getTickets);
router.post  ('/tickets',                  mineCtrl.createTicket);

// Device management
router.get   ('/devices',                  mineCtrl.getDevices);
router.delete('/devices/:id',              mineCtrl.removeDevice);

module.exports = router;
