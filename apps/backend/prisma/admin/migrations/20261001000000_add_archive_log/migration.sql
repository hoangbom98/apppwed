-- ArchiveLog — records every cold-storage archive operation
-- Used by the monthly archive cron job to track what was archived to S3/R2
CREATE TABLE IF NOT EXISTS `archive_logs` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `tableName`    VARCHAR(60)  NOT NULL COMMENT 'e.g. transactions, audit_logs',
  `project`      VARCHAR(20)  NOT NULL COMMENT 'game|hub|trade|dating|sports|admin',
  `archiveKey`   VARCHAR(500) NOT NULL COMMENT 'S3/R2 object key, e.g. archives/game/transactions_2025-01.json.gz',
  `recordCount`  INT          NOT NULL DEFAULT 0,
  `sizeBytes`    BIGINT       NULL COMMENT 'compressed file size in bytes',
  `cutoffDate`   DATETIME     NOT NULL COMMENT 'data older than this date was archived',
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'completed',
  `error`        TEXT         NULL,
  `archivedAt`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_archive_logs_project` (`project`),
  INDEX `idx_archive_logs_table`   (`tableName`, `archivedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
