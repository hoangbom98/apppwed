const router      = require('express').Router();
const auth        = require('../../../shared/middlewares/auth');
const adminGuard  = require('../../../shared/middlewares/adminGuard');
const auditLogger = require('../../../shared/middlewares/auditLogger');
const { upload } = require('../../../shared/services/uploadService');
const autocompleteCtrl = require('../controllers/autocompleteController');

const authCtrl   = require('../controllers/authController');
const userCtrl   = require('../controllers/userController');
const matchCtrl  = require('../controllers/matchController');
const chatCtrl   = require('../controllers/chatController');
const liveCtrl   = require('../controllers/liveController');
const walletCtrl = require('../controllers/walletController');
const feedCtrl   = require('../controllers/feedController');
const _gamCtrl   = require('../controllers/gamificationController');
const notifCtrl  = require('../controllers/notificationController');
const miscCtrl   = require('../controllers/miscController');
const storyCtrl  = require('../controllers/storyController');
const giftCtrl   = require('../controllers/giftController');
const adminCtrl  = require('../controllers/adminController');

// ── Autocomplete (requires auth — prevents enumeration by anon) ───
router.get('/autocomplete', auth, autocompleteCtrl.autocomplete);

// ── Auth ──────────────────────────────────────────────────────────
router.post('/auth/send-otp',        authCtrl.sendOtp);
router.post('/auth/verify-otp',      authCtrl.verifyOtp);
router.post('/auth/register',        authCtrl.register);
router.post('/auth/login',           authCtrl.login);
router.post('/auth/refresh',         authCtrl.refresh);
router.post('/auth/logout',          auth, authCtrl.logout);
router.get('/auth/me',               auth, authCtrl.me);
router.put('/auth/profile',          auth, auditLogger, authCtrl.updateProfile);
router.post('/auth/onboarding',      auth, auditLogger, authCtrl.completeOnboarding);
router.post('/auth/avatar',          auth, upload.single('avatar'), auditLogger, authCtrl.uploadAvatar);

// ── Users ─────────────────────────────────────────────────────────
router.get('/users/home',            auth, userCtrl.getHomeData);
router.get('/users/discovery',       auth, userCtrl.getDiscovery);
router.get('/users/:id',             auth, userCtrl.getUserById);
router.post('/users/:id/report',     auth, auditLogger, userCtrl.reportUser);
router.post('/users/:id/block',      auth, auditLogger, userCtrl.blockUser);

// ── Profile ───────────────────────────────────────────────────────
router.put('/profile',               auth, auditLogger, authCtrl.updateProfile);
router.get('/profile/me/stats',      auth, miscCtrl.getProfileStats);
router.get('/profile/:userId/album', auth, miscCtrl.getAlbum);
router.post('/profile/album',        auth, upload.single('photo'), auditLogger, miscCtrl.uploadPhoto);
router.delete('/profile/album/:id',  auth, auditLogger, miscCtrl.deletePhoto);

// ── Match ─────────────────────────────────────────────────────────
router.get('/match/profiles',        auth, matchCtrl.getSwipeProfiles);
router.post('/match/like/:id',       auth, auditLogger, matchCtrl.likeUser);
router.post('/match/nope/:id',       auth, auditLogger, matchCtrl.nopeUser);
router.post('/match/superlike/:id',  auth, auditLogger, matchCtrl.superLike);
router.get('/match/list',            auth, matchCtrl.getMatches);
router.get('/match/liked-me',        auth, matchCtrl.getWhoLikedMe);
router.get('/match/favorites',       auth, matchCtrl.getFavorites);

// ── Chat ──────────────────────────────────────────────────────────
router.get('/chat/conversations',        auth, chatCtrl.getConversations);
router.get('/chat/:userId/messages',     auth, chatCtrl.getMessages);
router.post('/chat/send',                auth, auditLogger, chatCtrl.sendMessage);
router.put('/chat/:id/recall',           auth, auditLogger, chatCtrl.recallMessage);
router.delete('/chat/:id',               auth, auditLogger, chatCtrl.deleteMessage);
router.post('/chat/:userId/seen',        auth, auditLogger, chatCtrl.markSeen);

// ── Live ──────────────────────────────────────────────────────────
router.get('/live/streams',          auth, liveCtrl.getStreams);
router.get('/live/:id',              auth, liveCtrl.getStream);
router.post('/live/start',           auth, auditLogger, liveCtrl.startStream);
router.post('/live/:id/end',         auth, auditLogger, liveCtrl.endStream);
router.post('/live/:id/join',        auth, auditLogger, liveCtrl.joinStream);
router.post('/live/:id/leave',       auth, auditLogger, liveCtrl.leaveStream);
router.post('/live/gift',            auth, auditLogger, liveCtrl.sendGift);

// ── Feed ──────────────────────────────────────────────────────────
router.get('/feed',                  auth, feedCtrl.getFeed);
router.post('/feed/post',            auth, auditLogger, feedCtrl.createPost);
router.post('/feed/:id/like',        auth, auditLogger, feedCtrl.likePost);
router.delete('/feed/:id/like',      auth, auditLogger, feedCtrl.unlikePost);
router.get('/feed/:id/comments',     auth, feedCtrl.getComments);
router.post('/feed/:id/comments',    auth, auditLogger, feedCtrl.addComment);

// ── Stories ───────────────────────────────────────────────────────
router.get('/stories',               auth, feedCtrl.getStories);
router.post('/stories/create',       auth, auditLogger, feedCtrl.createStory);
router.post('/stories/:id/view',     auth, auditLogger, storyCtrl.viewStory);

// ── Wallet ────────────────────────────────────────────────────────
router.get('/wallet/balance',        auth, walletCtrl.getBalance);
router.get('/wallet/history',        auth, walletCtrl.getHistory);
router.post('/wallet/deposit',       auth, auditLogger, walletCtrl.deposit);
router.post('/wallet/withdraw',      auth, auditLogger, walletCtrl.withdraw);

// ── VIP ───────────────────────────────────────────────────────────
router.get('/vip/plans',             miscCtrl.getVipPlans);
router.post('/vip/subscribe',        auth, auditLogger, walletCtrl.subscribeVip);

// ── Gifts ─────────────────────────────────────────────────────────
router.get('/gifts',                 auth, giftCtrl.getGifts);
router.post('/gifts/send',           auth, auditLogger, giftCtrl.sendGift);

// ── Gamification ──────────────────────────────────────────────────
router.get('/gamification/daily',    auth, _gamCtrl.getDailyStatus);
router.post('/gamification/checkin', auth, auditLogger, _gamCtrl.checkin);
router.get('/gamification/missions', auth, _gamCtrl.getMissions);
router.post('/gamification/spin',    auth, auditLogger, _gamCtrl.spin);
router.get('/gamification/level',    auth, _gamCtrl.getLevel);
router.get('/gamification/achievements', auth, _gamCtrl.getAchievements);

// ── Misc: search, events, community, party, referral ─────────────
router.get('/search',                auth, miscCtrl.search);
router.get('/events',                auth, miscCtrl.getEvents);
router.get('/community/posts',       auth, miscCtrl.getCommunityPosts);
router.get('/party-rooms',           auth, miscCtrl.getPartyRooms);
router.get('/referral',              auth, miscCtrl.getReferral);
router.get('/referral/history',      auth, miscCtrl.getReferralHistory);
router.get('/shop',                  auth, miscCtrl.getShopItems);
router.post('/shop/buy',             auth, auditLogger, miscCtrl.buyItem);

// ── Notifications ─────────────────────────────────────────────────
router.get('/notifications',              auth, notifCtrl.getNotifications);
router.get('/notifications/unread-count', auth, notifCtrl.getUnreadCount);
router.put('/notifications/:id/read',     auth, auditLogger, notifCtrl.markRead);
router.put('/notifications/read-all',     auth, auditLogger, notifCtrl.markAllRead);

// ── Shared: Push Notifications ────────────────────────────────────
router.use('/', require('../../../shared/routes/push.routes'));

// ── Admin: Profiles ───────────────────────────────────────────────
router.get('/admin/profiles',         auth, adminGuard, adminCtrl.listProfiles);
router.get('/admin/profiles/:id',     auth, adminGuard, adminCtrl.getProfile);
router.patch('/admin/profiles/:id',   auth, adminGuard, auditLogger, adminCtrl.updateProfile);
router.delete('/admin/profiles/:id',  auth, adminGuard, auditLogger, adminCtrl.deleteProfile);

// ── Admin: Matches ────────────────────────────────────────────────
router.get('/admin/matches',          auth, adminGuard, adminCtrl.listMatches);
router.get('/admin/matches/:id',      auth, adminGuard, adminCtrl.getMatch);
router.delete('/admin/matches/:id',   auth, adminGuard, auditLogger, adminCtrl.deleteMatch);

// ── Admin: Gifts ──────────────────────────────────────────────────
router.get('/admin/gifts',            auth, adminGuard, adminCtrl.listGifts);
router.get('/admin/gifts/:id',        auth, adminGuard, adminCtrl.getGift);
router.post('/admin/gifts',           auth, adminGuard, auditLogger, adminCtrl.createGift);
router.put('/admin/gifts/:id',        auth, adminGuard, auditLogger, adminCtrl.updateGift);
router.delete('/admin/gifts/:id',     auth, adminGuard, auditLogger, adminCtrl.deleteGift);

// ── Admin: Moments (feed posts) ───────────────────────────────────
router.get('/admin/moments',          auth, adminGuard, adminCtrl.listMoments);
router.get('/admin/moments/:id',      auth, adminGuard, adminCtrl.getMoment);
router.patch('/admin/moments/:id',    auth, adminGuard, auditLogger, adminCtrl.updateMoment);
router.delete('/admin/moments/:id',   auth, adminGuard, auditLogger, adminCtrl.deleteMoment);

// ── Admin: Reports / Violations ───────────────────────────────────
router.get('/admin/reports',          auth, adminGuard, adminCtrl.listReports);
router.get('/admin/reports/:id',      auth, adminGuard, adminCtrl.getReport);
router.patch('/admin/reports/:id',    auth, adminGuard, auditLogger, adminCtrl.updateReport);

// ── Admin: Live Sessions ──────────────────────────────────────────
router.get('/admin/live',             auth, adminGuard, adminCtrl.listLive);
router.delete('/admin/live/:id',      auth, adminGuard, auditLogger, adminCtrl.deleteLive);

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

module.exports = router;
