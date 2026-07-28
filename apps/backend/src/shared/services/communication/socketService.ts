/**
 * socketService.js — shared Socket.IO singleton.
 *
 * Usage:
 *   // server.js — initialise once after HTTP server is created
 *   const { initSocket } = require('./shared/services/socketService');
 *   initSocket(httpServer);
 *
 *   // anywhere in the app
 *   const { getSocket } = require('./shared/services/socketService');
 *   getSocket()?.to(`user_${userId}`).emit('balance:update', payload);
 */
'use strict';
const { Server } = require('socket.io');
const logger     = require('../logger');

let _io = null;

/**
 * Initialise the Socket.IO server.
 * Must be called exactly once from server.js after `http.createServer(app)`.
 *
 * @param {import('http').Server} httpServer
 * @param {object} [opts]  – extra Socket.IO options (merged with defaults)
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer, opts = {}) {
  if (_io) {
    logger.warn('[SocketService] initSocket called more than once — returning existing instance');
    return _io;
  }

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : true; // dev fallback

  _io = new Server(httpServer, {
    cors: {
      origin:      corsOrigins,
      credentials: true,
    },
    pingTimeout:  60_000,
    pingInterval: 25_000,
    ...opts,
  });

  logger.info('[SocketService] Socket.IO server initialised');
  return _io;
}

/**
 * Return the Socket.IO server instance (or null if not yet initialised).
 * @returns {import('socket.io').Server|null}
 */
function getSocket() {
  return _io;
}

/**
 * Emit an event to a specific user's personal room.
 * No-ops silently if io is not ready (e.g. during unit tests).
 *
 * @param {string|number} userId
 * @param {string}        event
 * @param {object}        payload
 */
function emitToUser(userId, event, payload) {
  if (!_io) return;
  try {
    _io.to(`user_${userId}`).emit(event, payload);
  } catch (err) {
    logger.error(`[SocketService] emitToUser error: ${err.message}`);
  }
}

/**
 * Emit an event to a named room.
 *
 * @param {string} room
 * @param {string} event
 * @param {object} payload
 */
function emitToRoom(room, event, payload) {
  if (!_io) return;
  try {
    _io.to(room).emit(event, payload);
  } catch (err) {
    logger.error(`[SocketService] emitToRoom error: ${err.message}`);
  }
}

/**
 * Broadcast to all connected clients.
 */
function broadcast(event, payload) {
  if (!_io) return;
  try {
    _io.emit(event, payload);
  } catch (err) {
    logger.error(`[SocketService] broadcast error: ${err.message}`);
  }
}

module.exports = { initSocket, getSocket, emitToUser, emitToRoom, broadcast };
