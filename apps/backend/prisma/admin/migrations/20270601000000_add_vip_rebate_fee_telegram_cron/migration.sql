-- Migration: add_vip_rebate_fee_telegram_cron
-- Adds tables introduced after 20270101000000_standardize_decimal_add_wallet_version:
--   vip_configs, vip_histories, admin_roles,
--   rebate_rules, rebate_claims,
--   fee_configs, project_balances, internal_loans, fee_logs,
--   cron_jobs, notification_templates, notification_logs,
--   telegram_broadcasts, telegram_auto_replies,
--   third_party_call_logs, third_party_health_snapshots,
--   login_logs, user_sessions, device_fingerprints

-- ── VipConfig ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vip_configs` (
    `id`           INTEGER NOT NULL AUTO_INCREMENT,
    `level`        INTEGER NOT NULL,
    `name`         VARCHAR(50) NOT NULL,
    `betRequired`  DECIMAL(19,4) NOT NULL DEFAULT 0,
    `rewardAmount` DECIMAL(19,4) NOT NULL DEFAULT 0,
    `color`        VARCHAR(20) NULL,
    `iconUrl`      VARCHAR(500) NULL,
    `benefits`     JSON NULL,
    `status`       VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`    DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `vip_configs_level_key` (`level`),
    INDEX `vip_configs_level_idx` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── VipHistory ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vip_histories` (
    `id`           INTEGER NOT NULL AUTO_INCREMENT,
    `userId`       VARCHAR(30) NOT NULL,
    `oldLevel`     INTEGER NOT NULL,
    `newLevel`     INTEGER NOT NULL,
    `rewardAmount` DECIMAL(19,4) NOT NULL DEFAULT 0,
    `project`      VARCHAR(20) NOT NULL DEFAULT 'game',
    `configId`     INTEGER NULL,
    `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `vip_histories_userId_createdAt_idx` (`userId`, `createdAt`),
    INDEX `vip_histories_project_idx` (`project`),
    CONSTRAINT `vip_histories_configId_fkey`
        FOREIGN KEY (`configId`) REFERENCES `vip_configs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── AdminRole ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admin_roles` (
    `id`          INTEGER NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(60) NOT NULL,
    `displayName` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `permissions` JSON NULL,
    `sortOrder`   INTEGER NOT NULL DEFAULT 0,
    `status`      VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `admin_roles_name_key` (`name`),
    INDEX `admin_roles_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add roleId FK to admin_users if not exists
ALTER TABLE `admin_users`
    ADD COLUMN IF NOT EXISTS `roleId` INTEGER NULL,
    ADD INDEX IF NOT EXISTS `admin_users_roleId_idx` (`roleId`);

ALTER TABLE `admin_users`
    ADD CONSTRAINT IF NOT EXISTS `admin_users_roleId_fkey`
        FOREIGN KEY (`roleId`) REFERENCES `admin_roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ── RebateRule ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rebate_rules` (
    `id`         INTEGER NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(150) NOT NULL,
    `gameType`   VARCHAR(30) NULL,
    `rebateRate` DECIMAL(6,4) NOT NULL,
    `minBet`     DECIMAL(18,2) NOT NULL DEFAULT 0,
    `period`     VARCHAR(20) NOT NULL DEFAULT 'daily',
    `project`    VARCHAR(20) NOT NULL DEFAULT 'game',
    `sortOrder`  INTEGER NOT NULL DEFAULT 0,
    `status`     VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`  DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `rebate_rules_project_status_idx` (`project`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── RebateClaim ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rebate_claims` (
    `id`           INTEGER NOT NULL AUTO_INCREMENT,
    `ruleId`       INTEGER NOT NULL,
    `userId`       VARCHAR(30) NOT NULL,
    `project`      VARCHAR(20) NOT NULL DEFAULT 'game',
    `period`       VARCHAR(30) NOT NULL,
    `totalBet`     DECIMAL(18,2) NOT NULL DEFAULT 0,
    `rebateAmount` DECIMAL(18,2) NOT NULL DEFAULT 0,
    `status`       VARCHAR(20) NOT NULL DEFAULT 'pending',
    `approvedBy`   VARCHAR(30) NULL,
    `approvedAt`   DATETIME(3) NULL,
    `note`         TEXT NULL,
    `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`    DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `rebate_claims_ruleId_userId_period_key` (`ruleId`, `userId`, `period`),
    INDEX `rebate_claims_userId_status_idx` (`userId`, `status`),
    INDEX `rebate_claims_project_period_idx` (`project`, `period`),
    CONSTRAINT `rebate_claims_ruleId_fkey`
        FOREIGN KEY (`ruleId`) REFERENCES `rebate_rules`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── FeeConfig ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `fee_configs` (
    `id`          VARCHAR(191) NOT NULL,
    `source`      VARCHAR(20) NOT NULL,
    `txType`      VARCHAR(20) NOT NULL,
    `feeType`     VARCHAR(20) NOT NULL,
    `value`       DECIMAL(8,4) NOT NULL,
    `minAmount`   DECIMAL(19,4) NULL,
    `maxAmount`   DECIMAL(19,4) NULL,
    `maxFee`      DECIMAL(19,4) NULL,
    `isActive`    BOOLEAN NOT NULL DEFAULT true,
    `startDate`   DATETIME(3) NULL,
    `endDate`     DATETIME(3) NULL,
    `description` VARCHAR(255) NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `fee_configs_source_txType_key` (`source`, `txType`),
    INDEX `fee_configs_source_isActive_idx` (`source`, `isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ProjectBalance ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `project_balances` (
    `id`        VARCHAR(191) NOT NULL,
    `source`    VARCHAR(20) NOT NULL,
    `balance`   DECIMAL(19,4) NOT NULL DEFAULT 0,
    `totalBet`  DECIMAL(19,4) NOT NULL DEFAULT 0,
    `totalWin`  DECIMAL(19,4) NOT NULL DEFAULT 0,
    `totalFee`  DECIMAL(19,4) NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `project_balances_source_key` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── InternalLoan ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `internal_loans` (
    `id`            VARCHAR(191) NOT NULL,
    `source`        VARCHAR(20) NOT NULL,
    `amount`        DECIMAL(19,4) NOT NULL,
    `interestRate`  DECIMAL(7,4) NOT NULL,
    `startDate`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate`       DATETIME(3) NULL,
    `status`        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `totalInterest` DECIMAL(19,4) NOT NULL DEFAULT 0,
    `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`     DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `internal_loans_source_status_idx` (`source`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── FeeLog ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `fee_logs` (
    `id`          VARCHAR(191) NOT NULL,
    `userId`      VARCHAR(30) NOT NULL,
    `source`      VARCHAR(20) NOT NULL,
    `txType`      VARCHAR(20) NOT NULL,
    `grossAmount` DECIMAL(19,4) NOT NULL,
    `feeAmount`   DECIMAL(19,4) NOT NULL,
    `netAmount`   DECIMAL(19,4) NOT NULL,
    `referenceId` VARCHAR(60) NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `fee_logs_source_createdAt_idx` (`source`, `createdAt`),
    INDEX `fee_logs_userId_createdAt_idx` (`userId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CronJob ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cron_jobs` (
    `id`          INTEGER NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `command`     VARCHAR(500) NOT NULL,
    `schedule`    VARCHAR(60) NOT NULL,
    `lastRunAt`   DATETIME(3) NULL,
    `nextRunAt`   DATETIME(3) NULL,
    `status`      VARCHAR(20) NOT NULL DEFAULT 'active',
    `log`         TEXT NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `cron_jobs_name_key` (`name`),
    INDEX `cron_jobs_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── NotificationTemplate ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notification_templates` (
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `type`      VARCHAR(60) NOT NULL,
    `name`      VARCHAR(150) NOT NULL,
    `subject`   VARCHAR(255) NULL,
    `content`   TEXT NOT NULL,
    `channel`   VARCHAR(10) NOT NULL DEFAULT 'both',
    `variables` JSON NULL,
    `isActive`  BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `notification_templates_type_key` (`type`),
    INDEX `notification_templates_channel_isActive_idx` (`channel`, `isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── NotificationLog ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notification_logs` (
    `id`         INTEGER NOT NULL AUTO_INCREMENT,
    `templateId` INTEGER NULL,
    `channel`    VARCHAR(10) NOT NULL,
    `recipient`  VARCHAR(255) NOT NULL,
    `subject`    VARCHAR(255) NULL,
    `content`    TEXT NOT NULL,
    `status`     VARCHAR(20) NOT NULL DEFAULT 'pending',
    `error`      TEXT NULL,
    `sentAt`     DATETIME(3) NULL,
    `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `notification_logs_templateId_createdAt_idx` (`templateId`, `createdAt`),
    INDEX `notification_logs_status_createdAt_idx` (`status`, `createdAt`),
    CONSTRAINT `notification_logs_templateId_fkey`
        FOREIGN KEY (`templateId`) REFERENCES `notification_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TelegramBroadcast ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `telegram_broadcasts` (
    `id`          INTEGER NOT NULL AUTO_INCREMENT,
    `target`      VARCHAR(100) NOT NULL,
    `targetName`  VARCHAR(30) NOT NULL DEFAULT 'channel',
    `parseMode`   VARCHAR(10) NOT NULL DEFAULT 'HTML',
    `content`     TEXT NOT NULL,
    `templateKey` VARCHAR(60) NULL,
    `variables`   JSON NULL,
    `status`      VARCHAR(20) NOT NULL DEFAULT 'pending',
    `sentBy`      INTEGER NULL,
    `sentAt`      DATETIME(3) NULL,
    `error`       TEXT NULL,
    `messageId`   INTEGER NULL,
    `scheduledAt` DATETIME(3) NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `telegram_broadcasts_target_status_idx` (`target`, `status`),
    INDEX `telegram_broadcasts_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TelegramAutoReply ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `telegram_auto_replies` (
    `id`         INTEGER NOT NULL AUTO_INCREMENT,
    `keyword`    VARCHAR(255) NOT NULL,
    `isRegex`    BOOLEAN NOT NULL DEFAULT false,
    `ignoreCase` BOOLEAN NOT NULL DEFAULT true,
    `reply`      TEXT NOT NULL,
    `category`   VARCHAR(30) NOT NULL DEFAULT 'support',
    `isActive`   BOOLEAN NOT NULL DEFAULT true,
    `priority`   INTEGER NOT NULL DEFAULT 0,
    `hitCount`   INTEGER NOT NULL DEFAULT 0,
    `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`  DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `telegram_auto_replies_isActive_priority_idx` (`isActive`, `priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ThirdPartyCallLog ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `third_party_call_logs` (
    `id`              INTEGER NOT NULL AUTO_INCREMENT,
    `providerCode`    VARCHAR(30) NOT NULL,
    `serviceType`     VARCHAR(30) NOT NULL,
    `project`         VARCHAR(20) NULL,
    `userId`          VARCHAR(30) NULL,
    `action`          VARCHAR(60) NULL,
    `requestSummary`  JSON NULL,
    `responseStatus`  INTEGER NULL,
    `durationMs`      INTEGER NULL,
    `success`         BOOLEAN NOT NULL DEFAULT true,
    `errorMessage`    TEXT NULL,
    `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `third_party_call_logs_providerCode_createdAt_idx` (`providerCode`, `createdAt`),
    INDEX `third_party_call_logs_project_createdAt_idx` (`project`, `createdAt`),
    INDEX `third_party_call_logs_success_createdAt_idx` (`success`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ThirdPartyHealthSnapshot ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `third_party_health_snapshots` (
    `id`           INTEGER NOT NULL AUTO_INCREMENT,
    `providerCode` VARCHAR(30) NOT NULL,
    `healthy`      BOOLEAN NOT NULL,
    `latencyMs`    INTEGER NULL,
    `checkedAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `third_party_health_snapshots_providerCode_checkedAt_idx` (`providerCode`, `checkedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LoginLog ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `login_logs` (
    `id`        VARCHAR(191) NOT NULL,
    `userId`    VARCHAR(30) NOT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `success`   BOOLEAN NOT NULL DEFAULT true,
    `reason`    VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `login_logs_userId_createdAt_idx` (`userId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── UserSession ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id`         VARCHAR(191) NOT NULL,
    `userId`     VARCHAR(30) NOT NULL,
    `token`      VARCHAR(512) NOT NULL,
    `ipAddress`  VARCHAR(45) NULL,
    `userAgent`  TEXT NULL,
    `expiresAt`  DATETIME(3) NOT NULL,
    `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `user_sessions_token_key` (`token`(191)),
    INDEX `user_sessions_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── DeviceFingerprint ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `device_fingerprints` (
    `id`          VARCHAR(191) NOT NULL,
    `userId`      VARCHAR(30) NOT NULL,
    `fingerprint` VARCHAR(255) NOT NULL,
    `ipAddress`   VARCHAR(45) NULL,
    `userAgent`   TEXT NULL,
    `isTrusted`   BOOLEAN NOT NULL DEFAULT false,
    `lastSeenAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `device_fingerprints_userId_fingerprint_key` (`userId`, `fingerprint`(191)),
    INDEX `device_fingerprints_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
