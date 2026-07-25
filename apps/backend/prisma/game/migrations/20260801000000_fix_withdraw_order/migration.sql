-- Migration: fix_withdraw_order
-- Applied to: game_db
-- Description: Ensure net_amount column exists on withdraw_orders.
-- The column already exists as 'netAmount' from the init migration.
-- This migration is marked --applied via prisma migrate resolve to avoid re-execution.
-- If applying from scratch on a fresh DB, the init migration already covers this column.
SELECT 1;
