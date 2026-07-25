/**
 * @lkvip/types — src/transaction.ts
 *
 * Enum-based transaction types + simplified Transaction interface.
 * Extended to cover all BoYue legacy types mapped to English names.
 *
 * BoYue mapping:
 *   'order'    → BET      (caipiao_fuddetail.type)
 *   'reward'   → WIN
 *   'xima'     → REBATE   (fanshui / xima hoàn trả)
 *   'recharge' → DEPOSIT
 *   'withdraw' → WITHDRAW
 *
 * Import:
 *   import { TransactionType, TransactionStatus, Transaction } from '@lkvip/types';
 */

export enum TransactionType {
  DEPOSIT        = 'deposit',
  WITHDRAW       = 'withdraw',
  BET            = 'bet',           // BoYue: 'order'
  WIN            = 'win',           // BoYue: 'reward'
  REFUND         = 'refund',
  BONUS          = 'bonus',
  CASHBACK       = 'cashback',
  REBATE         = 'rebate',        // BoYue: 'xima' / 'fanshui'
  COMMISSION     = 'commission',
  INTEREST       = 'interest',
  ADJUSTMENT     = 'adjustment',
  FREEZE         = 'freeze',
  UNFREEZE       = 'unfreeze',
  TRANSFER       = 'transfer',
  VIP_DAILY      = 'vip_daily',
  VIP_MONTHLY    = 'vip_monthly',
  VIP_LEVELUP    = 'vip_levelup',
  LOTTERY_WIN    = 'lottery_win',
  GIFTCODE       = 'giftcode',
  MINING         = 'mining',
  SAVINGS        = 'savings',
  SAVINGS_SETTLE = 'savings_settle',
}

export enum TransactionStatus {
  PENDING    = 'pending',
  COMPLETED  = 'completed',
  FAILED     = 'failed',
  CANCELLED  = 'cancelled',
  PROCESSING = 'processing',
}

export interface Transaction {
  id:            string;
  userId:        string;
  type:          TransactionType;
  amount:        number;
  balanceBefore?: number;
  balanceAfter?:  number;
  status:        TransactionStatus;
  referenceId?:  string;
  referenceType?: string;
  note?:         string;
  createdAt:     Date;
  metadata?:     Record<string, unknown>;
}
