// @ts-nocheck
/**
 * modules/dating/config/project.config.ts
 *
 * Dating project configuration.
 */
'use strict';

const datingConfig = Object.freeze({
  project:   'DATING',
  name:      'Hẹn Hò',
  currency:  'VND',

  // ── Referral rewards ──────────────────────────────────────────────
  referral: {
    referrerReward:  30_000,
    refereeReward:   20_000,
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
      MATCH:        0.5,      // points per match made
      MESSAGE:      0.1,      // points per message sent
      SUPERLIKE:    1.0,
      GIFT_SENT:    0.5,
    },
  },

  // ── VIP tiers (subscription-based) ────────────────────────────────
  vipLevels: [
    { level: 1, name: 'Thường',  minPoints: 0,      superlikes: 1,  rewindEnabled: false },
    { level: 2, name: 'Cơ Bản', minPoints: 500,    superlikes: 3,  rewindEnabled: true  },
    { level: 3, name: 'Vàng',   minPoints: 2_000,  superlikes: 10, rewindEnabled: true  },
    { level: 4, name: 'Kim Cương', minPoints: 10_000, superlikes: 30, rewindEnabled: true },
  ],

  // ── Mission templates ────────────────────────────────────────────
  missions: [
    { code: 'LOGIN',       name: 'Đăng nhập hàng ngày',       targetType: 'LOGIN',     target: 1, rewardPoints: 5,  rewardType: 'points' },
    { code: 'SWIPE_10',    name: 'Vuốt 10 hồ sơ',             targetType: 'SWIPE',     target: 10, rewardPoints: 20, rewardType: 'points' },
    { code: 'MATCH_1',     name: 'Ghép đôi thành công',        targetType: 'MATCH',     target: 1, rewardPoints: 30, rewardType: 'points' },
    { code: 'SEND_MSG_5',  name: 'Gửi 5 tin nhắn',             targetType: 'MESSAGE',   target: 5, rewardPoints: 15, rewardType: 'points' },
    { code: 'COMPLETE_PROFILE', name: 'Hoàn thiện hồ sơ 100%', targetType: 'PROFILE', target: 1, rewardPoints: 100, rewardType: 'points' },
    { code: 'INVITE',      name: 'Mời 1 bạn đăng ký',         targetType: 'INVITE',    target: 1, rewardPoints: 200, rewardType: 'points' },
  ],

  // ── Leaderboard boards ────────────────────────────────────────────
  leaderboardBoards: ['points', 'matches'],

  // ── Lucky wheel ───────────────────────────────────────────────────
  wheel: {
    maxFreeSpinsPerDay: 3,
    spinCost:           5_000,
  },
});

module.exports = { datingConfig };
