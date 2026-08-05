const router   = require('express').Router();
const auth     = require('../../../shared/middlewares/auth/auth');
const adminGuard = require('../../../shared/middlewares/auth/adminGuard');
const auditLogger = require('../../../shared/middlewares/audit/auditLogger');
const { httpCache }         = require('../../../shared/middlewares/core/httpCache');
const { validateJoi }       = require('../../../shared/middlewares/validation/validate');
const autocompleteCtrl    = require('../controllers/autocompleteController');
const authCtrl            = require('../controllers/authController');
const cmsCtrl             = require('../controllers/cmsController');
const portalCtrl          = require('../controllers/portalController');
const adminCtrl           = require('../controllers/adminController');
const downloadCtrl        = require('../controllers/downloadController');
const eventCtrl           = require('../controllers/eventController');
const newsCommentCtrl     = require('../controllers/newsCommentController');
const appCatalogCtrl      = require('../../admin/controllers/appCatalogController');
const socialChannelCtrl   = require('../controllers/socialChannelController');
const inquiryCtrl         = require('../controllers/inquiryController');
// ── Social App (migrated từ apps/external/social) ─────────────────────────────
const socialPostCtrl      = require('../controllers/socialPostController');
// ── ProDevs CLI (migrated từ apps/external/prodevs) ──────────────────────────
const prodevsCtrl         = require('../controllers/prodevsController');
const {
  submitInquiry,
  updateInquiryStatus,
  createSocialChannel,
  updateSocialChannel,
} = require('../validators/inquirySocialValidator');
const {
  updateSocialPost,
  updateSocialReport,
  createProdevsProject,
  updateProdevsProject,
  createProdevsTemplate,
  updateProdevsTemplate,
  updateProdevsAIConfig,
} = require('../validators/socialProdevsValidator');

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

// ── Social Channels (public) ─────────────────────────────────────────────────
router.get('/social-channels',   httpCache(300), socialChannelCtrl.listActive);

// ── Inquiry (public) ─────────────────────────────────────────────────────────
router.post('/inquiry',          submitInquiry ? validateJoi(submitInquiry) : (req,res,next)=>next(), inquiryCtrl.submit);

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

// ── Admin: Social Channels ────────────────────────────────────────────────────
router.get('/admin/social-channels',       auth, adminGuard,              socialChannelCtrl.list);
router.post('/admin/social-channels',      auth, adminGuard, auditLogger, createSocialChannel ? validateJoi(createSocialChannel) : (req,res,next)=>next(), socialChannelCtrl.create);
router.patch('/admin/social-channels/:id', auth, adminGuard, auditLogger, updateSocialChannel ? validateJoi(updateSocialChannel) : (req,res,next)=>next(), socialChannelCtrl.update);
router.delete('/admin/social-channels/:id', auth, adminGuard, auditLogger, socialChannelCtrl.remove);

// ── Admin: Inquiries ──────────────────────────────────────────────────────────
router.get('/admin/inquiries',               auth, adminGuard, inquiryCtrl.list);
router.get('/admin/inquiries/:id',           auth, adminGuard, inquiryCtrl.get);
router.patch('/admin/inquiries/:id/status',  auth, adminGuard, auditLogger, updateInquiryStatus ? validateJoi(updateInquiryStatus) : (req,res,next)=>next(), inquiryCtrl.updateStatus);

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
const supportRoutes = require('../../../shared/routes/support/support.routes');
router.use('/', supportRoutes);

// ── Shared: Push Notifications ────────────────────────────────────
router.use('/', require('../../../shared/routes/user/push.routes'));

// ── Core: Referral (shared) ───────────────────────────────────────
router.use('/', require('../../../shared/routes/user/referral.routes'));

// ── Core: Loyalty (shared) ───────────────────────────────────────
router.use('/', require('../../../shared/routes/user/loyalty.routes'));

// ── Core: Affiliate (shared) ─────────────────────────────────────
router.use('/', require('../../../shared/routes/user/affiliate.routes'));

// ── Core: Leaderboard (shared) ───────────────────────────────────
router.use('/', require('../../../shared/routes/user/leaderboard.routes'));

// ── Core: Marketing Campaigns (admin, shared) ─────────────────────
router.use('/', require('../../../shared/routes/user/campaign.routes'));

// ── App Catalog (public — reads from admin_db, no auth required) ───
router.get('/app-catalog',   httpCache(300), appCatalogCtrl.publicList);

// ── Portal (lkvipgroup.com) ───────────────────────────────────────────────
router.get('/portal/news',          httpCache(120), portalCtrl.getPortalNews);
router.get('/portal/news/:slug',    httpCache(300), portalCtrl.getPortalNewsDetail);
router.get('/portal/ecosystem',     httpCache(600), portalCtrl.getEcosystemItems);
router.get('/portal/careers',       httpCache(300), portalCtrl.getCareers);
router.post('/portal/contact',                      portalCtrl.submitContact);

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
  const twoFACtrl = require('../../../shared/controllers/auth/twoFactorController');
  router.post('/auth/2fa/setup',    auth, twoFACtrl.setup);
  router.post('/auth/2fa/enable',   auth, twoFACtrl.enable);
  router.post('/auth/2fa/disable',  auth, twoFACtrl.disable);
  router.post('/auth/2fa/verify',   auth, twoFACtrl.verify);
  router.get('/auth/2fa/backup',    auth, twoFACtrl.regenerateBackupCodes);
}

// ── Social App — Admin routes (migrated từ apps/external/social) ──────────────
const _validateSocialPost   = updateSocialPost   ? validateJoi(updateSocialPost)   : (req,res,next) => next();
const _validateSocialReport = updateSocialReport ? validateJoi(updateSocialReport) : (req,res,next) => next();

router.get('/admin/social-posts',          auth, adminGuard, socialPostCtrl.listPosts);
router.get('/admin/social-posts/:id',      auth, adminGuard, socialPostCtrl.getPost);
router.patch('/admin/social-posts/:id',    auth, adminGuard, auditLogger, _validateSocialPost,   socialPostCtrl.updatePost);
router.delete('/admin/social-posts/:id',   auth, adminGuard, auditLogger, socialPostCtrl.removePost);

router.get('/admin/social-reports',        auth, adminGuard, socialPostCtrl.listReports);
router.get('/admin/social-reports/:id',    auth, adminGuard, socialPostCtrl.getReport);
router.patch('/admin/social-reports/:id',  auth, adminGuard, auditLogger, _validateSocialReport, socialPostCtrl.updateReport);
router.delete('/admin/social-reports/:id', auth, adminGuard, auditLogger, socialPostCtrl.removeReport);

router.get('/admin/social-stats',          auth, adminGuard, socialPostCtrl.getStats);

// ── ProDevs CLI — Admin routes (migrated từ apps/external/prodevs) ───────────
const _vProdevsProjectCreate   = createProdevsProject  ? validateJoi(createProdevsProject)  : (req,res,next) => next();
const _vProdevsProjectUpdate   = updateProdevsProject  ? validateJoi(updateProdevsProject)  : (req,res,next) => next();
const _vProdevsTemplateCreate  = createProdevsTemplate ? validateJoi(createProdevsTemplate) : (req,res,next) => next();
const _vProdevsTemplateUpdate  = updateProdevsTemplate ? validateJoi(updateProdevsTemplate) : (req,res,next) => next();
const _vProdevsAIConfig        = updateProdevsAIConfig ? validateJoi(updateProdevsAIConfig) : (req,res,next) => next();

router.get('/admin/prodevs/projects',          auth, adminGuard, prodevsCtrl.listProjects);
router.get('/admin/prodevs/projects/:id',      auth, adminGuard, prodevsCtrl.getProject);
router.post('/admin/prodevs/projects',         auth, adminGuard, auditLogger, _vProdevsProjectCreate,  prodevsCtrl.createProject);
router.put('/admin/prodevs/projects/:id',      auth, adminGuard, auditLogger, _vProdevsProjectUpdate,  prodevsCtrl.updateProject);
router.delete('/admin/prodevs/projects/:id',   auth, adminGuard, auditLogger, prodevsCtrl.removeProject);

router.get('/admin/prodevs/templates',         auth, adminGuard, prodevsCtrl.listTemplates);
router.get('/admin/prodevs/templates/:id',     auth, adminGuard, prodevsCtrl.getTemplate);
router.post('/admin/prodevs/templates',        auth, adminGuard, auditLogger, _vProdevsTemplateCreate, prodevsCtrl.createTemplate);
router.put('/admin/prodevs/templates/:id',     auth, adminGuard, auditLogger, _vProdevsTemplateUpdate, prodevsCtrl.updateTemplate);
router.delete('/admin/prodevs/templates/:id',  auth, adminGuard, auditLogger, prodevsCtrl.removeTemplate);

router.get('/admin/prodevs/ai-config',         auth, adminGuard, prodevsCtrl.getAIConfig);
router.put('/admin/prodevs/ai-config',         auth, adminGuard, auditLogger, _vProdevsAIConfig, prodevsCtrl.updateAIConfig);

router.get('/admin/prodevs/stats',             auth, adminGuard, prodevsCtrl.getStats);

module.exports = router;
