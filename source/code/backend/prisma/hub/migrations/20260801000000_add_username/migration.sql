-- Migration: add_username
-- Applied to: hub_db
-- Description: Add username column (unique, nullable) to users table if not present

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `username` VARCHAR(50) NULL,
  ADD UNIQUE INDEX IF NOT EXISTS `users_username_key` (`username`);
