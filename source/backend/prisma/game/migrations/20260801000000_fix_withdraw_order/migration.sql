-- Migration: fix WithdrawOrder.netAmount to have a default of 0
-- Previously required (no default), now defaults to 0 so INSERT without netAmount works

ALTER TABLE `withdraw_orders`
  MODIFY COLUMN `netAmount` DECIMAL(18,2) NOT NULL DEFAULT 0;
