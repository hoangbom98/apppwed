-- ============================================================
-- Migration: standardize_decimal (dating_db)
-- Changes: All financial DECIMAL columns upgraded from (18,2) to (19,4)
-- ============================================================

ALTER TABLE `users`          MODIFY `coins` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `streamers`      MODIFY `price_per_minute` DECIMAL(19,4) NOT NULL, MODIFY `total_earnings` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `videos`         MODIFY `price` DECIMAL(19,4) NULL;
ALTER TABLE `calls`          MODIFY `cost` DECIMAL(19,4) NULL;
ALTER TABLE `live_streams`   MODIFY `coins_earned` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `gifts`          MODIFY `coin_cost` DECIMAL(19,4) NOT NULL;
ALTER TABLE `gift_sends`     MODIFY `coin_value` DECIMAL(19,4) NOT NULL;
ALTER TABLE `vip_plans`      MODIFY `price` DECIMAL(19,4) NOT NULL, MODIFY `coin_bonus` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE `transactions`   MODIFY `amount` DECIMAL(19,4) NOT NULL, MODIFY `coins` DECIMAL(19,4) NULL;
ALTER TABLE `dating_missions` MODIFY `reward` DECIMAL(19,4) NOT NULL DEFAULT 0;
