const router   = require('express').Router();
const auth     = require('../../../shared/middlewares/auth');
const adminGuard = require('../../../shared/middlewares/adminGuard');
const auditLogger = require('../../../shared/middlewares/auditLogger');
const { httpCache } = require('../../../shared/middlewares/httpCache');
const autocompleteCtrl = require('../controllers/autocompleteController');
const authCtrl   = require('../controllers/authController');
const cmsCtrl    = require('../controllers/cmsController');
const adminCtrl  = require('../controllers/adminController');
const downloadCtrl    = require('../controllers/downloadController');
const eventCtrl       = require('../controllers/eventController');
const newsCommentCtrl = require('../controllers/newsCommentController');
const appCatalogCtrl  = require('../../admin/controllers/appCatalogController');

// ── Autocomplete (public) ─────────────────────────────────────────
router.get('/autocomplete', autocompleteCtrl.autocomplete);

// ── Public (cached) ───────────────────────────────────────────────
router.get('/categories',        httpCache(600), cmsCtrl.getCategories);
router.get('/games',             httpCache(300), cmsCtrl.getGames);
router.get('/games/:slug',       httpCache(600), cmsCtrl.getGameBySlug);
router.get('/websites',          httpCache(300), cmsCtrl.getWebsites);
router.get('/tools',             httpCache(300), cmsCtrl.getTools);
router.get('/tools/:slug',       httpCache(600), cmsCtrl.getToolBySlug);
router.get('/news',              httpCache(120), cmsCtrl.getNews);
router.get('/news/:slug',        httpCache(300), cmsCtrl.getNewsBySlug);
router.get('/pages/:slug',       httpCache(600), cmsCtrl.getPage);
router.get('/banners',           httpCache(300), cmsCtrl.getBanners);
router.get('/menus/:location',   httpCache(600), cmsCtrl.getMenu);
router.get('/search',            cmsCtrl.search);              // no cache (query-sensitive)
router.post('/feedback',         cmsCtrl.submitFeedback);

// ── Auth ──────────────────────────────────────────────────────────
router.post('/auth/register',       authCtrl.register);
router.post('/auth/login',          authCtrl.login);
router.post('/auth/refresh-token',  authCtrl.refreshToken);
router.post('/auth/logout',         authCtrl.logout);

// ── Protected ─────────────────────────────────────────────────────
router.get('/profile',             auth, authCtrl.me);
router.put('/profile',             auth, authCtrl.updateProfile);
router.put('/profile/password',    auth, authCtrl.changePassword);
router.get('/notifications',       auth, cmsCtrl.getNotifications);
router.put('/notifications/:id/read', auth, cmsCtrl.markNotifRead);
router.get('/favorites',           auth, cmsCtrl.getFavorites);
router.post('/favorites',          auth, cmsCtrl.addFavorite);
router.delete('/favorites/:id',    auth, cmsCtrl.removeFavorite);

// ── Admin ─────────────────────────────────────────────────────────
router.get('/admin/dashboard',     auth, adminGuard, adminCtrl.dashboard);

const adminRoute = (path, ctrl) => {
  router.get(`/admin/${path}`,       auth, adminGuard, ctrl.list);
  router.get(`/admin/${path}/:id`,   auth, adminGuard, ctrl.get);
  router.post(`/admin/${path}`,      auth, adminGuard, auditLogger, ctrl.create);
  router.put(`/admin/${path}/:id`,   auth, adminGuard, auditLogger, ctrl.update);
  router.delete(`/admin/${path}/:id`, auth, adminGuard, auditLogger, ctrl.remove);
};

adminRoute('games',      adminCtrl.adminGames);
adminRoute('categories', adminCtrl.adminCategories);
adminRoute('websites',   adminCtrl.adminWebsites);
adminRoute('tools',      adminCtrl.adminTools);
adminRoute('news',       adminCtrl.adminNews);
adminRoute('pages',      adminCtrl.adminPages);
adminRoute('banners',    adminCtrl.adminBanners);
adminRoute('users',      adminCtrl.adminUsers);
adminRoute('feedbacks',  adminCtrl.adminFeedbacks);

router.get('/admin/menus',         auth, adminGuard, adminCtrl.adminMenus.list);
router.put('/admin/menus',         auth, adminGuard, adminCtrl.adminMenus.update);
router.get('/admin/settings',      auth, adminGuard, adminCtrl.getSettings);
router.post('/admin/settings',     auth, adminGuard, adminCtrl.updateSettings);

// ── SEO Metadata ──────────────────────────────────────────────────
const seoCtrl = require('../controllers/seoController');
router.get('/seo/meta',              seoCtrl.getMeta);
// Admin SEO CRUD
router.post('/admin/seo',            auth, adminGuard, auditLogger, seoCtrl.create);
router.put('/admin/seo/:id',         auth, adminGuard, auditLogger, seoCtrl.update);
router.delete('/admin/seo/:id',      auth, adminGuard, auditLogger, seoCtrl.remove);

// ── Shared: Support Chat / Tickets / Knowledge ────────────────────
const supportRoutes = require('../../../shared/routes/support.routes.js');
router.use('/', supportRoutes);

// ── Shared: Push Notifications ────────────────────────────────────
router.use('/', require('../../../shared/routes/push.routes'));

// ── Core: Referral (shared) ───────────────────────────────────────
router.use('/', require('../../../shared/routes/referral.routes'));

// ── Core: Loyalty (shared) ───────────────────────────────────────
router.use('/', require('../../../shared/routes/loyalty.routes'));

// ── Core: Affiliate (shared) ─────────────────────────────────────
router.use('/', require('../../../shared/routes/affiliate.routes'));

// ── Core: Leaderboard (shared) ───────────────────────────────────
router.use('/', require('../../../shared/routes/leaderboard.routes'));

// ── Core: Marketing Campaigns (admin, shared) ─────────────────────
router.use('/', require('../../../shared/routes/campaign.routes'));

// ── App Catalog (public — reads from admin_db, no auth required) ───
router.get('/app-catalog',   httpCache(300), appCatalogCtrl.publicList);

// ── Downloads ─────────────────────────────────────────────────────
router.get('/downloads',              downloadCtrl.list);
router.get('/downloads/:slug',        downloadCtrl.get);
router.post('/downloads',             adminGuard, downloadCtrl.create);
router.put('/downloads/:id',          adminGuard, downloadCtrl.update);
router.delete('/downloads/:id',       adminGuard, downloadCtrl.delete);

// ── Events ────────────────────────────────────────────────────────
router.get('/events',                 eventCtrl.list);
router.get('/events/my',              auth, eventCtrl.myEvents);
router.get('/events/:slug',           eventCtrl.get);
router.post('/events/:id/register',   auth, eventCtrl.register);
router.post('/events',                adminGuard, eventCtrl.create);
router.put('/events/:id',             adminGuard, eventCtrl.update);

// ── News Comments ─────────────────────────────────────────────────
router.get('/news/:newsId/comments',       newsCommentCtrl.list);
router.post('/news/:newsId/comments',      auth, newsCommentCtrl.create);
router.post('/news/comments/:id/like',     auth, newsCommentCtrl.like);
router.delete('/news/comments/:id',        auth, newsCommentCtrl.delete);

// ── 2FA ───────────────────────────────────────────────────────────
if (process.env.ENABLE_2FA === 'true') {
  const twoFACtrl = require('../../../shared/controllers/twoFactorController');
  router.post('/auth/2fa/setup',    auth, twoFACtrl.setup);
  router.post('/auth/2fa/enable',   auth, twoFACtrl.enable);
  router.post('/auth/2fa/disable',  auth, twoFACtrl.disable);
  router.post('/auth/2fa/verify',   auth, twoFACtrl.verify);
  router.get('/auth/2fa/backup',    auth, twoFACtrl.regenerateBackupCodes);
}

module.exports = router;
