const router = require('express').Router();
const configPublicCtrl = require('../controllers/configPublicController');

router.get('/config', configPublicCtrl.getConfigs);

module.exports = router;
