-- ============================================================
-- Migration: standardize_decimal_add_wallet_version (sports_db)
-- Changes:
--   1. All financial DECIMAL columns upgraded from (18,2) to (19,4)
--   2. User.version added for Optimistic Locking
--   3. Transaction.referenceId becomes UNIQUE (Idempotency key)
-- ============================================================

-- 1. User wallet fields
ALTER TABLE `users`
  MODIFY `balance`      DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `frozen`       DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `total_deposit` DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `total_bet`    DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `total_win`    DECIMAL(19,4) NOT NULL DEFAULT 0,
  ADD COLUMN `version`  INT NOT NULL DEFAULT 0 COMMENT 'Optimistic lock counter';

-- 2. Transactions: referenceId UNIQUE
ALTER TABLE `transactions`
  MODIFY `amount`        DECIMAL(19,4) NOT NULL,
  MODIFY `balance_before` DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `balance_after`  DECIMAL(19,4) NOT NULL DEFAULT 0;

ALTER TABLE `transactions`
  ADD UNIQUE INDEX `transactions_referenceId_key` (`reference_id`);

-- 3. Deposit/Withdraw orders
ALTER TABLE `deposit_orders`  MODIFY `amount` DECIMAL(19,4) NOT NULL;
ALTER TABLE `withdraw_orders` MODIFY `amount` DECIMAL(19,4) NOT NULL;

-- 4. BetSlip
ALTER TABLE `bet_slips` MODIFY `stake` DECIMAL(19,4) NOT NULL, MODIFY `potential_win` DECIMAL(19,4) NOT NULL, MODIFY `actual_payout` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `cashout_value` DECIMAL(19,4) NULL;

-- 5. Promotions
ALTER TABLE `promotions`       MODIFY `value` DECIMAL(19,4) NOT NULL, MODIFY `min_bet` DECIMAL(19,4) NULL;
ALTER TABLE `promotion_claims` MODIFY `amount` DECIMAL(19,4) NOT NULL;
