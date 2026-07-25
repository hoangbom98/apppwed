-- ============================================================
-- Migration: standardize_decimal_add_wallet_version (trade_db)
-- Changes:
--   1. All financial DECIMAL columns upgraded from (18,2) to (19,4)
--   2. Wallet.version added for Optimistic Locking
--   3. Transaction.referenceId becomes UNIQUE (Idempotency key)
-- ============================================================

-- 1. Wallet
ALTER TABLE `wallets`
  MODIFY `balance` DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `frozen`  DECIMAL(19,4) NOT NULL DEFAULT 0,
  ADD COLUMN `version` INT NOT NULL DEFAULT 0 COMMENT 'Optimistic lock counter';

-- 2. Transactions: referenceId UNIQUE
ALTER TABLE `transactions`
  MODIFY `amount`        DECIMAL(19,4) NOT NULL,
  MODIFY `balance_before` DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `balance_after`  DECIMAL(19,4) NOT NULL;

ALTER TABLE `transactions`
  ADD UNIQUE INDEX `transactions_referenceId_key` (`reference_id`);

-- 3. Withdrawal / Deposit
ALTER TABLE `withdrawals`
  MODIFY `amount`     DECIMAL(19,4) NOT NULL,
  MODIFY `fee`        DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `net_amount` DECIMAL(19,4) NOT NULL;

ALTER TABLE `deposits` MODIFY `amount` DECIMAL(19,4) NOT NULL;

-- 4. Orders (price fields to 19,8 for high-precision crypto)
ALTER TABLE `orders`
  MODIFY `price`        DECIMAL(19,8) NOT NULL,
  MODIFY `quantity`     DECIMAL(19,8) NOT NULL,
  MODIFY `executed_qty` DECIMAL(19,8) NOT NULL DEFAULT 0,
  MODIFY `avg_price`    DECIMAL(19,8) NULL,
  MODIFY `stop_price`   DECIMAL(19,8) NULL;

-- 5. Investment tables
ALTER TABLE `investment_packages`  MODIFY `min_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `max_amount` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `investments`          MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `profit_paid` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `investment_schedules` MODIFY `amount` DECIMAL(19,4) NOT NULL;
ALTER TABLE `commission_logs`      MODIFY `amount` DECIMAL(19,4) NOT NULL;

-- 6. Yuebao / Mining / Voucher / Prize / Shop
ALTER TABLE `yuebao_products`   MODIFY `min_amount` DECIMAL(19,4) NOT NULL, MODIFY `max_amount` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `yuebao_investments` MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `profit_paid` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `mining_machines`   MODIFY `price` DECIMAL(19,4) NOT NULL, MODIFY `day_income` DECIMAL(19,4) NOT NULL, MODIFY `cost` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `mining_investments` MODIFY `deposit` DECIMAL(19,4) NOT NULL, MODIFY `day_income` DECIMAL(19,4) NOT NULL, MODIFY `profit_paid` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `vouchers`          MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `min_purchase` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `prize_configs`     MODIFY `amount` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `news_articles`     MODIFY `read_reward` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `news_view_logs`    MODIFY `reward` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `shop_items`        MODIFY `points` DECIMAL(19,4) NOT NULL, MODIFY `cash_value` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `shop_orders`       MODIFY `points` DECIMAL(19,4) NOT NULL;
ALTER TABLE `users`             MODIFY `integral` DECIMAL(19,4) NOT NULL DEFAULT 0;
