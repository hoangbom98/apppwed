// backend/src/modules/admin/routes/dashboard.routes.js
const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getStats);
router.get('/chart/revenue', dashboardController.getRevenueChart);

module.exports = router;
