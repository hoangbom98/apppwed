/**
 * @lkvip/types — src/transaction.ts
 *
 * Enum-based transaction types + simplified Transaction interface.
 * Counterpart to the richer ITransaction/TransactionType in payment.types.ts.
 *
 * Import:
 *   import { TransactionType, TransactionStatus, Transaction } from '@lkvip/types';
 */

export enum TransactionType {
  DEPOSIT  = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  BET      = 'BET',
  WIN      = 'WIN',
  BONUS    = 'BONUS',
}

export enum TransactionStatus {
  PENDING   = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED    = 'FAILED',
}

export interface Transaction {
  id:        string;
  userId:    string;
  type:      TransactionType;
  amount:    number;
  status:    TransactionStatus;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}
