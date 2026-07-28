// @ts-nocheck
'use strict';
/**
 * apps/backend/src/grpc/handlers/datingHandler.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * gRPC service implementation for DatingService (proto/dating.proto).
 *
 * Chat           — Bidirectional Streaming. Replaces chatSocket.ts Socket.IO
 *                  events for native mobile / gRPC clients. Browser clients
 *                  continue to use Socket.IO unchanged.
 *
 * JoinRoom       — Unary.
 * GetRooms       — Unary. Returns user's chat rooms.
 * GetMessages    — Unary. Returns paginated messages for a room.
 * RecallMessage  — Unary. Soft-delete (recall) a message.
 */
const grpc = require('@grpc/grpc-js');
const { getUserFromCall } = require('../interceptors/authInterceptor');
const { getPrismaClient } = require('../../config/databases');
const logger = require('../../shared/services/core/logger');

/** In-memory map: roomId → Set<ServerDuplexStream> — for fan-out delivery */
const roomStreams = new Map();

function addRoomStream(roomId, call) {
  if (!roomStreams.has(roomId)) roomStreams.set(roomId, new Set());
  roomStreams.get(roomId).add(call);
}

function removeRoomStream(roomId, call) {
  roomStreams.get(roomId)?.delete(call);
}

function broadcastToRoom(roomId, message) {
  const streams = roomStreams.get(roomId);
  if (!streams) return;
  for (const stream of streams) {
    try { stream.write(message); } catch { /* stale stream */ }
  }
}

// ── Chat — Bidirectional Streaming ────────────────────────────────────────────

function chat(call) {
  const user = getUserFromCall(call);
  if (!user) {
    call.emit('error', { code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });
    call.end();
    return;
  }

  const prisma = getPrismaClient('dating');
  const joinedRooms = new Set();

  // Handle incoming messages from client
  call.on('data', async (/** @type {import('../../../types').ChatMessageProto} */ msg) => {
    const { room_id, content, type = 'text', file_url } = msg;

    // Recall (soft-delete) message
    if (type === 'recall') {
      try {
        const message = await prisma.message.findFirst({
          where: { id: msg.id, senderId: user.id },
        });
        if (message) {
          await prisma.message.update({ where: { id: message.id }, data: { isDeleted: true } });
          broadcastToRoom(room_id, { id: message.id, room_id, user_id: user.id, type: 'recall', is_deleted: true, created_at: Date.now() });
        }
      } catch (err) { logger.warn('[gRPC Dating] recall error:', err.message); }
      return;
    }

    // Join room on first message
    if (!joinedRooms.has(room_id)) {
      // Verify membership
      const member = await prisma.chatRoomMember.findUnique({
        where: { roomId_userId: { roomId: room_id, userId: user.id } },
      }).catch(() => null);
      if (!member) {
        try {
          call.write({ room_id, type: 'error', content: 'Not a member of this room', created_at: Date.now() });
        } catch { /* stream already closed — ignore */ }
        return;
      }
      joinedRooms.add(room_id);
      addRoomStream(room_id, call);
    }

    if (!content && !file_url) return;

    try {
      // Persist message
      const message = await prisma.message.create({
        data:    { roomId: room_id, senderId: user.id, content: content || '', type, fileUrl: file_url || null },
        include: { sender: { select: { id: true, username: true, avatar: true } } },
      });

      // Update room last activity
      await prisma.chatRoom.update({ where: { id: room_id }, data: { updatedAt: new Date() } }).catch(() => { /* ignore */ });

      // Fan-out to all room's gRPC streams
      broadcastToRoom(room_id, {
        id:         message.id,
        room_id,
        user_id:    user.id,
        content:    message.content,
        type:       message.type,
        file_url:   message.fileUrl || '',
        is_deleted: false,
        created_at: message.createdAt?.getTime() || Date.now(),
        sender: {
          id:       String(message.sender.id),
          username: message.sender.username || '',
          avatar:   message.sender.avatar   || '',
        },
      });
    } catch (err) {
      logger.error('[gRPC Dating] chat send error:', err.message);
    }
  });

  // Cleanup on disconnect
  function cleanup() {
    for (const roomId of joinedRooms) {
      removeRoomStream(roomId, call);
    }
    joinedRooms.clear();
  }

  call.on('end',       cleanup);
  call.on('cancelled', cleanup);
  call.on('error',     cleanup);
}

// ── JoinRoom — Unary ─────────────────────────────────────────────────────────

async function joinRoom(call, callback) {
  const user = getUserFromCall(call);
  if (!user) return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });

  const { room_id } = call.request;
  try {
    const prisma = getPrismaClient('dating');
    const member = await prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: room_id, userId: user.id } },
    });
    if (!member) return callback({ code: grpc.status.PERMISSION_DENIED, message: 'Not a member' });
    callback(null, { success: true, room_id });
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ── GetRooms — Unary ─────────────────────────────────────────────────────────

async function getRooms(call, callback) {
  const user = getUserFromCall(call);
  if (!user) return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });

  try {
    const prisma = getPrismaClient('dating');
    const rooms = await prisma.chatRoom.findMany({
      where:   { members: { some: { userId: user.id } } },
      include: {
        members:  { include: { user: { select: { id: true, username: true, avatar: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    callback(null, {
      rooms: rooms.map((r) => ({
        room_id:      r.id,
        last_message: r.messages[0]?.content || '',
        updated_at:   r.updatedAt?.getTime() || 0,
        members:      r.members.map((m) => ({
          id:       String(m.user.id),
          username: m.user.username || '',
          avatar:   m.user.avatar   || '',
        })),
      })),
    });
  } catch (err) {
    logger.error('[gRPC Dating] getRooms error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ── GetMessages — Unary ───────────────────────────────────────────────────────

async function getMessages(call, callback) {
  const user = getUserFromCall(call);
  if (!user) return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });

  const { room_id, page = 1, limit = 50 } = call.request;
  try {
    const prisma = getPrismaClient('dating');
    const member = await prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: room_id, userId: user.id } },
    });
    if (!member) return callback({ code: grpc.status.PERMISSION_DENIED, message: 'Not a member' });

    const messages = await prisma.message.findMany({
      where:   { roomId: room_id, isDeleted: false },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, username: true, avatar: true } } },
    });

    callback(null, {
      messages: messages.reverse().map((m) => ({
        id:         m.id,
        room_id:    m.roomId,
        user_id:    String(m.senderId),
        content:    m.content || '',
        type:       m.type    || 'text',
        file_url:   m.fileUrl || '',
        is_deleted: m.isDeleted || false,
        created_at: m.createdAt?.getTime() || 0,
        sender: {
          id:       String(m.sender.id),
          username: m.sender.username || '',
          avatar:   m.sender.avatar   || '',
        },
      })),
      total: messages.length,
    });
  } catch (err) {
    logger.error('[gRPC Dating] getMessages error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ── RecallMessage — Unary ─────────────────────────────────────────────────────

async function recallMessage(call, callback) {
  const user = getUserFromCall(call);
  if (!user) return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Auth required' });

  const { room_id, message_id } = call.request;
  try {
    const prisma = getPrismaClient('dating');
    const message = await prisma.message.findFirst({
      where: { id: message_id, senderId: user.id, roomId: room_id },
    });
    if (!message) return callback({ code: grpc.status.NOT_FOUND, message: 'Message not found' });

    await prisma.message.update({ where: { id: message.id }, data: { isDeleted: true } });

    // Fan-out recall to gRPC room streams
    broadcastToRoom(room_id, {
      id: message.id, room_id, user_id: user.id, type: 'recall', is_deleted: true, created_at: Date.now(),
    });

    callback(null, { success: true, message_id: message.id });
  } catch (err) {
    logger.error('[gRPC Dating] recallMessage error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

module.exports = { chat, joinRoom, getRooms, getMessages, recallMessage };
