'use strict';
/**
 * Socket.IO accessor — singleton store for the io instance.
 *
 * ROOM NAMING CONVENTION (project isolation):
 * ─────────────────────────────────────────────
 *   user_{userId}           — one room per authenticated user  (presence + direct push)
 *   project:{project}       — all admins managing that project  (default ns + /admin ns)
 *   admin:all               — super_admin receives every cross-project event
 *   project_user:{project}  — all logged-in users of a project (for broadcasts)
 *   match_{matchId}         — sports live match subscribers
 *   live_{streamId}         — dating live stream viewers
 *   game_room_{roomId}      — game chat room
 *   support_{roomId}        — support chat room
 *
 * NAMESPACES:
 *   /        — default (all user-facing SPAs + legacy admin-dashboard)
 *   /admin   — admin-dashboard dedicated channel (auth-gated in handlers.ts)
 *
 * EMITTER USAGE (from any controller or service):
 * ─────────────────────────────────────────────────
 *   const { emitToProject, emitToUser, emitToAdminAll, emitAdminNsp } = require('../config/socket');
 *
 *   // Notify admins of project:game that a new deposit arrived:
 *   emitToProject('game', 'admin:finance_event', { type: 'deposit_request', ... });
 *
 *   // Also fan-out to super_admin dashboard (preferred over emitToProject+emitToAdminAll):
 *   emitAdminEvent('game', 'admin:finance_event', payload);
 *
 *   // Push to /admin namespace room (new admin-dashboard clients using /admin ns):
 *   emitAdminNsp('game', 'admin:finance_event', payload);
 *
 *   // Notify a specific user (e.g. deposit approved):
 *   emitToUser(userId, 'user:deposit_approved', { amount, newBalance });
 */

let _io = null;

/** @param {import('socket.io').Server} io */
function setIo(io) { _io = io; }

/** @returns {import('socket.io').Server|null} */
function getIo() { return _io; }

/**
 * Emit to a specific user's presence room.
 * @param {number|string} userId
 * @param {string}        event
 * @param {*}             data
 */
function emitToUser(userId, event, data) {
  if (_io) _io.to(`user_${userId}`).emit(event, data);
}

/**
 * Emit to all admin sockets joined to a specific project room.
 * Room name: `project:{project}` — e.g. `project:game`
 * Admin sockets join this room when they call `join:project` on connect.
 *
 * @param {string} project  – 'game' | 'hub' | 'trade' | 'dating' | 'sports'
 * @param {string} event
 * @param {*}      data
 */
function emitToProject(project, event, data) {
  if (_io) _io.to(`project:${project}`).emit(event, data);
}

/**
 * Emit to the `admin:all` room — received by super_admin sockets only.
 * Always includes the `project` field in the payload for cross-project
 * dashboards to discriminate events.
 *
 * @param {string} event
 * @param {*}      data   – should always include a `project` key
 */
function emitToAdminAll(event, data) {
  if (_io) _io.to('admin:all').emit(event, data);
}

/**
 * Convenience: emit to both `project:{project}` AND `admin:all` in one call.
 * Use this from controllers after any user action that admins must see.
 *
 * @param {string} project
 * @param {string} event
 * @param {*}      data
 */
function emitAdminEvent(project, event, data) {
  const payload = { ...data, project };
  emitToProject(project, event, payload);
  emitToAdminAll(event, payload);
}

/**
 * Emit to a named room (generic helper for game/sports/support rooms).
 * @param {string} room
 * @param {string} event
 * @param {*}      data
 */
function emitToRoom(room, event, data) {
  if (_io) _io.to(room).emit(event, data);
}

/** Broadcast to all connected clients. */
function broadcast(event, data) {
  if (_io) _io.emit(event, data);
}

/**
 * Emit to the dedicated /admin namespace.
 * Use this for admin-dashboard clients that connect to the /admin namespace
 * (preferred for new builds — more isolated than the default namespace).
 *
 * Falls back to emitAdminEvent() when /admin namespace is unavailable.
 *
 * @param {string} project  – 'game' | 'hub' | 'trade' | 'dating' | 'sports'
 * @param {string} event
 * @param {*}      data   – should always include a `project` key
 */
function emitAdminNsp(project, event, data) {
  if (!_io) return;
  const payload = { ...data, project };
  const nsp = _io.of('/admin');
  if (nsp) {
    nsp.to(`project:${project}`).emit(event, payload);
    nsp.to('admin:all').emit(event, payload);
  } else {
    // Fallback: use default namespace (backwards compat)
    emitAdminEvent(project, event, data);
  }
}

module.exports = {
  setIo, getIo,
  emitToUser,
  emitToProject,
  emitToAdminAll,
  emitAdminEvent,
  emitAdminNsp,
  emitToRoom,
  broadcast,
};
