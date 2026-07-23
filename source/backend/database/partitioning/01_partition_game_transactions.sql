-- ============================================================
-- Partition game_db.transactions by YEAR(created_at)
-- Run ONCE on production MySQL after deploying v2.
-- Requires: NO foreign keys referencing this table (MySQL limitation).
-- ============================================================

USE game_db;

-- Step 1: Recreate table with RANGE partition by year
-- NOTE: MySQL requires the partition key to be part of any UNIQUE key.
-- The id column uses CUID (VARCHAR), so we use created_at as partition key.
-- We add created_at to the primary key to satisfy MySQL's requirement.

-- Step 1a: Rename existing table for safety
ALTER TABLE `transactions` RENAME TO `transactions_old`;

-- Step 1b: Create new partitioned table
CREATE TABLE `transactions` (
  `id`           VARCHAR(30)   NOT NULL,
  `userId`       VARCHAR(30)   NOT NULL,
  `type`         VARCHAR(30)   NOT NULL,
  `amount`       DECIMAL(18,2) NOT NULL,
  `balanceAfter` DECIMAL(18,2) NULL,
  `status`       VARCHAR(20)   NOT NULL DEFAULT 'completed',
  `note`         VARCHAR(500)  NULL,
  `referenceId`  VARCHAR(60)   NULL,
  `createdAt`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`, `createdAt`),   -- createdAt required for RANGE partition
  INDEX `idx_tx_user_created` (`userId`, `createdAt`),
  INDEX `idx_tx_type_created` (`type`, `createdAt`),
  INDEX `idx_tx_status`       (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(`createdAt`)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Step 1c: Copy data from old table
INSERT INTO `transactions` SELECT * FROM `transactions_old`;

-- Step 1d: Drop old table after verification
-- DROP TABLE `transactions_old`;   -- Uncomment after verifying row counts match

-- ============================================================
-- Partition admin_db.audit_logs by YEAR (high-volume table)
-- ============================================================
USE admin_db;

ALTER TABLE `audit_logs`
  PARTITION BY RANGE (YEAR(`createdAt`)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
  );

-- Verify partition info
-- SELECT PARTITION_NAME, TABLE_ROWS FROM information_schema.PARTITIONS
-- WHERE TABLE_SCHEMA = 'game_db' AND TABLE_NAME = 'transactions';
