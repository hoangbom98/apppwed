const router = require('express').Router();
const auth = require('../../../shared/middlewares/auth/auth');
const auditLogger = require('../../../shared/middlewares/audit/auditLogger');
const chatCtrl = require('../controllers/chatController');

router.use(auth);

router.get('/rooms',                            chatCtrl.getRooms);
router.get('/rooms/:roomId/messages',           chatCtrl.getMessages);
router.post('/rooms/:roomId/messages', auditLogger, chatCtrl.sendMessage);
router.put('/rooms/:roomId/read',      auditLogger, chatCtrl.markSeen);
router.post('/rooms/private',          auditLogger, chatCtrl.createPrivateRoom);
router.post('/rooms/group',            auditLogger, chatCtrl.createGroupRoom);
router.delete('/messages/:messageId',  auditLogger, chatCtrl.recallMessage);

module.exports = router;
