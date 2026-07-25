// @ts-nocheck
/**
 * core/events/event-bus.ts
 *
 * Unified EventBus for the LKVIP platform.
 *
 * • In-process: EventEmitter (always used)
 * • Cross-process: Redis Pub/Sub (active when REDIS_URL is set)
 *
 * Usage:
 *   const { eventBus, EVENTS } = require('../../core/events/event-bus');
 *   eventBus.emit(EVENTS.USER_REGISTERED, { userId, project });
 *   eventBus.on(EVENTS.DEPOSIT_SUCCESS, async (data) => { … });
 */
'use strict';

const { EventEmitter } = require('events');
const logger = require('../../shared/services/logger');

// ── Canonical event names ─────────────────────────────────────────────────────
const EVENTS = Object.freeze({
  // ── User lifecycle ──────────────────────────────────────────────
  USER_REGISTERED:        'user.registered',
  USER_LOGIN:             'user.login',
  USER_LOGOUT:            'user.logout',
  USER_KYC_APPROVED:      'user.kyc.approved',
  USER_PROFILE_UPDATED:   'user.profile.updated',

  // ── Wallet / Finance ────────────────────────────────────────────
  DEPOSIT_SUCCESS:        'wallet.deposit.success',
  WITHDRAW_SUCCESS:       'wallet.withdraw.success',
  WITHDRAW_REQUESTED:     'wallet.withdraw.requested',

  // ── Betting / Games ─────────────────────────────────────────────
  BET_PLACED:             'bet.placed',
  BET_WON:                'bet.won',
  BET_LOST:               'bet.lost',
  BET_SETTLED:            'bet.settled',
  GAME_SESSION_STARTED:   'game.session.started',
  GAME_SESSION_ENDED:     'game.session.ended',

  // ── Referral / Affiliate ────────────────────────────────────────
  REFERRAL_CREATED:       'referral.created',
  REFERRAL_COMPLETED:     'referral.completed',
  AFFILIATE_CONVERSION:   'affiliate.conversion',

  // ── Loyalty & VIP ───────────────────────────────────────────────
  POINTS_EARNED:          'points.earned',
  POINTS_REDEEMED:        'points.redeemed',
  LEVEL_UP:               'vip.levelup',

  // ── Gamification ────────────────────────────────────────────────
  MISSION_COMPLETED:      'mission.completed',
  CHECKIN_COMPLETED:      'checkin.completed',
  SPIN_COMPLETED:         'spin.completed',

  // ── Social ──────────────────────────────────────────────────────
  POST_CREATED:           'social.post.created',
  COMMENT_ADDED:          'social.comment.added',
  MATCH_CREATED:          'dating.match.created',

  // ── Marketing ───────────────────────────────────────────────────
  CAMPAIGN_TRIGGERED:     'campaign.triggered',
  FORM_SUBMITTED:         'form.submitted',
});

// ── EventBus class ────────────────────────────────────────────────────────────
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);
    this._subscriber = null;
    this._publisher  = null;
    this._initialized = false;
  }

  /**
   * Initialise Redis pub/sub (call once from server.ts after Redis is ready).
   * Falls back silently to in-process only if Redis is unavailable.
   * @param {import('ioredis').Redis} redisClient – existing shared Redis client
   */
  initRedis(redisClient) {
    if (this._initialized || !redisClient) return;
    try {
      this._publisher  = redisClient;
      this._subscriber = redisClient.duplicate();

      this._subscriber.subscribe('lkvip:events', (err) => {
        if (err) {
          logger.error(`[EventBus] Redis subscribe error: ${err.message}`);
          return;
        }
        logger.info('[EventBus] Redis pub/sub connected');
      });

      this._subscriber.on('message', (_channel, message) => {
        try {
          const { event, data, _fromRedis } = JSON.parse(message);
          // Re-emit locally — flag prevents double-publish loop
          if (!_fromRedis) return;
          super.emit(event, data);
        } catch (e) {
          logger.error(`[EventBus] Redis message parse error: ${e.message}`);
        }
      });

      this._initialized = true;
    } catch (e) {
      logger.warn(`[EventBus] Redis init failed — running in-process only: ${e.message}`);
    }
  }

  /**
   * Emit an event to all local listeners AND publish to Redis (if configured).
   * @param {string} event
   * @param {*}      data
   */
  emit(event, data) {
    // In-process listeners
    super.emit(event, data);

    // Cross-process via Redis
    if (this._publisher) {
      try {
        this._publisher.publish(
          'lkvip:events',
          JSON.stringify({ event, data, _fromRedis: true, ts: Date.now() }),
        );
      } catch (e) {
        logger.error(`[EventBus] Redis publish error: ${e.message}`);
      }
    }
  }

  /**
   * Register an async event handler.
   * Errors inside the handler are caught and logged — they never crash the process.
   * @param {string}                  event
   * @param {(data: any) => Promise<void>} handler
   */
  on(event, handler) {
    super.on(event, async (data) => {
      try {
        await handler(data);
      } catch (e) {
        logger.error(`[EventBus] handler error for "${event}": ${e.message}`, {
          stack: e.stack,
        });
      }
    });
    return this;
  }
}

const eventBus = new EventBus();

module.exports = { eventBus, EVENTS };
