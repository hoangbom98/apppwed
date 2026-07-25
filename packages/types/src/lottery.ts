/**
 * @lkvip/types — src/lottery.ts
 *
 * Lottery domain types — replaces BoYue caipiao_kj / caipiao_touzhu / caipiao_issue.
 *
 * Usage:
 *   import type { ILotteryDraw, ILotteryBet, ILotteryType } from '@lkvip/types';
 */

// ─────────────────────────────────────────────────────────────────────────────
// LOTTERY TYPE  (product catalogue)
// ─────────────────────────────────────────────────────────────────────────────

export interface ILotteryType {
  id:          string;
  /** Short machine key: PC28 | MARK6 | K3 | KENO | TX1M … */
  code:        string;
  name:        string;
  description: string | null;
  icon:        string | null;
  status:      'active' | 'inactive';
  config:      LotteryTypeConfig | null;
  sortOrder:   number;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface LotteryTypeConfig {
  /** Seconds between draws (e.g. 300 = 5 min) */
  drawInterval?: number;
  maxBet?:       number;
  minBet?:       number;
  betTypes?:     string[];
  /** Max number a result can contain */
  maxNumber?:    number;
  resultCount?:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOTTERY DRAW  (BoYue: caipiao_kj / caipiao_issue)
// ─────────────────────────────────────────────────────────────────────────────

export interface ILotteryDraw {
  id:             string;
  typeId:         string;
  /** Unique period code: e.g. LT20260101001 */
  period:         string;
  drawTime:       Date;
  isClosed:       boolean;
  resultPreset:   string | null;  // Admin preset before draw
  resultOfficial: string | null;  // Official result after draw, e.g. "1,3,5"
  /** WAITING | DRAWN | SETTLED | CANCELLED */
  status:         string;
  totalBetAmount: number;
  totalPayout:    number;
  createdAt:      Date;
  updatedAt:      Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOTTERY BET  (BoYue: caipiao_touzhu)
// ─────────────────────────────────────────────────────────────────────────────

export interface ILotteryBet {
  id:        string;
  userId:    string;
  drawId:    string;
  typeId:    string;
  /** Play type key: TAI | XIU | ODD | EVEN | NUMBER | etc. */
  betType:   string;
  betChoice: string | null;  // e.g. "3,5"
  amount:    number;
  odds:      number;
  payout:    number;
  /** PENDING | WIN | LOSE | CANCELLED */
  status:    string;
  settledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// ODDS SETTING  (BoYue: caipiao_wanfa rate config)
// ─────────────────────────────────────────────────────────────────────────────

export interface IOddsSetting {
  id:       string;
  gameType: string;
  rate:     number;
  minBet:   number;
  maxBet:   number;
}
