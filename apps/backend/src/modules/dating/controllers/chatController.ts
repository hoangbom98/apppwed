'use strict';
/**
 * dating/controllers/chatController.js
 *
 * REST interface for chat — all real-time events go through chatSocket.js.
 * DB models: ChatRoom (chat_rooms), ChatRoomMember (chat_room_members), Message (messages)
 */
const { ok, created, error, notFound, forbidden } = require('../../../shared/utils/response');
const ChatService = require('../services/chatService');
const { paginate } = require('../../../shared/utils/helpers');

function svc(req) { return new ChatService(req.prisma); }

// ── GET /dating/chat/conversations ──────────────────────────────────────────
exports.getConversations = async (req, res) => {
  try {
    const rooms = await svc(req).getUserRooms(req.user.id);
    return ok(res, rooms);
  } catch (e) { return error(res, e.message, 500); }
};

// GET /dating/chat/:userId/messages  (existing route alias)
// GET /dating/chat/rooms/:roomId/messages
exports.getMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId || req.params.userId;
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const messages = await svc(req).getRoomMessages(roomId, req.user.id, page, limit);
    return ok(res, messages);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/chat/send ───────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, content, type = 'text', fileUrl = null } = req.body;
    if (!roomId || !content) return error(res, 'roomId and content are required', 400);
    const message = await svc(req).sendMessage(roomId, req.user.id, content, type, fileUrl);
    return created(res, message, 'Message sent');
  } catch (e) { return error(res, e.message, 500); }
};

// ── PUT /dating/chat/:id/recall ──────────────────────────────────────────────
exports.recallMessage = async (req, res) => {
  try {
    const msg = await svc(req).recallMessage(req.params.id, req.user.id);
    return ok(res, msg, 'Message recalled');
  } catch (e) { return error(res, e.message, 500); }
};

// ── DELETE /dating/chat/:id ──────────────────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await req.prisma.message.findUnique({ where: { id: req.params.id } });
    if (!msg) return notFound(res, 'Message not found');
    if (msg.senderId !== req.user.id) return forbidden(res);
    await req.prisma.message.update({ where: { id: req.params.id }, data: { isDeleted: true } });
    return ok(res, null, 'Message deleted');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/chat/:userId/seen ──────────────────────────────────────────
exports.markSeen = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return error(res, 'roomId is required', 400);
    await svc(req).markRead(roomId, req.user.id);
    return ok(res, null, 'Marked as read');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/chat/rooms/private  (used by chat.routes.js) ───────────────
exports.createPrivateRoom = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return error(res, 'targetUserId is required', 400);

    // Check if a private room already exists between the two users
    const existing = await req.prisma.chatRoom.findFirst({
      where: {
        type: 'private',
        members: { every: { userId: { in: [req.user.id, targetUserId] } } },
      },
      include: { members: true },
    });
    if (existing && existing.members.length === 2) return ok(res, existing);

    const room = await req.prisma.chatRoom.create({
      data: {
        type:    'private',
        members: { create: [{ userId: req.user.id }, { userId: targetUserId }] },
      },
      include: { members: true },
    });
    return created(res, room, 'Room created');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/chat/rooms/group ────────────────────────────────────────────
exports.createGroupRoom = async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;
    if (!name) return error(res, 'name is required', 400);

    const allMembers = [...new Set([req.user.id, ...memberIds])];
    const room = await req.prisma.chatRoom.create({
      data: {
        type:    'group',
        name,
        members: { create: allMembers.map(uid => ({ userId: uid })) },
      },
      include: { members: true },
    });
    return created(res, room, 'Group room created');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/chat/rooms  (alias for chat.routes.js) ──────────────────────
exports.getRooms = exports.getConversations;
