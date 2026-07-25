-- ============================================================
-- Migration: standardize_decimal_add_wallet_version (game_db)
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

-- 2. Transaction: amount to DECIMAL(19,4), referenceId UNIQUE
ALTER TABLE `transactions`
  MODIFY `amount`        DECIMAL(19,4) NOT NULL,
  MODIFY `balance_before` DECIMAL(19,4) NOT NULL,
  MODIFY `balance_after`  DECIMAL(19,4) NOT NULL;

ALTER TABLE `transactions`
  ADD UNIQUE INDEX `transactions_referenceId_key` (`reference_id`);

-- 3. Deposit/Withdraw orders
ALTER TABLE `deposit_orders`
  MODIFY `amount` DECIMAL(19,4) NOT NULL,
  MODIFY `fee`    DECIMAL(19,4) NOT NULL DEFAULT 0;

ALTER TABLE `withdraw_orders`
  MODIFY `amount`     DECIMAL(19,4) NOT NULL,
  MODIFY `fee`        DECIMAL(19,4) NOT NULL DEFAULT 0,
  MODIFY `net_amount` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 4. Referral / Agent / Commission
ALTER TABLE `referrals`   MODIFY `bonus`            DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `agents`      MODIFY `total_commission` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `commissions` MODIFY `total_bet`  DECIMAL(19,4) NOT NULL DEFAULT 0,
                          MODIFY `net_profit` DECIMAL(19,4) NOT NULL DEFAULT 0,
                          MODIFY `amount`     DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 5. VIP
ALTER TABLE `vip_levels` MODIFY `min_total_deposit` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `withdraw_limit` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `user_vips`  MODIFY `total_deposit` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `total_bet` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 6. Cashback / Interest
ALTER TABLE `cashback_history`  MODIFY `amount` DECIMAL(19,4) NOT NULL;
ALTER TABLE `interest_history`  MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `balance` DECIMAL(19,4) NOT NULL;

-- 7. Promotions
ALTER TABLE `promotions`       MODIFY `min_deposit` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `max_bonus` DECIMAL(19,4) NULL;
ALTER TABLE `promotion_claims` MODIFY `bonus_amount` DECIMAL(19,4) NOT NULL, MODIFY `wagered` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `wager_needed` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 8. GameSession / GameTransaction / GameWager
ALTER TABLE `game_sessions`     MODIFY `bet_amount` DECIMAL(19,4) NOT NULL, MODIFY `win_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `net_pnl` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `game_transactions` MODIFY `bet_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `valid_bet_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `prize_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `balance_before` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `balance_after` DECIMAL(19,4) NOT NULL;
ALTER TABLE `game_wagers`       MODIFY `bet_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `valid_bet_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `prize_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `tip_amount` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 9. Lottery
ALTER TABLE `lottery_draws` MODIFY `total_bet_amount` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `total_payout` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `lottery_bets`  MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `payout` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 10. VirtualAccount
ALTER TABLE `virtual_accounts` MODIFY `expected_amount` DECIMAL(19,4) NULL, MODIFY `actual_amount` DECIMAL(19,4) NULL;

-- 11. LkvipTransaction / WithdrawalRequest
ALTER TABLE `lkvip_transactions`  MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `balance_before` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `balance_after` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `withdrawal_requests` MODIFY `amount` DECIMAL(19,4) NOT NULL;

-- 12. BetStats / Rebate
ALTER TABLE `bet_stats` MODIFY `valid_bet` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `total_bet` DECIMAL(19,4) NOT NULL DEFAULT 0, MODIFY `total_win` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `rebates`   MODIFY `valid_bet` DECIMAL(19,4) NOT NULL, MODIFY `amount` DECIMAL(19,4) NOT NULL;

-- 13. Savings / Mining
ALTER TABLE `savings_vault_products` MODIFY `min_amount` DECIMAL(19,4) NOT NULL, MODIFY `max_amount` DECIMAL(19,4) NULL;
ALTER TABLE `savings_vault_holdings` MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `profit_paid` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `mining_machines`        MODIFY `price` DECIMAL(19,4) NOT NULL, MODIFY `day_income` DECIMAL(19,4) NOT NULL;
ALTER TABLE `mining_holdings`        MODIFY `deposit` DECIMAL(19,4) NOT NULL, MODIFY `day_income` DECIMAL(19,4) NOT NULL, MODIFY `profit_paid` DECIMAL(19,4) NOT NULL DEFAULT 0;

-- 14. Gamification
ALTER TABLE `checkin_configs`      MODIFY `reward_amount` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `user_checkins`        MODIFY `reward_amount` DECIMAL(19,4) NOT NULL;
ALTER TABLE `mission_templates`    MODIFY `reward_amount` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `lucky_wheel_configs`  MODIFY `spin_cost` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `wheel_prizes`         MODIFY `reward_value` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `spin_history`         MODIFY `reward_value` DECIMAL(19,4) NOT NULL;

-- 15. Gift codes
ALTER TABLE `gift_codes`            MODIFY `reward_amount` DECIMAL(19,4) NOT NULL;
ALTER TABLE `gift_code_redemptions` MODIFY `reward_amount` DECIMAL(19,4) NOT NULL;
