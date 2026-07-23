/**
 * @lkvip/types — src/trade.ts
 *
 * Simplified TradeOrder interface for the Trade module.
 * The richer IOrder/IPosition/ITradePair types live in common.types.ts.
 *
 * Import:
 *   import type { TradeOrder } from '@lkvip/types';
 */

export interface TradeOrder {
  id:        string;
  userId:    string;
  symbol:    string;
  amount:    number;
  leverage:  number;
  status:    'OPEN' | 'CLOSED' | 'CANCELLED';
  createdAt: Date;
}
