/**
 * @lkvip/types — src/rebate.ts
 *
 * Rebate (hoàn trả) domain types.
 * Replaces BoYue: caipiao_fanshui / xima / caipiao_rebate_category_config.
 *
 * Usage:
 *   import type { IVipRebateRate, IRebate, IRebateStatus } from '@lkvip/types';
 */

// ─────────────────────────────────────────────────────────────────────────────
// VIP REBATE RATE TABLE  (BoYue: caipiao_membergroup.fs_live / fs_slot / etc.)
// ─────────────────────────────────────────────────────────────────────────────

/** One row per VIP level — defines rebate rates for each game type. */
export interface IVipRebateRate {
  /** VIP level integer (1 = Bronze, … 8 = Diamond) */
  vipLevel: number;
  /** Live casino rebate rate, e.g. 0.004 = 0.4% */
  live:     number;
  /** Slot / RNG / Fishing rebate rate */
  slot:     number;
  /** Lottery rebate rate */
  lottery:  number;
  /** Sports / Esports rebate rate */
  sports:   number;
}

/**
 * Default VIP rebate rate table.
 * Admin can override these via RebateRule records in admin_db.
 * Learned from BoYue caipiao_membergroup.fs_* columns.
 */
export const DEFAULT_VIP_REBATE_RATES: IVipRebateRate[] = [
  { vipLevel: 1, live: 0.004, slot: 0.004, lottery: 0.002, sports: 0.003 },
  { vipLevel: 2, live: 0.005, slot: 0.005, lottery: 0.003, sports: 0.004 },
  { vipLevel: 3, live: 0.006, slot: 0.006, lottery: 0.004, sports: 0.005 },
  { vipLevel: 4, live: 0.007, slot: 0.007, lottery: 0.005, sports: 0.006 },
  { vipLevel: 5, live: 0.009, slot: 0.008, lottery: 0.007, sports: 0.008 },
  { vipLevel: 6, live: 0.010, slot: 0.009, lottery: 0.008, sports: 0.009 },
  { vipLevel: 7, live: 0.011, slot: 0.010, lottery: 0.009, sports: 0.010 },
  { vipLevel: 8, live: 0.012, slot: 0.011, lottery: 0.010, sports: 0.011 },
];

// ─────────────────────────────────────────────────────────────────────────────
// REBATE RECORD  (game_db: rebates table)
// ─────────────────────────────────────────────────────────────────────────────

export interface IRebate {
  id:        string;
  userId:    string;
  /** Betting date (T), format YYYY-MM-DD */
  betDate:   string;
  /** live | slot | lottery | sports */
  gameType:  string;
  validBet:  number;
  rate:      number;
  amount:    number;
  vipLevel:  number;
  /** pending | claimable | claimed | expired */
  status:    string;
  claimedAt: Date | null;
  settledAt: Date | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// REBATE SUMMARY  (for user dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export interface IRebateSummary {
  claimableAmount: number;
  pendingAmount:   number;
  claimedTotal:    number;
  /** Items available to claim right now */
  claimableItems:  IRebate[];
}
