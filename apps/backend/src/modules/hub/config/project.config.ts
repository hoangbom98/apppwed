// @ts-nocheck
/**
 * modules/hub/config/project.config.ts
 *
 * Hub portal configuration.
 */
'use strict';

const hubConfig = Object.freeze({
  project:   'HUB',
  name:      'Cổng Thông Tin',
  currency:  'VND',

  // ── Referral rewards ──────────────────────────────────────────────
  referral: {
    referrerReward:  20_000,
    refereeReward:   10_000,
    completionTrigger: 'DEPOSIT',
    maxLevels:       2,
    levelRates:      { 1: 0.05, 2: 0.02 },
  },

  // ── Loyalty / points ──────────────────────────────────────────────
  loyalty: {
    pointsPerUnit:  1000,
    redeemRate:     1000,
    earnRates: {
      DEPOSIT:      1.0,
      COMMENT:      0.5,    // points per news comment
      SHARE:        1.0,    // share an article
      DAILY_LOGIN:  0,      // handled by check-in
    },
  },

  // ── VIP tiers ─────────────────────────────────────────────────────
  vipLevels: [
    { level: 1, name: 'Thành Viên', minPoints: 0 },
    { level: 2, name: 'Bạc',        minPoints: 1_000 },
    { level: 3, name: 'Vàng',       minPoints: 5_000 },
    { level: 4, name: 'Kim Cương',  minPoints: 20_000 },
  ],

  // ── Mission templates ────────────────────────────────────────────
  missions: [
    { code: 'LOGIN',       name: 'Đăng nhập hàng ngày',    targetType: 'LOGIN',   target: 1, rewardPoints: 5,  rewardType: 'points' },
    { code: 'READ_NEWS_3', name: 'Đọc 3 bài tin tức',      targetType: 'READ',    target: 3, rewardPoints: 15, rewardType: 'points' },
    { code: 'COMMENT',     name: 'Bình luận 1 bài viết',   targetType: 'COMMENT', target: 1, rewardPoints: 10, rewardType: 'points' },
    { code: 'SHARE',       name: 'Chia sẻ 1 bài viết',     targetType: 'SHARE',   target: 1, rewardPoints: 20, rewardType: 'points' },
    { code: 'INVITE',      name: 'Mời 1 bạn đăng ký',      targetType: 'INVITE',  target: 1, rewardPoints: 100, rewardType: 'points' },
  ],

  // ── Leaderboard boards ────────────────────────────────────────────
  leaderboardBoards: ['points'],

  // ── Lucky wheel (Hub) ─────────────────────────────────────────────
  wheel: {
    maxFreeSpinsPerDay: 1,
    spinCost:           0, // always free on Hub
  },
});

module.exports = { hubConfig };
