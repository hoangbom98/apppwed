-- ============================================================================
-- Migration: fix_ops_userid_type_add_securitylog_severity
-- Date: 2024-12-20
-- Description:
--   1. Fix OpsUserSegment.userId: INT → VARCHAR(30) to hold CUIDs from project DBs
--   2. Fix OpsChurnAlert.userId: INT → VARCHAR(30) to hold CUIDs from project DBs
--   3. Add SecurityLog.severity: VARCHAR(20) field (used by clean-security-logs cron)
--   4. Add index on SecurityLog(severity, createdAt)
-- ============================================================================

-- Step 1: Fix OpsUserSegment.userId type
ALTER TABLE `ops_user_segments` MODIFY COLUMN `userId` VARCHAR(30) NOT NULL;

-- Update unique constraint (must drop & re-add because column type changed)
ALTER TABLE `ops_user_segments` DROP INDEX `ops_user_segments_project_userId_key`;
ALTER TABLE `ops_user_segments` ADD UNIQUE INDEX `ops_user_segments_project_userId_key` (`project`, `userId`);

-- Step 2: Fix OpsChurnAlert.userId type
ALTER TABLE `ops_churn_alerts` MODIFY COLUMN `userId` VARCHAR(30) NOT NULL;

-- Step 3: Add severity to SecurityLog
ALTER TABLE `security_logs` ADD COLUMN `severity` VARCHAR(20) NULL DEFAULT 'medium' AFTER `event`;

-- Step 4: Add index on severity + createdAt for cleanup queries
CREATE INDEX `security_logs_severity_createdAt_idx` ON `security_logs` (`severity`, `createdAt`);

-- Prisma migration record
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES (
  REPLACE(UUID(), '-', ''),
  'fix_ops_userid_type_add_securitylog_severity',
  NOW(),
  '20241220_fix_ops_userid_type_add_securitylog_severity',
  NULL, NULL, NOW(), 1
);
