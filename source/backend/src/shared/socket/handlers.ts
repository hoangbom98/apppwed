/**
 * Socket.IO event handlers — central hub for all modules.
 * Called once from server.ts with the `io` instance.
 *
 * PROJECT ROOM ISOLATION
 * ──────────────────────
 * Every socket is assigned to rooms based on its role:
 *
 *   Authenticated user    → user_{userId}
 *   Admin of project X    → project:X        (receives admin:* events for X)
 *   Super admin           → admin:all + every project room
 *   User of project X     → project_user:X   (receives user:* broadcasts for X)
 *
 * NAMESPACES (Socket.IO v4)
 * ─────────────────────────
 *   /          — default namespace (all clients, all modules)
 *   /admin     — admin-dashboard clients only
 *
 * Clients join their rooms by emitting:
 *   admin:join_project  { project }  — called by admin-dashboard on connect
 *   user:join           { project }  — called by sub-project frontend on connect
 *
 * Emitting from controllers:
 *   const { emitAdminEvent, emitToUser } = require('../../config/socket');
 *   emitAdminEvent('game', 'admin:finance_event', payload);   // → project:game + admin:all
 *   emitToUser(userId, 'user:deposit_approved', payload);     // → user_{userId}
 *
 * Online-count integration:
 *   Uses sessionService to track presence. Session is touched on every
 *   'heartbeat' event so the online-user sorted set stays fresh.
 */
const { verifyToken: verifyAccessToken } = require('../services/authService');
const notifSvc      = require('../services/notificationService');
const sessionSvc    = require('../services/sessionService');
const registerChatSocket = require('../../modules/dating/sockets/chatSocket');
const logger        = require('../services/logger');

const VALID_PROJECTS = new Set(['hub', 'game', 'trade', 'dating', 'sports']);

// ── JWT middleware factory (shared between / and /admin namespaces) ───────────
function makeAuthMiddleware() {
  return (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) socket.user = verifyAccessToken(token);
    } catch { /* unauthenticated socket — public rooms only */ }
    next();
  };
}

function setupSocketHandlers(io) {
  notifSvc.setIo(io);

  // ── Auth middleware — default namespace ──────────────────────────────────────
  // Unauthenticated connections are still allowed (public rooms / guest chat).
  io.use(makeAuthMiddleware());

  // ── /admin namespace — admin-dashboard exclusive ─────────────────────────────
  const adminNsp = io.of('/admin');
  adminNsp.use(makeAuthMiddleware());
  adminNsp.use((socket, next) => {
    // Only allow admin / super_admin to connect to /admin namespace
    const role = socket.user?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return next(new Error('Forbidden: admin namespace requires admin role'));
    }
    next();
  });
  adminNsp.on('connection', (socket) => {
    const userId = socket.user?.id;
    const role   = socket.user?.role;
    logger.info(`[Socket:/admin] connected: ${socket.id} user=${userId} role=${role}`);

    // Auto-join based on role
    if (role === 'super_admin') {
      for (const p of VALID_PROJECTS) socket.join(`project:${p}`);
      socket.join('admin:all');
    }

    // Allow explicit project join / switch
    socket.on('admin:join_project', (payload: { project?: string } = {}) => {
      const project = payload?.project;
      for (const p of VALID_PROJECTS) socket.leave(`project:${p}`);
      socket.leave('admin:all');
      if (project === 'admin' || role === 'super_admin') {
        for (const p of VALID_PROJECTS) socket.join(`project:${p}`);
        socket.join('admin:all');
      } else if (project && VALID_PROJECTS.has(project)) {
        socket.join(`project:${project}`);
      }
      socket.emit('admin:joined', { project: project || 'all', role });
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket:/admin] disconnected: ${socket.id} user=${userId}`);
    });
  });

  io.on('connection', (socket) => {
    const uid = socket.user?.id || 'guest';
    logger.info(`[Socket] connected: ${socket.id} user=${uid} role=${socket.user?.role || 'none'}`);

    // ── Presence room ──────────────────────────────────────────────────────────
    // Every authenticated socket joins its personal room immediately.
    if (socket.user) {
      socket.join(`user_${socket.user.id}`);
    }

    // ── Heartbeat — touch session to maintain online presence ─────────────────
    // Frontend should emit 'heartbeat' every 60–120s with { project }.
    // This refreshes the Redis session TTL and updates the online sorted set.
    socket.on('heartbeat', (payload: { project?: string } = {}) => {
      const project = payload?.project;
      if (socket.user?.id && project && VALID_PROJECTS.has(project)) {
        sessionSvc.touch(project, socket.user.id).catch(() => {});
      }
    });

    // ── Admin: join project room ───────────────────────────────────────────────
    // Emitted by admin-dashboard on connect (or when switching project context).
    // Payload: { project: 'game' | 'hub' | 'trade' | 'dating' | 'sports' | 'admin' }
    //
    // super_admin also joins `admin:all` to receive cross-project fan-out.
    // NOTE: Prefer using the /admin namespace — this handler is kept for
    // backwards compatibility with existing admin-dashboard builds.
    socket.on('admin:join_project', (payload: { project?: string } = {}) => {
      if (!socket.user) return;
      const role    = socket.user.role;
      const project = payload?.project;
      if (role !== 'admin' && role !== 'super_admin') return;

      // Leave all project rooms first to prevent stale subscriptions
      for (const p of VALID_PROJECTS) socket.leave(`project:${p}`);
      socket.leave('admin:all');

      if (project === 'admin' || role === 'super_admin') {
        // Super admin or explicit admin project → join ALL project rooms + admin:all
        for (const p of VALID_PROJECTS) socket.join(`project:${p}`);
        socket.join('admin:all');
        logger.info(`[Socket] ${socket.id} super_admin joined all project rooms`);
      } else if (project && VALID_PROJECTS.has(project)) {
        socket.join(`project:${project}`);
        logger.info(`[Socket] ${socket.id} admin joined project:${project}`);
      }
    });

    // ── User: join project room ────────────────────────────────────────────────
    // Emitted by sub-project frontends (game, dating, etc.) on connect.
    // Payload: { project: 'game' }
    // Joins `project_user:{project}` — for admin-to-user broadcast (announcements etc.)
    socket.on('user:join', (payload: { project?: string } = {}) => {
      const project = payload?.project;
      if (project && VALID_PROJECTS.has(project)) {
        socket.join(`project_user:${project}`);
        // Track for disconnect cleanup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any)._joinedProject = project;
        // Create/touch session in Redis for presence tracking
        if (socket.user?.id) {
          sessionSvc.touch(project, socket.user.id).catch(() => {});
          // Notify admins of updated online count (fire-and-forget)
          sessionSvc.countOnline(project).then((count: number) => {
            io.to(`project:${project}`).emit('admin:online_count', { project, count });
            io.to('admin:all').emit('admin:online_count', { project, count });
          }).catch(() => {});
        }
      }
    });

    // ── Legacy: admin-dashboard legacy join event (backwards compat) ──────────
    socket.on('join:project', (project) => {
      if (project === 'admin' && socket.user?.role === 'super_admin') {
        for (const p of VALID_PROJECTS) socket.join(`project:${p}`);
        socket.join('admin:all');
      } else if (VALID_PROJECTS.has(project)) {
        socket.join(`project:${project}`);
      }
    });

    // ── Notification subscription (user-facing) ───────────────────────────────
    socket.on('subscribe_notifications', (userId) => {
      socket.join(`user_${userId}`);
    });

    // ── Dating: persistent chat (DB-backed) ──────────────────────────────────
    registerChatSocket(io, socket);

    // ── Game: chat room ───────────────────────────────────────────────────────
    socket.on('join_game_room',    (roomId) => socket.join(`game_room_${roomId}`));
    socket.on('leave_game_room',   (roomId) => socket.leave(`game_room_${roomId}`));
    socket.on('send_game_message', (data) => {
      io.to(`game_room_${data.roomId}`).emit('new_game_message', {
        sender:  data.senderName,
        content: data.content,
        time:    new Date(),
      });
    });

    // ── Dating: typing indicators ─────────────────────────────────────────────
    socket.on('typing:start', (data) => {
      io.to(`user_${data.receiverId}`).emit('typing:start', { userId: socket.user?.id });
    });
    socket.on('typing:stop',  (data) => {
      io.to(`user_${data.receiverId}`).emit('typing:stop',  { userId: socket.user?.id });
    });

    // ── Dating: live streaming ────────────────────────────────────────────────
    socket.on('live:join',  (data) => socket.join(`live_${data.stream_id}`));
    socket.on('live:leave', (data) => socket.leave(`live_${data.stream_id}`));
    socket.on('live:chat',  (data) => {
      io.to(`live_${data.stream_id}`).emit('live:chat', {
        id:         `${socket.id}_${Date.now()}`,
        user_id:    socket.user?.id,
        username:   data.username || 'Guest',
        avatar:     data.avatar   || null,
        content:    data.content,
        created_at: new Date(),
      });
    });

    // ── Dating: WebRTC signaling ──────────────────────────────────────────────
    socket.on('call:offer',         (data) => io.to(`user_${data.to}`).emit('call:incoming',      { from: socket.user?.id, offer: data.offer, type: data.type }));
    socket.on('call:answer',        (data) => io.to(`user_${data.to}`).emit('call:answer',        { answer: data.answer }));
    socket.on('call:ice-candidate', (data) => io.to(`user_${data.to}`).emit('call:ice-candidate', { candidate: data.candidate }));
    socket.on('call:end',           (data) => io.to(`user_${data.to}`).emit('call:end',           { from: socket.user?.id }));

    // ── Sports: match live updates ────────────────────────────────────────────
    socket.on('join_match',  (matchId) => socket.join(`match_${matchId}`));
    socket.on('leave_match', (matchId) => socket.leave(`match_${matchId}`));

    // ── Sports: live stream chat ──────────────────────────────────────────────
    socket.on('join_sports_live',  (streamId) => socket.join(`sports_live_${streamId}`));
    socket.on('leave_sports_live', (streamId) => socket.leave(`sports_live_${streamId}`));
    socket.on('sports_live_chat',  (data) => {
      io.to(`sports_live_${data.streamId}`).emit('sports_live_chat', {
        id:        `${socket.id}_${Date.now()}`,
        userId:    socket.user?.id,
        username:  data.username || 'Guest',
        avatar:    data.avatar   || null,
        message:   data.message,
        type:      data.type     || 'text',
        createdAt: new Date(),
      });
    });

    // ── Support chat ──────────────────────────────────────────────────────────
    socket.on('support:join_room',  (roomId) => socket.join(`support_${roomId}`));
    socket.on('support:leave_room', (roomId) => socket.leave(`support_${roomId}`));

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info(`[Socket] disconnected: ${socket.id} user=${uid}`);
      // Clean up presence tracking on explicit disconnect
      // (TTL-based expiry handles the rest for ungraceful disconnects)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const joinedProject = (socket as any)._joinedProject as string | undefined;
      if (socket.user?.id && joinedProject) {
        sessionSvc.destroy(joinedProject, socket.user.id).catch(() => {});
      }
    });
  });
}

/**
 * Push a live match score/event update to all clients watching that match.
 * @param {import('socket.io').Server} io
 * @param {number} matchId
 * @param {object} payload
 */
const emitMatchUpdate = (io, matchId, payload) => {
  io.to(`match_${matchId}`).emit('match_update', { matchId, ...payload });
};

module.exports = setupSocketHandlers;
module.exports.emitMatchUpdate = emitMatchUpdate;
