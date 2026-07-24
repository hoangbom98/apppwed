'use strict';
/**
 * dating/sockets/chatSocket.js
 * Handles real-time dating chat events.
 * Wired into shared/socket/handlers.js via setupSocketHandlers().
 *
 * Events:
 *   client → server: chat:join, chat:send, chat:recall, chat:seen, chat:leave
 *   server → client: chat:receive, chat:recalled, chat:error
 */
const ChatService = require('../services/chatService');
const { getPrismaClient } = require('../../../shared/config/databases');

module.exports = function registerChatSocket(io, socket) {
  // Each socket gets its own service backed by the dating DB
  const prisma      = getPrismaClient('dating');
  const chatService = new ChatService(prisma);

  // ── Join room ────────────────────────────────────────────────────────
  socket.on('chat:join', (roomId) => {
    socket.join(`chat_${roomId}`);
  });

  // ── Send message ─────────────────────────────────────────────────────
  socket.on('chat:send', async ({ roomId, content, type = 'text', fileUrl = null }) => {
    try {
      if (!socket.user) return socket.emit('chat:error', { error: 'Chưa xác thực' });
      const message = await chatService.sendMessage(roomId, socket.user.id, content, type, fileUrl);
      // Broadcast to everyone in the room (including sender for consistency)
      io.to(`chat_${roomId}`).emit('chat:receive', message);
    } catch (err) {
      socket.emit('chat:error', { error: err.message });
    }
  });

  // ── Recall (soft-delete) message ─────────────────────────────────────
  socket.on('chat:recall', async ({ roomId, messageId }) => {
    try {
      if (!socket.user) return socket.emit('chat:error', { error: 'Chưa xác thực' });
      await chatService.recallMessage(messageId, socket.user.id);
      io.to(`chat_${roomId}`).emit('chat:recalled', { messageId });
    } catch (err) {
      socket.emit('chat:error', { error: err.message });
    }
  });

  // ── Mark seen ────────────────────────────────────────────────────────
  socket.on('chat:seen', async ({ roomId }) => {
    try {
      if (!socket.user) return;
      await chatService.markRead(roomId, socket.user.id);
    } catch { /* silent */ }
  });

  // ── Leave room ───────────────────────────────────────────────────────
  socket.on('chat:leave', (roomId) => {
    socket.leave(`chat_${roomId}`);
  });
};
