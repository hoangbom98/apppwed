/**
 * @lkvip/constants — enums.ts
 *
 * Single source-of-truth for every string enum used across all LKVIP projects.
 * Replaces magic string literals scattered in DB, controllers, and workers.
 *
 * Naming convention: SCREAMING_SNAKE_CASE for enum keys, kebab-case for values.
 * Values are intentionally short lowercase strings (stored in MySQL VARCHAR cols).
 *
 * BoYue legacy mapping (for migration reference):
 *   caipiao_fuddetail.type 'order'   → TransactionType.BET
 *   caipiao_fuddetail.type 'reward'  → TransactionType.WIN
 *   caipiao_fuddetail.type 'xima'    → TransactionType.REBATE
 *   caipiao_fuddetail.type 'recharge'→ TransactionType.DEPOSIT
 *   caipiao_fanshui / xima           → RebateStatus.*
 *   caipiao_group (VIP group)        → VipTier.*
 *   caipiao_kj (kaijiang / draw)     → DrawStatus.*
 *   caipiao_touzhu (bet)             → BetStatus.*
 *   caipiao_yeb (yuebao)             → SavingsStatus.*
 *   caipiao_agent_relation           → AgentStatus.*
 */

// ─────────────────────────────────────────────────────────────────────────────
// WALLET & TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/** All possible transaction types in the LKVIP ledger. */
export const TransactionType = {
  DEPOSIT:        'deposit',
  WITHDRAW:       'withdraw',
  BET:            'bet',          // BoYue: 'order'
  WIN:            'win',          // BoYue: 'reward'
  REFUND:         'refund',
  BONUS:          'bonus',
  CASHBACK:       'cashback',
  REBATE:         'rebate',       // BoYue: 'xima' / 'fanshui'
  COMMISSION:     'commission',
  INTEREST:       'interest',     // SavingsVault / Yuebao daily interest
  ADJUSTMENT:     'adjustment',   // Admin manual adjustment
  FREEZE:         'freeze',       // Funds locked in pending withdrawal
  UNFREEZE:       'unfreeze',
  TRANSFER:       'transfer',     // Peer-to-peer internal transfer
  VIP_DAILY:      'vip_daily',    // VIP daily login reward
  VIP_MONTHLY:    'vip_monthly',  // VIP monthly level-up bonus
  VIP_LEVELUP:    'vip_levelup',  // One-time VIP level-up reward
  LOTTERY_WIN:    'lottery_win',
  GIFTCODE:       'giftcode',     // BoYue: caipiao_giftcode redemption
  MINING:         'mining',       // Mining machine daily income
  SAVINGS:        'savings',      // SavingsVault principal deposit
  SAVINGS_SETTLE: 'savings_settle', // SavingsVault maturity payout
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING:    'pending',
  COMPLETED:  'completed',
  FAILED:     'failed',
  CANCELLED:  'cancelled',
  PROCESSING: 'processing',
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

// ─────────────────────────────────────────────────────────────────────────────
// DEPOSIT / WITHDRAW ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export const DepositStatus = {
  PENDING:    'pending',
  SUCCESS:    'success',
  FAILED:     'failed',
  EXPIRED:    'expired',
  CANCELLED:  'cancelled',
} as const;

export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus];

export const WithdrawStatus = {
  PENDING:    'pending',
  PROCESSING: 'processing',
  SUCCESS:    'success',
  FAILED:     'failed',
  CANCELLED:  'cancelled',
  REJECTED:   'rejected',
} as const;

export type WithdrawStatus = (typeof WithdrawStatus)[keyof typeof WithdrawStatus];

// ─────────────────────────────────────────────────────────────────────────────
// LOTTERY  (replaces BoYue caipiao_kj / caipiao_touzhu)
// ─────────────────────────────────────────────────────────────────────────────

/** Lottery draw lifecycle. BoYue: caipiao_issue.status */
export const DrawStatus = {
  WAITING:   'WAITING',   // Open for bets
  DRAWN:     'DRAWN',     // Result submitted, settlement pending
  SETTLED:   'SETTLED',   // All bets settled, payouts done
  CANCELLED: 'CANCELLED', // Draw void — all bets refunded
} as const;

export type DrawStatus = (typeof DrawStatus)[keyof typeof DrawStatus];

/** Individual lottery bet outcome. BoYue: caipiao_touzhu.status */
export const BetStatus = {
  PENDING:   'PENDING',
  WIN:       'WIN',
  LOSE:      'LOSE',
  CANCELLED: 'CANCELLED',
  REFUNDED:  'REFUNDED',
} as const;

export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus];

// ─────────────────────────────────────────────────────────────────────────────
// REBATE  (replaces BoYue caipiao_fanshui / xima)
// ─────────────────────────────────────────────────────────────────────────────

/** Rebate record lifecycle. BoYue: caipiao_fanshui.status */
export const RebateStatus = {
  PENDING:   'pending',   // Calculated, not yet claimable (T+0 night)
  CLAIMABLE: 'claimable', // User can claim (T+1 after cron)
  CLAIMED:   'claimed',   // User claimed
  EXPIRED:   'expired',   // Unclaimed after 7 days
} as const;

export type RebateStatus = (typeof RebateStatus)[keyof typeof RebateStatus];

/** Game type key used in rebate calculations. */
export const GameTypeKey = {
  LIVE:    'live',    // Live casino (Evolution, Goldgate)
  SLOT:    'slot',    // Slot / RNG / Fishing (CQ9, PG, JILI)
  LOTTERY: 'lottery', // Lottery products (PC28, KENO)
  SPORTS:  'sports',  // Sports / Esports (BTI, SBO)
} as const;

export type GameTypeKey = (typeof GameTypeKey)[keyof typeof GameTypeKey];

// ─────────────────────────────────────────────────────────────────────────────
// VIP  (replaces BoYue caipiao_group / yzz_level_config)
// ─────────────────────────────────────────────────────────────────────────────

export const VipTier = {
  MEMBER:   'member',   // Default — no deposit required
  V1:       'v1',
  V2:       'v2',
  V3:       'v3',
  V4:       'v4',
  V5:       'v5',
  V6:       'v6',
  V7:       'v7',
  V8:       'v8',
  V9:       'v9',
  V10:      'v10',
} as const;

export type VipTier = (typeof VipTier)[keyof typeof VipTier];

// ─────────────────────────────────────────────────────────────────────────────
// AGENT  (replaces BoYue caipiao_agent_relation / caipiao_agent_apply)
// ─────────────────────────────────────────────────────────────────────────────

export const AgentStatus = {
  ACTIVE:    'active',
  SUSPENDED: 'suspended',
  PENDING:   'pending',   // Application submitted, awaiting approval
  REJECTED:  'rejected',
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export const CommissionStatus = {
  PENDING:   'pending',
  PAID:      'paid',
  CANCELLED: 'cancelled',
} as const;

export type CommissionStatus = (typeof CommissionStatus)[keyof typeof CommissionStatus];

// ─────────────────────────────────────────────────────────────────────────────
// SAVINGS VAULT / YUEBAO  (replaces BoYue caipiao_yeb_record / yzz_yuebao_holding)
// ─────────────────────────────────────────────────────────────────────────────

export const SavingsStatus = {
  ACTIVE:    'active',
  COMPLETED: 'completed', // Matured & settled
  CANCELLED: 'cancelled',
} as const;

export type SavingsStatus = (typeof SavingsStatus)[keyof typeof SavingsStatus];

// ─────────────────────────────────────────────────────────────────────────────
// GIFTCODE  (replaces BoYue caipiao_giftcode)
// ─────────────────────────────────────────────────────────────────────────────

export const GiftCodeStatus = {
  ACTIVE:   'active',
  INACTIVE: 'inactive',
  DEPLETED: 'depleted', // All uses consumed
  EXPIRED:  'expired',
} as const;

export type GiftCodeStatus = (typeof GiftCodeStatus)[keyof typeof GiftCodeStatus];

export const GiftCodeRewardType = {
  BALANCE:   'balance',   // Direct cash credit
  BONUS:     'bonus',     // Wager-locked bonus
  FREE_SPIN: 'free_spin', // Lucky wheel free spins
  VIP_EXP:   'vip_exp',   // VIP experience points
} as const;

export type GiftCodeRewardType = (typeof GiftCodeRewardType)[keyof typeof GiftCodeRewardType];

// ─────────────────────────────────────────────────────────────────────────────
// PROMOTION / CAMPAIGN  (replaces BoYue caipiao_activity / caipiao_huodong)
// ─────────────────────────────────────────────────────────────────────────────

export const PromotionStatus = {
  ACTIVE:   'active',
  INACTIVE: 'inactive',
  EXPIRED:  'expired',
} as const;

export type PromotionStatus = (typeof PromotionStatus)[keyof typeof PromotionStatus];

export const PromotionType = {
  WELCOME:        'welcome',
  DEPOSIT_BONUS:  'deposit',
  CASHBACK:       'cashback',
  FREE_SPIN:      'free_spin',
  REFERRAL:       'referral',
  EVENT:          'event',
  REBATE:         'rebate',
} as const;

export type PromotionType = (typeof PromotionType)[keyof typeof PromotionType];

// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL / REVIEW  (replaces BoYue shenhe / jinjishenhe)
// ─────────────────────────────────────────────────────────────────────────────

export const ApprovalStatus = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];
