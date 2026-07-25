// @ts-nocheck
/**
 * modules/trade/config/project.config.ts
 *
 * Trade project configuration.
 */
'use strict';

const tradeConfig = Object.freeze({
  project:   'TRADE',
  name:      'Giao Dịch',
  currency:  'VND',

  // ── Referral rewards ──────────────────────────────────────────────
  referral: {
    referrerReward:  100_000,   // higher value for trading referrals
    refereeReward:   50_000,
    completionTrigger: 'DEPOSIT',
    maxLevels:       3,
    levelRates:      { 1: 0.06, 2: 0.03, 3: 0.01 },
  },

  // ── Loyalty / points ──────────────────────────────────────────────
  loyalty: {
    pointsPerUnit:  5000,    // 1 point per 5000 VND traded (lower volume)
    redeemRate:     500,     // 500 points → 1 VND (better redemption rate)
    earnRates: {
      TRADE:        1.0,
      DEPOSIT:      2.0,     // double points for first deposit
      INVESTMENT:   1.5,
    },
  },

  // ── VIP tiers ─────────────────────────────────────────────────────
  vipLevels: [
    { level: 1, name: 'Cơ Bản',   minPoints: 0,       maxDailyWithdraw: 50_000_000 },
    { level: 2, name: 'Tiêu Chuẩn', minPoints: 500,   maxDailyWithdraw: 100_000_000 },
    { level: 3, name: 'Nâng Cao', minPoints: 2_000,   maxDailyWithdraw: 200_000_000 },
    { level: 4, name: 'Chuyên Nghiệp', minPoints: 10_000, maxDailyWithdraw: 500_000_000 },
    { level: 5, name: 'Ưu Tú',   minPoints: 50_000,  maxDailyWithdraw: 999_000_000 },
  ],

  // ── Mission templates ────────────────────────────────────────────
  missions: [
    { code: 'LOGIN',         name: 'Đăng nhập hàng ngày',         targetType: 'LOGIN',      target: 1, rewardPoints: 10,  rewardType: 'points' },
    { code: 'PLACE_ORDER',   name: 'Đặt 1 lệnh giao dịch',        targetType: 'TRADE',      target: 1, rewardPoints: 20,  rewardType: 'points' },
    { code: 'TRADE_5',       name: 'Hoàn thành 5 giao dịch',      targetType: 'TRADE',      target: 5, rewardPoints: 100, rewardType: 'points' },
    { code: 'DEPOSIT',       name: 'Nạp tiền hôm nay',            targetType: 'DEPOSIT',    target: 1, rewardPoints: 50,  rewardType: 'points' },
    { code: 'INVEST',        name: 'Tham gia 1 gói đầu tư',       targetType: 'INVESTMENT', target: 1, rewardPoints: 200, rewardType: 'points' },
    { code: 'INVITE',        name: 'Mời 1 bạn đăng ký',           targetType: 'INVITE',     target: 1, rewardPoints: 300, rewardType: 'points' },
  ],

  // ── Leaderboard boards ────────────────────────────────────────────
  leaderboardBoards: ['points', 'profit', 'trade_volume'],

  // ── Lucky wheel (not available in trade) ──────────────────────────
  wheel: {
    maxFreeSpinsPerDay: 0,
    spinCost:           0,
  },
});

module.exports = { tradeConfig };
