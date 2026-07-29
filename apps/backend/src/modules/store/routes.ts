const router  = require('express').Router();
const auth    = require('../../../shared/middlewares/auth/auth');
const adminGuard = require('../../../shared/middlewares/auth/adminGuard');
const { httpCache } = require('../../../shared/middlewares/core/httpCache');
const productCtrl = require('./controllers/productController');
const orderCtrl   = require('./controllers/orderController');
const assetCtrl   = require('./controllers/assetController');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/products',          httpCache(120), productCtrl.getProducts);
router.get('/products/search',                   productCtrl.searchProducts);
router.get('/products/:slug',    httpCache(300), productCtrl.getProductBySlug);

// ── Authenticated ─────────────────────────────────────────────────────────────
router.post('/checkout',                  auth, orderCtrl.checkout);
router.get('/orders',                     auth, orderCtrl.getOrders);
router.get('/orders/:id',                 auth, orderCtrl.getOrderById);

router.get('/resources',                  auth, assetCtrl.getMyResources);
router.get('/download/:assetId',          auth, assetCtrl.downloadAsset);

router.get('/api-keys',                   auth, assetCtrl.getAPIKeys);
router.post('/api-keys',                  auth, assetCtrl.createAPIKey);

router.get('/subscriptions',              auth, assetCtrl.getSubscriptions);

module.exports = router;
