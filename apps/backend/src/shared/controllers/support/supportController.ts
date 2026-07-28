/**
 * SupportController — REST handlers for support chat rooms and messages.
 *
 * Routes (mounted via support.routes.js):
 *   GET  /support/rooms              — list user's rooms
 *   GET  /support/rooms/:roomId      — room detail + last 20 messages
 *   POST /support/rooms/:roomId/messages — send a message
 *   GET  /support/rooms/:roomId/messages — paginated messages
 *   POST /support/rooms/:roomId/read — mark room as read
 *   GET  /support/unread-count       — total unread count
 *   POST /support/start              — get or create a support room
 */
const supportService = require('../services/supportService');
const { success, created, error, notFound, paginate } = require('../utils/response');

/**
 * GET /support/rooms
 * Return all rooms where the authenticated user is a participant.
 */
exports.getRooms = async (req, res) => {
  try {
    const rooms = await supportService.getRooms(req.prisma, req.user.id);
    return success(res, rooms);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /support/rooms/:roomId
 * Return room detail with the last 20 messages.
 */
exports.getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const [room, { messages }] = await Promise.all([
      supportService.getRoomById(req.prisma, roomId),
      supportService.getMessages(req.prisma, roomId, { page: 1, limit: 20 }),
    ]);
    return success(res, { ...room, messages });
  } catch (err) {
    if (err.message === 'Room not found') return notFound(res, err.message);
    return error(res, err.message);
  }
};

/**
 * POST /support/rooms/:roomId/messages
 * Send a message. Body: { content, type? }
 */
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, type = 'text' } = req.body;
    if (!content) return error(res, 'content is required', 422);

    const message = await supportService.sendMessage(req.prisma, roomId, req.user.id, {
      content,
      type,
    });
    return created(res, message, 'Message sent');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /support/rooms/:roomId/messages
 * Paginated message list. Query: { page, limit }
 */
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const result = await supportService.getMessages(req.prisma, roomId, {
      page: Number(page),
      limit: Number(limit),
    });
    return paginate(res, result.messages, {
      page: result.page,
      limit: Number(limit),
      total: result.total,
      pages: result.pages,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /support/rooms/:roomId/read
 * Mark all messages in the room as read for the current user.
 */
exports.markRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    await supportService.markRead(req.prisma, roomId, req.user.id);
    return success(res, null, 'Marked as read');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /support/unread-count
 * Return total unread message count across all rooms for the current user.
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await supportService.getUnreadCount(req.prisma, req.user.id);
    return success(res, { unreadCount: count });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /support/start
 * Get or create a support room. Body: { agentId? }
 */
exports.startChat = async (req, res) => {
  try {
    const { agentId } = req.body;
    const room = await supportService.getOrCreateRoom(req.prisma, req.user.id, agentId || null);
    return success(res, room);
  } catch (err) {
    return error(res, err.message);
  }
};
