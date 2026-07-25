-- ============================================================
-- Migration: standardize_decimal_add_wallet_version (admin_db)
-- Changes:
--   1. All financial DECIMAL columns upgraded from (18,2) to (19,4)
--   2. Wallet.version added for Optimistic Locking
--   3. Transaction.referenceId becomes UNIQUE (Idempotency key)
-- ============================================================

-- 1. Wallet: balance & frozen to DECIMAL(19,4), add version
ALTER TABLE `wallets`
  MODIFY `balance` DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `frozen`  DECIMAL(19,4) NOT NULL DEFAULT 0,
  ADD COLUMN `version` INT NOT NULL DEFAULT 0 COMMENT 'Optimistic lock counter';

-- 2. Transaction: amount & fee to DECIMAL(19,4), referenceId UNIQUE
ALTER TABLE `transactions`
  MODIFY `amount` DECIMAL(19,4) NOT NULL,
  MODIFY `fee`    DECIMAL(19,4) NOT NULL DEFAULT 0;

-- Add unique index on referenceId only if not already present
ALTER TABLE `transactions`
  ADD UNIQUE INDEX `transactions_referenceId_key` (`referenceId`);

-- 3. Deposit/Withdraw orders
ALTER TABLE `deposit_orders`
  MODIFY `amount` DECIMAL(19,4) NOT NULL;

ALTER TABLE `withdraw_orders`
  MODIFY `amount` DECIMAL(19,4) NOT NULL;

-- 4. Internal transfers
ALTER TABLE `internal_transfers`
  MODIFY `amount` DECIMAL(19,4) NOT NULL,
  MODIFY `fee`    DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 5. FeeConfig
ALTER TABLE `fee_configs`
  MODIFY `min_amount` DECIMAL(19,4) NULL,
  MODIFY `max_amount` DECIMAL(19,4) NULL,
  MODIFY `max_fee`    DECIMAL(19,4) NULL;

-- 6. ProjectBalance
ALTER TABLE `project_balances`
  MODIFY `balance`   DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `total_bet` DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `total_win` DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `total_fee` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 7. InternalLoan
ALTER TABLE `internal_loans`
  MODIFY `amount`        DECIMAL(19,4) NOT NULL,
  MODIFY `total_interest` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 8. FeeLogs
ALTER TABLE `fee_logs`
  MODIFY `gross_amount` DECIMAL(19,4) NOT NULL,
  MODIFY `fee_amount`   DECIMAL(19,4) NOT NULL,
  MODIFY `net_amount`   DECIMAL(19,4) NOT NULL;

-- 9. Referrals / Commissions
ALTER TABLE `referrals`   MODIFY `commission` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `commissions` MODIFY `amount`     DECIMAL(19,4) NOT NULL;

-- 10. VipConfig / VipHistory
ALTER TABLE `vip_configs`   MODIFY `bet_required` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `reward_amount` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `vip_histories` MODIFY `reward_amount` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 11. OpsUserSegment / OpsExpenseRequest
ALTER TABLE `ops_user_segments`    MODIFY `monetary` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `clv` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `avg_monthly` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `ops_expense_requests` MODIFY `amount`   DECIMAL(19,4) NOT NULL;
