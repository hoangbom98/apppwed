// @ts-nocheck
/**
 * modules/game/config/project.config.ts
 *
 * Game project configuration — consumed by core services to apply
 * game-specific reward rates, mission templates, and VIP thresholds.
 *
 * These values act as compile-time defaults.
 * Runtime overrides are managed via ConfigService (admin_db.ProjectConfig).
 */
'use strict';

const gameConfig = Object.freeze({
  project:   'GAME',
  name:      'Sảnh Game',
  currency:  'VND',

  // ── Referral rewards ──────────────────────────────────────────────
  referral: {
    referrerReward:  50_000,   // VND credited to referrer on completion
    refereeReward:   20_000,   // VND credited to new user
    completionTrigger: 'DEPOSIT', // 'DEPOSIT' | 'BET'
    maxLevels:       3,
    levelRates:      { 1: 0.05, 2: 0.02, 3: 0.01 },
  },

  // ── Loyalty / points ──────────────────────────────────────────────
  loyalty: {
    pointsPerUnit:  1000,    // 1 point per 1000 VND
    redeemRate:     1000,    // 1000 points → 1 VND
    earnRates: {
      BET:          0.5,
      DEPOSIT:      1.0,
      DAILY_LOGIN:  0,        // handled by check-in, not loyalty
      MISSION:      0,        // handled by mission service
    },
  },

  // ── VIP tiers ─────────────────────────────────────────────────────
  vipLevels: [
    { level: 1, name: 'Đồng',    minPoints: 0,        cashbackRate: 0.004, maxWithdraw: 20_000_000 },
    { level: 2, name: 'Bạc',     minPoints: 1_000,    cashbackRate: 0.005, maxWithdraw: 30_000_000 },
    { level: 3, name: 'Vàng',    minPoints: 5_000,    cashbackRate: 0.006, maxWithdraw: 50_000_000 },
    { level: 4, name: 'Bạch Kim', minPoints: 20_000,  cashbackRate: 0.008, maxWithdraw: 100_000_000 },
    { level: 5, name: 'Kim Cương', minPoints: 100_000, cashbackRate: 0.01, maxWithdraw: 500_000_000 },
  ],

  // ── Mission templates ────────────────────────────────────────────
  missions: [
    { code: 'LOGIN',    name: 'Đăng nhập hàng ngày',      targetType: 'LOGIN',   target: 1,  rewardPoints: 5,   rewardType: 'points' },
    { code: 'BET_5',    name: 'Đặt 5 ván cược',            targetType: 'BET',    target: 5,  rewardPoints: 25,  rewardType: 'points' },
    { code: 'BET_10',   name: 'Đặt 10 ván cược',           targetType: 'BET',    target: 10, rewardPoints: 50,  rewardType: 'points' },
    { code: 'WIN_3',    name: 'Thắng 3 ván liên tiếp',     targetType: 'WIN',    target: 3,  rewardPoints: 100, rewardType: 'points' },
    { code: 'DEPOSIT',  name: 'Nạp tiền hôm nay',          targetType: 'DEPOSIT', target: 1, rewardPoints: 30,  rewardType: 'points' },
    { code: 'INVITE',   name: 'Mời 1 bạn đăng ký',         targetType: 'INVITE', target: 1, rewardPoints: 200, rewardType: 'points' },
  ],

  // ── Leaderboard boards ────────────────────────────────────────────
  leaderboardBoards: ['points', 'bet_amount', 'win_count'],

  // ── Lucky wheel ───────────────────────────────────────────────────
  wheel: {
    maxFreeSpinsPerDay: 3,
    spinCost:           10_000, // VND for paid spin
  },
});

module.exports = { gameConfig };
