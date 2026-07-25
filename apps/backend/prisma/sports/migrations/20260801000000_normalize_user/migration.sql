-- Migration: normalize_user
-- Applied to: sports_db
-- Description: Add username column (unique, nullable) to users table.
-- The init migration already includes username; this migration is a no-op on existing DBs.
-- On fresh DBs the column is already created by the init migration (20250101000000_init_sports).
SELECT 1;
