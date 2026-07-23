const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const prismaBridge = require('../middlewares/prismaBridge');

router.use(prismaBridge);
router.post('/send-email', controller.sendTestEmail);

module.exports = router;
