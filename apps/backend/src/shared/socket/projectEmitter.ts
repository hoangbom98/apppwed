/**
 * projectEmitter.ts
 * ─────────────────
 * Thin helper layer so controllers never import socket.ts directly.
 * All real-time push calls for business events go through here.
 *
 * USAGE (in any controller):
 *
 *   const emit = require('../../shared/socket/projectEmitter');
 *
 *   // After a new deposit order is created:
 *   emit.depositCreated('game', { orderId, userId, username, amount, method });
 *
 *   // After admin approves a deposit:
 *   emit.depositApproved('game', userId, { orderId, amount, newBalance });
 *
 *   // After KYC status changes:
 *   emit.kycUpdated('trade', userId, { status, level });
 *
 *   // After a new user registers in any project:
 *   emit.userRegistered('hub', { userId, username });
 *
 * ISOLATION GUARANTEE:
 *   emitAdminEvent() always sends to BOTH:
 *     - project:{project}  →  admin managing that project
 *     - admin:all          →  super_admin global dashboard
 *   emitToUser() sends to ONLY:
 *     - user_{userId}      →  the specific user's socket(s)
 *
 * Adding a new event type:
 *   1. Add a function below following the same pattern.
 *   2. Import projectEmitter in the relevant controller.
 *   3. No frontend changes needed — the admin FE listens to the event name.
 */
const { emitAdminEvent, emitAdminNsp, emitToUser } = require('../../config/socket');

// ── Fan-out helper: emits to BOTH default ns rooms AND /admin ns ──────────────
// This ensures backwards-compatible admin-dashboard clients AND new /admin ns
// clients both receive every business event.
function _adminBroadcast(project, event, data) {
  emitAdminEvent(project, event, data);  // default ns → project:{p} + admin:all
  emitAdminNsp(project, event, data);    // /admin ns  → project:{p} + admin:all
}

// ── Finance ────────────────────────────────────────────────────────────────────

/**
 * User created a deposit request.
 * Admin sees it as a new pending item in the finance queue.
 */
function depositCreated(project, data) {
  _adminBroadcast(project, 'admin:finance_event', {
    type:      'deposit_request',
    status:    'pending',
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Admin approved a deposit.
 * Notify the specific user their balance has been updated.
 */
function depositApproved(project, userId, data) {
  _adminBroadcast(project, 'admin:finance_event', {
    type:   'deposit_approved',
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
  emitToUser(userId, 'user:deposit_approved', {
    project,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Admin rejected a deposit.
 */
function depositRejected(project, userId, data) {
  _adminBroadcast(project, 'admin:finance_event', {
    type:   'deposit_rejected',
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
  emitToUser(userId, 'user:deposit_rejected', {
    project,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * User created a withdrawal request.
 */
function withdrawalCreated(project, data) {
  _adminBroadcast(project, 'admin:finance_event', {
    type:      'withdrawal_request',
    status:    'pending',
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Admin approved a withdrawal.
 */
function withdrawalApproved(project, userId, data) {
  _adminBroadcast(project, 'admin:finance_event', {
    type:   'withdrawal_approved',
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
  emitToUser(userId, 'user:withdrawal_approved', { project, ...data, timestamp: new Date().toISOString() });
}

/**
 * Admin rejected a withdrawal.
 */
function withdrawalRejected(project, userId, data) {
  _adminBroadcast(project, 'admin:finance_event', {
    type:   'withdrawal_rejected',
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
  emitToUser(userId, 'user:withdrawal_rejected', { project, ...data, timestamp: new Date().toISOString() });
}

// ── Users ──────────────────────────────────────────────────────────────────────

/**
 * New user registered in a project.
 * Admin stats panel should invalidate user counts.
 */
function userRegistered(project, data) {
  _adminBroadcast(project, 'admin:new_user', {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * User was banned / suspended.
 */
function userStatusChanged(project, userId, data) {
  emitAdminEvent(project, 'admin:user_event', {
    type: 'status_changed',
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
  emitToUser(userId, 'user:account_update', { project, ...data, timestamp: new Date().toISOString() });
}

// ── KYC ───────────────────────────────────────────────────────────────────────

/**
 * KYC document submitted by user.
 */
function kycSubmitted(project, data) {
  emitAdminEvent(project, 'admin:kyc_event', {
    type:      'kyc_submitted',
    status:    'pending',
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Admin processed a KYC document.
 */
function kycUpdated(project, userId, data) {
  emitAdminEvent(project, 'admin:kyc_event', {
    type:   'kyc_updated',
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
  emitToUser(userId, 'user:kyc_updated', { project, ...data, timestamp: new Date().toISOString() });
}

// ── Risk / Security ────────────────────────────────────────────────────────────

/**
 * Risk engine triggered an alert.
 */
function riskAlert(project, data) {
  emitAdminEvent(project, 'admin:risk_alert', {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

/**
 * General stats changed — admin dashboard should re-fetch.
 */
function statsUpdated(project) {
  _adminBroadcast(project, 'admin:stats_update', {
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  // Finance
  depositCreated,
  depositApproved,
  depositRejected,
  withdrawalCreated,
  withdrawalApproved,
  withdrawalRejected,
  // Users
  userRegistered,
  userStatusChanged,
  // KYC
  kycSubmitted,
  kycUpdated,
  // Risk
  riskAlert,
  // Stats
  statsUpdated,
};
