const router = require('express').Router();
const webhookController = require('../controllers/webhookController');

// No auth — verified by signature in controller
router.post('/webhook/deposit',       webhookController.handleDepositWebhook);
router.post('/webhooks/momo',         webhookController.handleMomoWebhook);

module.exports = router;
