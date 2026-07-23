-- Migration: add username field to hub users table
-- Adds unique username column (nullable, max 50 chars) + index

ALTER TABLE `users`
  ADD COLUMN `username` VARCHAR(50) NULL AFTER `phone`,
  ADD UNIQUE INDEX `users_username_key` (`username`);
