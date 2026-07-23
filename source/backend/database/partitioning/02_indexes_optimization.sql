-- ============================================================
-- Additional indexes for high-traffic query patterns
-- Run after initial deploy on production.
-- Safe to run multiple times (uses IF NOT EXISTS pattern).
-- ============================================================

-- ── game_db ──────────────────────────────────────────────────────────────────
USE game_db;

-- Transactions: most common WHERE clauses
ALTER TABLE `transactions`
  ADD INDEX IF NOT EXISTS `idx_tx_user_type_created` (`userId`, `type`, `createdAt`),
  ADD INDEX IF NOT EXISTS `idx_tx_refid`             (`referenceId`);

-- DepositOrder / WithdrawOrder: admin approval queues
ALTER TABLE `deposit_orders`
  ADD INDEX IF NOT EXISTS `idx_dep_status_created` (`status`, `createdAt`),
  ADD INDEX IF NOT EXISTS `idx_dep_gateway_status` (`gatewayId`, `status`);

ALTER TABLE `withdraw_orders`
  ADD INDEX IF NOT EXISTS `idx_wd_status_created`  (`status`, `createdAt`),
  ADD INDEX IF NOT EXISTS `idx_wd_gateway_status`  (`gatewayId`, `status`);

-- GameSession: active sessions lookup
ALTER TABLE `game_sessions`
  ADD INDEX IF NOT EXISTS `idx_gs_user_status`     (`userId`, `status`),
  ADD INDEX IF NOT EXISTS `idx_gs_provider_status` (`provider`, `status`);

-- ── trade_db ─────────────────────────────────────────────────────────────────
USE trade_db;

-- Orders: active order book scan
ALTER TABLE `orders`
  ADD INDEX IF NOT EXISTS `idx_ord_sym_side_status` (`symbolId`, `side`, `status`),
  ADD INDEX IF NOT EXISTS `idx_ord_user_status`     (`userId`, `status`);

-- Positions: margin/liquidation scan (runs every 10s)
ALTER TABLE `positions`
  ADD INDEX IF NOT EXISTS `idx_pos_user_status`   (`userId`, `status`),
  ADD INDEX IF NOT EXISTS `idx_pos_liq_price`     (`liquidationPrice`, `status`);

-- PriceHistory: chart data (very high insert rate)
ALTER TABLE `price_history`
  ADD INDEX IF NOT EXISTS `idx_ph_sym_interval_ts` (`symbolId`, `interval`, `timestamp`);

-- Investments: daily profit distribution scan
ALTER TABLE `investments`
  ADD INDEX IF NOT EXISTS `idx_inv_status_end` (`status`, `endDate`);

-- ── admin_db ─────────────────────────────────────────────────────────────────
USE admin_db;

-- AuditLog: admin panel filters
ALTER TABLE `audit_logs`
  ADD INDEX IF NOT EXISTS `idx_al_project_action` (`project`, `action`, `createdAt`);

-- SecurityLog: threat detection dashboard
ALTER TABLE `security_logs`
  ADD INDEX IF NOT EXISTS `idx_sl_event_sev_created` (`event`, `severity`, `createdAt`);

-- OpsUserSegment: marketing campaign targeting
ALTER TABLE `ops_user_segments`
  ADD INDEX IF NOT EXISTS `idx_ous_project_seg_clv` (`project`, `segment`, `clv`);
