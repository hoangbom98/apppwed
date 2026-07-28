// src/modules/sports/routes/index.ts
// @ts-nocheck
'use strict';
/**
 * Sports Module — Full Route Table
 *
 * All controllers live in controllers/. The projectResolver middleware
 * (applied globally in server.ts) injects req.prisma = sports_db client
 * before any of these handlers run.
 *
 * Auth:           POST /api/sports/auth/*
 * Leagues:        GET  /api/sports/leagues[/:slug]
 * Teams:          GET  /api/sports/teams[/:slug]
 * Matches:        GET  /api/sports/matches[/live|today|/:id]
 * Standings:      GET  /api/sports/standings/:leagueId
 * Highlights:     GET  /api/sports/highlights[/:slug]
 * Short Videos:   GET/POST /api/sports/videos[/:id]
 * News/Articles:  GET  /api/sports/news[/:slug]
 * Community:      GET/POST /api/sports/posts[/:id]
 * Livestreams:    GET/POST /api/sports/streams[/:id]
 * Betting:        GET/POST /api/sports/betting/*
 * Wallet:         GET/POST /api/sports/wallet/*
 * Favorites:      GET/POST/DELETE /api/sports/favorites/*
 * Notifications:  GET/PUT /api/sports/notifications/*
 * Search:         GET /api/sports/search
 * Ads:            GET /api/sports/ads
 * Provider:       GET/POST /api/sports/provider/*
 * Callbacks:      POST /api/sports/callbacks/*
 * Admin:          GET/POST/PUT/DELETE /api/sports/admin/*
 */

const { Router } = require('express');
const authenticate = require('../../../shared/middlewares/auth/auth');

// ── Role guard — admin only ───────────────────────────────────────────────────
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin only' } });
  }
  next();
}

// ── Controllers ───────────────────────────────────────────────────────────────
const auth          = require('../controllers/authController');
const leagueCtrl    = require('../controllers/leagueController');
const teamCtrl      = require('../controllers/teamController');
const matchCtrl     = require('../controllers/matchController');
const standingCtrl  = require('../controllers/standingController');
const highlightCtrl = require('../controllers/highlightController');
const videoCtrl     = require('../controllers/videoController');
const articleCtrl   = require('../controllers/articleController');
const communityCtrl = require('../controllers/communityController');
const streamCtrl    = require('../controllers/streamController');
const bettingCtrl   = require('../controllers/bettingController');
const walletCtrl    = require('../controllers/walletController');
const favCtrl       = require('../controllers/favouriteController');
const notifCtrl     = require('../controllers/notificationController');
const searchCtrl    = require('../controllers/searchController');
const adCtrl        = require('../controllers/adController');
const providerCtrl  = require('../controllers/sportsProviderController');
const cbCtrl        = require('../controllers/providerCallbackController');
const adminCtrl     = require('../controllers/adminController');
const userCtrl      = require('../controllers/userController');
const eventCtrl     = require('../controllers/eventController');
const promoCtrl     = require('../controllers/promotionController');

const router = Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register',       auth.register);
router.post('/auth/login',          auth.login);
router.post('/auth/refresh',        auth.refresh);
router.post('/auth/logout',         authenticate, auth.logout);
router.get('/auth/me',              authenticate, auth.me);
router.put('/auth/profile',         authenticate, auth.updateProfile);

// ── Leagues ───────────────────────────────────────────────────────────────────
router.get('/leagues',              leagueCtrl.list);
router.get('/leagues/:slug',        leagueCtrl.get);

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/teams',                teamCtrl.list);
router.get('/teams/:slug',          teamCtrl.get);

// ── Matches ───────────────────────────────────────────────────────────────────
router.get('/matches',              matchCtrl.list);
router.get('/matches/live',         matchCtrl.getLive);
router.get('/matches/today',        matchCtrl.getToday);
router.get('/matches/:id',          matchCtrl.get);
router.post('/matches/:id/comments', authenticate, matchCtrl.addComment);

// ── Standings ─────────────────────────────────────────────────────────────────
router.get('/standings/:leagueId',  standingCtrl.getByLeague);

// ── Highlights ────────────────────────────────────────────────────────────────
router.get('/highlights',           highlightCtrl.list);
router.get('/highlights/:slug',     highlightCtrl.get);

// ── Short Videos ──────────────────────────────────────────────────────────────
router.get('/videos',               videoCtrl.list);
router.get('/videos/:id',           videoCtrl.get);
router.post('/videos',              authenticate, videoCtrl.create);
router.post('/videos/:id/like',     authenticate, videoCtrl.like);

// ── News / Articles ───────────────────────────────────────────────────────────
router.get('/news',                 articleCtrl.list);
router.get('/news/:slug',           articleCtrl.get);
router.get('/news/:id/comments',    articleCtrl.getComments);
router.post('/news/comments',       authenticate, articleCtrl.addComment);

// ── Community Posts ───────────────────────────────────────────────────────────
router.get('/posts',                communityCtrl.getFeed);
router.post('/posts',               authenticate, communityCtrl.createPost);
router.get('/posts/:id',            communityCtrl.getPost);
router.post('/posts/:id/like',      authenticate, communityCtrl.likePost);
router.get('/posts/:id/comments',   communityCtrl.getComments);
router.post('/posts/comments',      authenticate, communityCtrl.addComment);
router.delete('/posts/:id',         authenticate, communityCtrl.deletePost);

// ── Live Streams ──────────────────────────────────────────────────────────────
router.get('/streams',              streamCtrl.list);
router.get('/streams/:id',          streamCtrl.get);
router.get('/streams/:id/chat',     streamCtrl.getChat);
router.post('/streams/start',       authenticate, streamCtrl.start);
router.put('/streams/:id/end',      authenticate, streamCtrl.end);
router.post('/streams/:id/join',    authenticate, streamCtrl.join);
router.post('/streams/:id/leave',   authenticate, streamCtrl.leave);

// ── Betting ───────────────────────────────────────────────────────────────────
router.get('/betting/events',       bettingCtrl.getEvents);
router.get('/betting/events/:id',   bettingCtrl.getEvent);
router.get('/betting/markets/:eventId', bettingCtrl.getMarkets);
router.post('/betting/bets',        authenticate, bettingCtrl.placeBet);
router.get('/betting/my-bets',      authenticate, bettingCtrl.getMyBets);
router.get('/betting/bets/:id',     authenticate, bettingCtrl.getBetById);
router.post('/betting/admin/settle', authenticate, adminOnly, bettingCtrl.settleBets);

// ── Wallet ────────────────────────────────────────────────────────────────────
router.get('/wallet',               authenticate, walletCtrl.getWallet);
router.get('/wallet/history',       authenticate, walletCtrl.getHistory);
router.post('/wallet/deposit',      authenticate, walletCtrl.createDeposit);
router.post('/wallet/withdraw',     authenticate, walletCtrl.createWithdraw);

// ── Favourites ────────────────────────────────────────────────────────────────
router.get('/favorites',            authenticate, favCtrl.list);
router.post('/favorites',           authenticate, favCtrl.add);
router.delete('/favorites/:type/:id', authenticate, favCtrl.remove);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications',           authenticate, notifCtrl.getNotifications);
router.get('/notifications/unread-count', authenticate, notifCtrl.getUnreadCount);
router.put('/notifications/:id/read',  authenticate, notifCtrl.markRead);
router.put('/notifications/read-all',  authenticate, notifCtrl.markAllRead);

// ── Promotions / Lì xì ───────────────────────────────────────────────────────
router.get('/promotions',              promoCtrl.list);
router.get('/promotions/my',           authenticate, promoCtrl.my);
router.get('/promotions/:id',          promoCtrl.get);
router.post('/promotions/:id/claim',   authenticate, promoCtrl.claim);

// ── Search ────────────────────────────────────────────────────────────────────
router.get('/search',               searchCtrl.search);

// ── Ads ───────────────────────────────────────────────────────────────────────
router.get('/ads',                  adCtrl.getByPosition);

// ── Events (matches with open bet markets) ────────────────────────────────────
router.get('/events',               eventCtrl.getEvents);
router.get('/events/live',          eventCtrl.getLiveEvents);
router.get('/events/:id',           eventCtrl.getEventById);
router.get('/events/market/:id',    eventCtrl.getMarket);

// ── Sports Provider (aggregator) ──────────────────────────────────────────────
router.get('/provider/launch',      authenticate, providerCtrl.launch);
router.post('/provider/transfer-in', authenticate, providerCtrl.transferIn);
router.post('/provider/transfer-out', authenticate, providerCtrl.transferOut);
router.post('/provider/sync-odds',  authenticate, adminOnly, providerCtrl.syncOdds);

// ── Aggregator Callbacks (no auth — signed by provider) ───────────────────────
router.post('/callbacks/gsc',                   cbCtrl.gsc);
router.post('/callbacks/goldgate/balance',       cbCtrl.goldgateBalance);
router.post('/callbacks/goldgate/transaction',   cbCtrl.goldgateTransaction);
router.post('/callbacks/tc-gaming/seamless',     cbCtrl.tcGamingSeamless);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/leagues',        authenticate, adminOnly, adminCtrl.listLeagues);
router.post('/admin/leagues',       authenticate, adminOnly, adminCtrl.createLeague);
router.put('/admin/leagues/:id',    authenticate, adminOnly, adminCtrl.updateLeague);
router.delete('/admin/leagues/:id', authenticate, adminOnly, adminCtrl.deleteLeague);

router.get('/admin/teams',          authenticate, adminOnly, adminCtrl.listTeams);
router.post('/admin/teams',         authenticate, adminOnly, adminCtrl.createTeam);
router.put('/admin/teams/:id',      authenticate, adminOnly, adminCtrl.updateTeam);
router.delete('/admin/teams/:id',   authenticate, adminOnly, adminCtrl.deleteTeam);

router.get('/admin/matches',        authenticate, adminOnly, adminCtrl.listMatches);
router.post('/admin/matches',       authenticate, adminOnly, adminCtrl.createMatch);
router.put('/admin/matches/:id',    authenticate, adminOnly, adminCtrl.updateMatch);

router.get('/admin/articles',       authenticate, adminOnly, adminCtrl.listArticles);
router.post('/admin/articles',      authenticate, adminOnly, adminCtrl.createArticle);
router.put('/admin/articles/:id',   authenticate, adminOnly, adminCtrl.updateArticle);
router.delete('/admin/articles/:id', authenticate, adminOnly, adminCtrl.deleteArticle);

router.get('/admin/bets',           authenticate, adminOnly, adminCtrl.listBets);
router.put('/admin/bets/:id',       authenticate, adminOnly, adminCtrl.updateBet);

router.get('/admin/users',          authenticate, adminOnly, userCtrl.list);
router.put('/admin/users/:id',      authenticate, adminOnly, userCtrl.update);

// ── Support chat (SupportRoom / SupportMessage / SupportTicket models) ────────
router.post('/support/start', authenticate, async (req, res) => {
  try {
    let room = await req.prisma.supportRoom.findFirst({
      where: { type: 'private', participants: { some: { userId: req.user.id, isAgent: false } } },
    });
    if (!room) {
      room = await req.prisma.supportRoom.create({
        data: { type: 'private', participants: { create: [{ userId: req.user.id, isAgent: false }] } },
      });
    }
    res.json({ success: true, data: { roomId: room.id } });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

router.get('/support/tickets',     authenticate, async (req, res) => {
  try {
    const tickets = await req.prisma.supportTicket.findMany({
      where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20,
    });
    res.json({ success: true, data: tickets });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

router.post('/support/tickets',    authenticate, async (req, res) => {
  try {
    const { subject, description, category = 'general' } = req.body;
    if (!subject) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'subject là bắt buộc' } });
    const ticket = await req.prisma.supportTicket.create({
      data: { userId: req.user.id, subject, description, category },
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

router.get('/support/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const messages = await req.prisma.supportMessage.findMany({
      where: { roomId: req.params.roomId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ success: true, data: messages });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

router.post('/support/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'content là bắt buộc' } });
    const message = await req.prisma.supportMessage.create({
      data: { roomId: req.params.roomId, senderId: req.user.id, content, type: 'text' },
    });
    res.status(201).json({ success: true, data: message });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ── Knowledge base ────────────────────────────────────────────────────────────
router.get('/knowledge', async (req, res) => {
  try {
    const where = { status: 'published' };
    if (req.query.category) where.category = req.query.category;
    const articles = await req.prisma.knowledgeArticle.findMany({
      where, orderBy: { createdAt: 'desc' }, take: Number(req.query.limit) || 20,
      select: { id: true, slug: true, title: true, summary: true, category: true, views: true, publishedAt: true },
    });
    res.json({ success: true, data: articles });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

router.get('/knowledge/:slug', async (req, res) => {
  try {
    const article = await req.prisma.knowledgeArticle.findUnique({ where: { slug: req.params.slug } });
    if (!article) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    await req.prisma.knowledgeArticle.update({ where: { id: article.id }, data: { views: { increment: 1 } } });
    res.json({ success: true, data: article });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/', (_req, res) => res.json({ success: true, module: 'sports', version: '2.1' }));

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

module.exports = router;
