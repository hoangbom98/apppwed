// @ts-nocheck
/**
 * modules/sports/config/project.config.ts
 *
 * Sports project configuration.
 */
'use strict';

const sportsConfig = Object.freeze({
  project:   'SPORTS',
  name:      'Thể Thao',
  currency:  'VND',

  // ── Referral rewards ──────────────────────────────────────────────
  referral: {
    referrerReward:  30_000,
    refereeReward:   15_000,
    completionTrigger: 'DEPOSIT',
    maxLevels:       3,
    levelRates:      { 1: 0.05, 2: 0.02, 3: 0.01 },
  },

  // ── Loyalty / points ──────────────────────────────────────────────
  loyalty: {
    pointsPerUnit:  1000,
    redeemRate:     1000,
    earnRates: {
      BET:          1.0,    // sports bettors earn double
      DEPOSIT:      1.0,
      WATCH_LIVE:   0.5,    // per 5 minutes watched (trigger externally)
      SHARE_RESULT: 0.5,
    },
  },

  // ── VIP tiers ─────────────────────────────────────────────────────
  vipLevels: [
    { level: 1, name: 'Đồng',     minPoints: 0,       cashbackRate: 0.003, maxWithdraw: 20_000_000 },
    { level: 2, name: 'Bạc',      minPoints: 1_000,   cashbackRate: 0.005, maxWithdraw: 30_000_000 },
    { level: 3, name: 'Vàng',     minPoints: 5_000,   cashbackRate: 0.007, maxWithdraw: 50_000_000 },
    { level: 4, name: 'Bạch Kim', minPoints: 20_000,  cashbackRate: 0.009, maxWithdraw: 100_000_000 },
    { level: 5, name: 'Kim Cương', minPoints: 100_000, cashbackRate: 0.012, maxWithdraw: 500_000_000 },
  ],

  // ── Mission templates ────────────────────────────────────────────
  missions: [
    { code: 'LOGIN',        name: 'Đăng nhập hàng ngày',       targetType: 'LOGIN',      target: 1, rewardPoints: 5,   rewardType: 'points' },
    { code: 'BET_SPORTS',   name: 'Đặt 3 kèo thể thao',        targetType: 'BET',        target: 3, rewardPoints: 30,  rewardType: 'points' },
    { code: 'WATCH_LIVE',   name: 'Xem 1 trận đấu trực tiếp',  targetType: 'WATCH_LIVE', target: 1, rewardPoints: 20,  rewardType: 'points' },
    { code: 'SHARE_RESULT', name: 'Chia sẻ kết quả trận đấu',  targetType: 'SHARE',      target: 1, rewardPoints: 15,  rewardType: 'points' },
    { code: 'DEPOSIT',      name: 'Nạp tiền hôm nay',          targetType: 'DEPOSIT',    target: 1, rewardPoints: 30,  rewardType: 'points' },
    { code: 'INVITE',       name: 'Mời 1 bạn đăng ký',         targetType: 'INVITE',     target: 1, rewardPoints: 150, rewardType: 'points' },
  ],

  // ── Leaderboard boards ────────────────────────────────────────────
  leaderboardBoards: ['points', 'bet_amount', 'win_count'],

  // ── Lucky wheel ───────────────────────────────────────────────────
  wheel: {
    maxFreeSpinsPerDay: 2,
    spinCost:           15_000,
  },
});

module.exports = { sportsConfig };
