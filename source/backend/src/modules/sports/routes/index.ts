// @ts-nocheck
const router   = require('express').Router();
const auth     = require('../../../shared/middlewares/auth');
const { upload } = require('../../../shared/services/uploadService');

const authCtrl          = require('../controllers/authController');
const leagueCtrl        = require('../controllers/leagueController');
const teamCtrl          = require('../controllers/teamController');
const matchCtrl         = require('../controllers/matchController');
const standingCtrl      = require('../controllers/standingController');
const highlightCtrl     = require('../controllers/highlightController');
const videoCtrl         = require('../controllers/videoController');
const articleCtrl       = require('../controllers/articleController');
const communityCtrl     = require('../controllers/communityController');
const streamCtrl        = require('../controllers/streamController');
const favCtrl           = require('../controllers/favouriteController');
const notifCtrl         = require('../controllers/notificationController');
const searchCtrl        = require('../controllers/searchController');
const adCtrl            = require('../controllers/adController');
const bettingCtrl       = require('../controllers/bettingController');
const walletCtrl        = require('../controllers/walletController');
// Provider integration — shared GSC / Goldgate / TC Gaming
const providerCallbackCtrl  = require('../controllers/providerCallbackController');
const sportsProviderCtrl    = require('../controllers/sportsProviderController');

// ── Auth ──────────────────────────────────────────────────────────
router.post('/auth/register',   authCtrl.register);
router.post('/auth/login',      authCtrl.login);
router.post('/auth/refresh',    authCtrl.refresh);
router.get('/auth/me',          auth, authCtrl.me);
router.post('/auth/logout',     auth, authCtrl.logout);
router.put('/auth/profile',     auth, authCtrl.updateProfile);
router.post('/auth/avatar',     auth, upload.single('avatar'), authCtrl.uploadAvatar);

// ── Leagues ───────────────────────────────────────────────────────
router.get('/leagues',          leagueCtrl.list);
router.get('/leagues/:slug',    leagueCtrl.get);

// ── Teams ─────────────────────────────────────────────────────────
router.get('/teams',            teamCtrl.list);
router.get('/teams/:slug',      teamCtrl.get);

// ── Matches ───────────────────────────────────────────────────────
router.get('/matches',          matchCtrl.list);
router.get('/matches/live',     matchCtrl.getLive);
router.get('/matches/today',    matchCtrl.getToday);
router.get('/matches/:id',      matchCtrl.get);
router.post('/matches/:id/comments', auth, matchCtrl.addComment);

// ── Standings ─────────────────────────────────────────────────────
router.get('/standings/:leagueId', standingCtrl.getByLeague);

// ── Players ───────────────────────────────────────────────────────
router.get('/players',            async (req, res) => {
  const { paginate } = require('../../../shared/utils/helpers');
  const { page, limit } = paginate(req.query.page, req.query.limit);
  // players stored in Team.players JSON or separate table — graceful fallback
  return res.json({ success: true, data: [], meta: { total: 0, page, limit }, note: 'Player table not yet populated' });
});

// ── Highlights ───────────────────────────────────────────────────
router.get('/highlights',       highlightCtrl.list);
router.get('/highlights/:slug', highlightCtrl.get);

// ── Short Videos (Reels) ─────────────────────────────────────────
router.get('/videos',           videoCtrl.list);
router.get('/videos/:id',       videoCtrl.get);
router.post('/videos',          auth, videoCtrl.create);
router.post('/videos/:id/like', auth, videoCtrl.like);

// ── News & Articles ───────────────────────────────────────────────
router.get('/news',             articleCtrl.list);
router.get('/news/:slug',       articleCtrl.get);
router.get('/news/:id/comments', articleCtrl.getComments);
router.post('/news/comments',   auth, articleCtrl.addComment);

// ── Community ─────────────────────────────────────────────────────
router.get('/posts',            communityCtrl.getFeed);
router.post('/posts',           auth, communityCtrl.createPost);
router.get('/posts/:id',        communityCtrl.getPost);
router.post('/posts/:id/like',  auth, communityCtrl.likePost);
router.get('/posts/:id/comments', communityCtrl.getComments);
router.post('/posts/comments',  auth, communityCtrl.addComment);
router.delete('/posts/:id',     auth, communityCtrl.deletePost);

// ── Live Streams ──────────────────────────────────────────────────
router.get('/streams',             streamCtrl.list);
router.get('/streams/:id',         streamCtrl.get);
router.get('/streams/:id/chat',    streamCtrl.getChat);
router.post('/streams',            auth, streamCtrl.start);
router.post('/streams/:id/end',    auth, streamCtrl.end);
router.post('/streams/:id/join',   auth, streamCtrl.join);
router.post('/streams/:id/leave',  auth, streamCtrl.leave);

// ── Favourites ────────────────────────────────────────────────────
router.get('/favorites',           auth, favCtrl.list);
router.post('/favorites',          auth, favCtrl.add);
router.delete('/favorites/:type/:id', auth, favCtrl.remove);

// ── Notifications ─────────────────────────────────────────────────
router.get('/notifications',              auth, notifCtrl.list);
router.get('/notifications/unread-count', auth, notifCtrl.getUnreadCount);
router.put('/notifications/:id/read',     auth, notifCtrl.markRead);
router.put('/notifications/read-all',     auth, notifCtrl.markAllRead);

// ── Search ────────────────────────────────────────────────────────
router.get('/search',              searchCtrl.search);

// ── Ads ───────────────────────────────────────────────────────────
router.get('/ads',                 adCtrl.getByPosition);

// ── Health ────────────────────────────────────────────────────────
router.get('/health', (_req, res) => res.json({ status: 'ok', module: 'sports' }));

// ── Provider Integration (GSC / Goldgate / TC Gaming) ─────────────
// User endpoints (require auth)
router.get('/provider/launch',        auth, sportsProviderCtrl.launch);
router.post('/provider/transfer-in',  auth, sportsProviderCtrl.transferIn);
router.post('/provider/transfer-out', auth, sportsProviderCtrl.transferOut);

// Provider seamless callbacks (no auth — verified by signature)
router.post('/callbacks/gsc',                    providerCallbackCtrl.gsc);
router.post('/callbacks/goldgate/balance',        providerCallbackCtrl.goldgateBalance);
router.post('/callbacks/goldgate/transaction',    providerCallbackCtrl.goldgateTransaction);
router.post('/callbacks/tc-gaming/seamless',      providerCallbackCtrl.tcGamingSeamless);

// ── Wallet ────────────────────────────────────────────────────────
router.get('/wallet',          auth, walletCtrl.getWallet);
router.get('/wallet/history',  auth, walletCtrl.getHistory);
router.post('/wallet/deposit', auth, walletCtrl.createDeposit);
router.post('/wallet/withdraw',auth, walletCtrl.createWithdraw);

// ── Betting ───────────────────────────────────────────────────────
router.get('/betting/events',          bettingCtrl.getEvents);
router.get('/betting/events/:id',      bettingCtrl.getEvent);
router.get('/betting/markets/:eventId',bettingCtrl.getMarkets);
router.post('/betting/bets',  auth,   bettingCtrl.placeBet);
router.get('/betting/my-bets',auth,   bettingCtrl.getMyBets);
router.get('/betting/bets/:id',auth,  bettingCtrl.getBetById);

// ── Admin: betting settlement ─────────────────────────────────────
const adminGuard  = require('../../../shared/middlewares/adminGuard');
const adminCtrl   = require('../controllers/adminController');
router.post('/betting/admin/settle',    auth, adminGuard, bettingCtrl.settleBets);
// Admin: sync provider odds into sports_db
router.post('/provider/sync-odds',      auth, adminGuard, sportsProviderCtrl.syncOdds);

// ── Admin: content management (delegated to adminController) ──────
router.get('/admin/leagues',            auth, adminGuard, adminCtrl.listLeagues);
router.post('/admin/leagues',           auth, adminGuard, adminCtrl.createLeague);
router.put('/admin/leagues/:id',        auth, adminGuard, adminCtrl.updateLeague);
router.delete('/admin/leagues/:id',     auth, adminGuard, adminCtrl.deleteLeague);

router.get('/admin/teams',              auth, adminGuard, adminCtrl.listTeams);
router.post('/admin/teams',             auth, adminGuard, adminCtrl.createTeam);
router.put('/admin/teams/:id',          auth, adminGuard, adminCtrl.updateTeam);
router.delete('/admin/teams/:id',       auth, adminGuard, adminCtrl.deleteTeam);

router.get('/admin/matches',            auth, adminGuard, adminCtrl.listMatches);
router.post('/admin/matches',           auth, adminGuard, adminCtrl.createMatch);
router.put('/admin/matches/:id',        auth, adminGuard, adminCtrl.updateMatch);

router.get('/admin/articles',           auth, adminGuard, adminCtrl.listArticles);
router.post('/admin/articles',          auth, adminGuard, adminCtrl.createArticle);
router.put('/admin/articles/:id',       auth, adminGuard, adminCtrl.updateArticle);
router.delete('/admin/articles/:id',    auth, adminGuard, adminCtrl.deleteArticle);

router.get('/admin/bets',               auth, adminGuard, adminCtrl.listBets);
router.patch('/admin/bets/:id',         auth, adminGuard, adminCtrl.updateBet);

router.get('/admin/users',              auth, adminGuard, adminCtrl.listUsers);

// ── Shared: Support Chat / Tickets / Knowledge ────────────────────
const supportRoutes = require('../../../shared/routes/support.routes.js');
router.use('/', supportRoutes);

module.exports = router;
