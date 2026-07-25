/**
 * @lkvip/types — src/giftcode.ts
 *
 * GiftCode (mã quà tặng) domain types.
 * Replaces BoYue: caipiao_giftcode / caipiao_cdkey.
 *
 * Usage:
 *   import type { IGiftCode, IGiftCodeRedemption } from '@lkvip/types';
 */

// ─────────────────────────────────────────────────────────────────────────────
// GIFT CODE  (BoYue: caipiao_giftcode)
// ─────────────────────────────────────────────────────────────────────────────

export interface IGiftCode {
  id:           string;
  /** Unique alphanumeric code users type in, e.g. "LKVIP2025" */
  code:         string;
  /** balance | bonus | free_spin | vip_exp */
  rewardType:   string;
  rewardAmount: number;
  /** Max total redemptions (null = unlimited) */
  maxUses:      number | null;
  /** Max per unique user (default: 1) */
  maxPerUser:   number;
  usedCount:    number;
  /** Minimum VIP level required to redeem (0 = any) */
  minVipLevel:  number;
  startDate:    Date | null;
  endDate:      Date | null;
  /** active | inactive | depleted | expired */
  status:       string;
  note:         string | null;
  createdAt:    Date;
  updatedAt:    Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// GIFT CODE REDEMPTION  (BoYue: caipiao_cdkey_log)
// ─────────────────────────────────────────────────────────────────────────────

export interface IGiftCodeRedemption {
  id:           string;
  giftCodeId:   string;
  userId:       string;
  /** Actual reward amount credited */
  rewardAmount: number;
  redeemedAt:   Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// REDEEM REQUEST  (user API input)
// ─────────────────────────────────────────────────────────────────────────────

export interface IRedeemGiftCodeRequest {
  code: string;
}

export interface IRedeemGiftCodeResponse {
  rewardType:   string;
  rewardAmount: number;
  message:      string;
}
