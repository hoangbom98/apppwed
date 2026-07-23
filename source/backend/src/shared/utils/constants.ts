'use strict';
/**
 * src/shared/utils/constants.ts
 *
 * Re-exports all constants from the canonical @lkvip/constants workspace package,
 * then adds backend-only status enums that have no place in the shared package.
 *
 * Import priority:
 *   1. Use @lkvip/constants directly for: PROJECT_IDS, USER_ROLES, ADMIN_ROLES,
 *      ROLE_LEVEL, isAdminRole, roleAtLeast, HTTP_STATUS, ERROR_CODES,
 *      CURRENCY_CODES, PAYMENT_GATEWAY_CODES, DEFAULT_LIMITS, GATEWAY_MIN_AMOUNT
 *
 *   2. Use this file for legacy backend constants and combined imports.
 */

// ── Re-export everything from the canonical package ───────────────────────────
const lkvipConstants = require('@lkvip/constants');
module.exports = Object.assign(Object.create(null), lkvipConstants, {

  // ── Backend-only status constants (not needed in frontend) ────────────────

  ORDER_STATUS: Object.freeze({
    OPEN: 'open', PARTIAL: 'partial', FILLED: 'filled',
    CANCELLED: 'cancelled', EXPIRED: 'expired',
  }),

  DEPOSIT_STATUS:  Object.freeze({ PENDING: 'pending', SUCCESS: 'success', FAILED: 'failed' }),
  WITHDRAW_STATUS: Object.freeze({
    PENDING: 'pending', PROCESSING: 'processing',
    SUCCESS: 'success', FAILED: 'failed', CANCELLED: 'cancelled',
  }),

  KYC_STATUS: Object.freeze({
    PENDING: 'pending', PENDING_REVIEW: 'pending_review',
    VERIFIED: 'verified', REJECTED: 'rejected',
  }),

  NOTIFICATION_TYPES: Object.freeze({
    SYSTEM: 'system', DEPOSIT: 'deposit', WITHDRAW: 'withdraw',
    MATCH: 'match', MESSAGE: 'message', GIFT: 'gift', VIP: 'vip',
    BET: 'bet', PROMO: 'promo', NEWS: 'news',
  }),

  SWIPE_TYPES: Object.freeze({ LIKE: 'like', NOPE: 'nope', SUPER: 'super' }),
  VIP_TIERS:   Object.freeze({ FREE: 'free', SILVER: 'silver', GOLD: 'gold', PLATINUM: 'platinum', DIAMOND: 'diamond' }),

  MATCH_STATUS:  Object.freeze({ ACTIVE: 'active', UNMATCHED: 'unmatched', BLOCKED: 'blocked' }),
  MESSAGE_TYPES: Object.freeze({ TEXT: 'text', IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio', GIFT: 'gift', STICKER: 'sticker' }),

  BET_STATUS:    Object.freeze({ PENDING: 'pending', WON: 'won', LOST: 'lost', REFUNDED: 'refunded', CANCELLED: 'cancelled' }),
  EVENT_STATUS:  Object.freeze({ UPCOMING: 'upcoming', LIVE: 'live', FINISHED: 'finished', POSTPONED: 'postponed', CANCELLED: 'cancelled' }),
  MARKET_STATUS: Object.freeze({ OPEN: 'open', SUSPENDED: 'suspended', SETTLED: 'settled', CANCELLED: 'cancelled' }),

  CACHE_TTL: Object.freeze({
    SHORT: 60,    // 1 minute
    MEDIUM: 300,  // 5 minutes
    LONG: 3600,   // 1 hour
    DAY: 86400,   // 1 day
  }),
});
