/**
 * core/index.ts — Barrel export for all core services and utilities.
 *
 * Import selectively in application code:
 *   import { AffiliateService }    from '../core';
 *   import { LeaderboardService }  from '../core';
 *   import { LuckyWheelService }   from '../core';
 *   import { CampaignService }     from '../core';
 *   import { SegmentService }      from '../core';
 *   import { ABTestingService }    from '../core';
 *   import { CommunityService }    from '../core';
 *   import { FeedService }         from '../core';
 *   import { eventBus, EVENTS }    from '../core';
 *
 * Or via require (legacy CJS modules in this codebase):
 *   const { AffiliateService } = require('../core');
 */

// ── Events ────────────────────────────────────────────────────────────────
export const { eventBus, EVENTS }           = require('./events/event-bus');

// ── Rewards ───────────────────────────────────────────────────────────────
export const { RewardService, REWARD_TYPES } = require('./rewards/reward.service');
export const { AffiliateService }            = require('./rewards/affiliate.service');

// ── Gamification ──────────────────────────────────────────────────────────
export const { LeaderboardService }          = require('./gamification/leaderboard.service');
export const { LuckyWheelService }           = require('./gamification/lucky-wheel.service');

// ── Marketing ─────────────────────────────────────────────────────────────
export const { CampaignService }             = require('./marketing/campaign.service');
export const { SegmentService }              = require('./marketing/segment.service');
export const { ABTestingService }            = require('./marketing/ab-testing.service');

// ── Social ────────────────────────────────────────────────────────────────
export const { CommunityService }            = require('./social/community.service');
export const { FeedService, FEED_TYPES }     = require('./social/feed.service');

// ── Strategies ────────────────────────────────────────────────────────────
export { StrategyFactory }                   from './strategies/strategy.factory';

// ── Utils ─────────────────────────────────────────────────────────────────
export { withLock, tryLock }                 from './utils/distributed-lock';

// ── CJS-compatible default for legacy require() callers ──────────────────
// Allows:  const { CampaignService } = require('./core');
module.exports = Object.assign(module.exports, {
  eventBus,
  EVENTS,
  RewardService,
  REWARD_TYPES,
  AffiliateService,
  LeaderboardService,
  LuckyWheelService,
  CampaignService,
  SegmentService,
  ABTestingService,
  CommunityService,
  FeedService,
  FEED_TYPES,
});
