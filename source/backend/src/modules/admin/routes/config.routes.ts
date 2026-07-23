const express = require('express');
const router = express.Router();
const controller = require('../controllers/gameConfigController');
const { isAdmin } = require('../../../shared/middlewares/rbac'); // Assuming rbac middleware exists

// Config management endpoints
router.get('/', isAdmin, controller.getAll);
router.put('/', isAdmin, controller.update);

module.exports = router;
