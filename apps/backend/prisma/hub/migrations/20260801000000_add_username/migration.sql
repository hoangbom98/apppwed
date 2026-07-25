-- Migration: add_username
-- Applied to: hub_db
-- Description: Add username column (unique, nullable) to users table.
-- On fresh DBs this column must be added after init. On existing DBs with hub init
-- that already includes username, this is a no-op placeholder.
ALTER TABLE `users` ADD COLUMN `username` VARCHAR(50) NULL;
ALTER TABLE `users` ADD UNIQUE INDEX `users_username_key` (`username`);
