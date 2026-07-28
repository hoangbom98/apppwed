/**
 * NotificationService — bridge between backend logic and Socket.IO real-time pushes.
 * Also queues email/SMS notifications via notificationQueue.
 *
 * Usage:
 *   const notifSvc = require('./notificationService');
 *   notifSvc.setIo(io);                                 // called once from server.js
 *   notifSvc.sendToUser(userId, 'event', payload);       // real-time push
 *   await notifSvc.sendEmail(project, userId, to, subj, text); // queued email
 */
const notificationQueue = require('../queue/notificationQueue');
const logger            = require('./logger');

let _io = null;

class NotificationService {
  /**
   * Called once from server.js / socket handlers after io is created.
   * @param {import('socket.io').Server} io
   */
  setIo(io) {
    _io = io;
  }

  /**
   * Expose _io as a property so external code (e.g. cron jobs) can do:
   *   const notifSvc = require('./notificationService');
   *   const io = notifSvc._io;
   * Returns null if setIo() has not been called yet.
   * @returns {import('socket.io').Server|null}
   */
  get _io() {
    return _io;
  }

  /**
   * Emit a Socket.IO event directly to a specific user's room.
   * Silently no-ops if io is not yet initialised (e.g. during unit tests).
   *
   * @param {string|number} userId
   * @param {string}        event    – e.g. 'balance:update', 'notification'
   * @param {object}        payload
   */
  sendToUser(userId, event, payload) {
    if (!_io) {
      logger.warn(`[NotifSvc] io not initialised — skipping sendToUser(${userId}, ${event})`);
      return;
    }
    try {
      _io.to(`user_${userId}`).emit(event, payload);
    } catch (err) {
      logger.error(`[NotifSvc] sendToUser error: ${err.message}`);
    }
  }

  /**
   * Broadcast an event to all connected clients.
   * @param {string} event
   * @param {object} payload
   */
  broadcast(event, payload) {
    if (!_io) return;
    try {
      _io.emit(event, payload);
    } catch (err) {
      logger.error(`[NotifSvc] broadcast error: ${err.message}`);
    }
  }

  /**
   * Emit to a named room (e.g. a match room, live stream room).
   * @param {string} room
   * @param {string} event
   * @param {object} payload
   */
  sendToRoom(room, event, payload) {
    if (!_io) return;
    try {
      _io.to(room).emit(event, payload);
    } catch (err) {
      logger.error(`[NotifSvc] sendToRoom error: ${err.message}`);
    }
  }

  /**
   * Queue an email notification via Bull queue.
   * @param {string} projectCode
   * @param {string|number} userId
   * @param {string} to
   * @param {string} subject
   * @param {string} text
   */
  async sendEmail(projectCode, userId, to, subject, text) {
    try {
      await notificationQueue.add({ projectCode, type: 'email', userId, data: { to, subject, text } });
    } catch (err) {
      logger.error(`[NotifSvc] sendEmail queue error: ${err.message}`);
    }
  }

  /**
   * Queue an SMS notification via Bull queue.
   */
  async sendSms(projectCode, userId, phone, text) {
    try {
      await notificationQueue.add({ projectCode, type: 'sms', userId, data: { phone, text } });
    } catch (err) {
      logger.error(`[NotifSvc] sendSms queue error: ${err.message}`);
    }
  }
}

module.exports = new NotificationService();

// Named export for TypeScript `import { NotificationService } from '...'` consumers
export { NotificationService };
