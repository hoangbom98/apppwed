/**
 * support.routes.js — Express router mounting all support, ticket and knowledge routes.
 *
 * Mount in app.js / module router:
 *   app.use('/api', require('./shared/routes/support.routes'));
 *
 * Resulting endpoints:
 *
 *  Support chat:
 *   POST /support/start
 *   GET  /support/rooms
 *   GET  /support/rooms/:roomId
 *   POST /support/rooms/:roomId/messages
 *   GET  /support/rooms/:roomId/messages
 *   POST /support/rooms/:roomId/read
 *   GET  /support/unread-count
 *
 *  Tickets:
 *   POST /support/tickets
 *   GET  /support/tickets
 *   GET  /support/tickets/:id
 *   POST /support/tickets/:id/reply
 *   PUT  /support/tickets/:id/status
 *   GET  /support/admin/tickets
 *
 *  Knowledge base:
 *   GET  /knowledge
 *   GET  /knowledge/:slug
 *   POST /knowledge/:slug/like
 *   POST /knowledge
 *   PUT  /knowledge/:id
 *   POST /knowledge/:id/translate
 */
const router = require('express').Router();

const auth = require('../middlewares/auth');
const adminGuard = require('../middlewares/adminGuard');

const supportCtrl = require('../controllers/supportController');
const ticketCtrl = require('../controllers/ticketController');
const knowledgeCtrl = require('../controllers/knowledgeController');

// ─── Support Chat ─────────────────────────────────────────────────────────────

router.post('/support/start', auth, supportCtrl.startChat);
router.get('/support/rooms', auth, supportCtrl.getRooms);
router.get('/support/rooms/:roomId', auth, supportCtrl.getRoom);
router.post('/support/rooms/:roomId/messages', auth, supportCtrl.sendMessage);
router.get('/support/rooms/:roomId/messages', auth, supportCtrl.getMessages);
router.post('/support/rooms/:roomId/read', auth, supportCtrl.markRead);
router.get('/support/unread-count', auth, supportCtrl.getUnreadCount);

// ─── Tickets ──────────────────────────────────────────────────────────────────

router.post('/support/tickets', auth, ticketCtrl.createTicket);
router.get('/support/tickets', auth, ticketCtrl.getTickets);
router.get('/support/tickets/:id', auth, ticketCtrl.getTicket);
router.post('/support/tickets/:id/reply', auth, ticketCtrl.addReply);
router.put('/support/tickets/:id/status', auth, adminGuard, ticketCtrl.updateStatus);
router.get('/support/admin/tickets', auth, adminGuard, ticketCtrl.getAllTickets);

// ─── Knowledge Base ───────────────────────────────────────────────────────────

router.get('/knowledge', knowledgeCtrl.listArticles);
router.get('/knowledge/:slug', knowledgeCtrl.getArticle);
router.post('/knowledge/:slug/like', auth, knowledgeCtrl.likeArticle);
router.post('/knowledge', auth, adminGuard, knowledgeCtrl.createArticle);
router.put('/knowledge/:id', auth, adminGuard, knowledgeCtrl.updateArticle);
router.post('/knowledge/:id/translate', auth, adminGuard, knowledgeCtrl.addTranslation);

module.exports = router;
