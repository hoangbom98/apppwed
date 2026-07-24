-- Migration: fix_withdraw_order
-- Applied to: game_db
-- Description: Add netAmount column to withdraw_orders table if not present
--              (netAmount = amount - fee, computed by application layer)

ALTER TABLE `withdraw_orders`
  ADD COLUMN IF NOT EXISTS `net_amount` DECIMAL(18,2) NOT NULL DEFAULT 0
    COMMENT 'amount minus fee; set by application';
