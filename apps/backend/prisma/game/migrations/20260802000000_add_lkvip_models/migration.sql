-- Migration: add LkvipTransaction, WithdrawalRequest, update VirtualAccount
-- Added as part of normalisation pass v2

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VirtualAccount — updated to match virtualAccountService.js field names
--    New columns: vaNumber, qrDataUrl, expectedAmount, actualAmount, expiredAt
--    Existing tables keep backward‑compat columns for now.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `virtual_accounts` (
  `id`             VARCHAR(30)  NOT NULL,
  `userId`         VARCHAR(30)  NOT NULL,
  `vaNumber`       VARCHAR(30)  NOT NULL,
  `bankBin`        VARCHAR(20)  NOT NULL,
  `bankName`       VARCHAR(100) NOT NULL,
  `accountNumber`  VARCHAR(30)  NOT NULL,
  `accountName`    VARCHAR(100) NOT NULL,
  `qrDataUrl`      LONGTEXT,
  `expectedAmount` DECIMAL(18,2),
  `actualAmount`   DECIMAL(18,2),
  `transactionRef` VARCHAR(100),
  `status`         VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `expiredAt`      DATETIME(3)  NOT NULL,
  `createdAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `virtual_accounts_vaNumber_key`    (`vaNumber`),
  INDEX `virtual_accounts_userId_status_idx`    (`userId`, `status`),
  INDEX `virtual_accounts_vaNumber_idx`         (`vaNumber`),
  INDEX `virtual_accounts_accountNumber_idx`    (`accountNumber`),
  INDEX `virtual_accounts_status_expiredAt_idx` (`status`, `expiredAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. LkvipTransaction — LKvip internal financial ledger
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `lkvip_transactions` (
  `id`            VARCHAR(30)  NOT NULL,
  `userId`        VARCHAR(30)  NOT NULL,
  `type`          VARCHAR(30)  NOT NULL,
  `amount`        DECIMAL(18,2) NOT NULL,
  `balanceBefore` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `balanceAfter`  DECIMAL(18,2) NOT NULL DEFAULT 0,
  `referenceType` VARCHAR(30),
  `referenceId`   VARCHAR(60),
  `description`   VARCHAR(500),
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'completed',
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `lkvip_transactions_userId_type_idx`      (`userId`, `type`),
  INDEX `lkvip_transactions_userId_createdAt_idx` (`userId`, `createdAt`),
  INDEX `lkvip_transactions_status_createdAt_idx` (`status`, `createdAt`),
  CONSTRAINT `lkvip_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. WithdrawalRequest — LKvip withdrawal lifecycle table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `withdrawal_requests` (
  `id`                VARCHAR(30)  NOT NULL,
  `userId`            VARCHAR(30)  NOT NULL,
  `amount`            DECIMAL(18,2) NOT NULL,
  `bankAccountNumber` VARCHAR(30)  NOT NULL,
  `bankName`          VARCHAR(100) NOT NULL,
  `bankBin`           VARCHAR(20),
  `accountHolder`     VARCHAR(100) NOT NULL,
  `note`              VARCHAR(500),
  `adminNote`         VARCHAR(500),
  `status`            VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `processedBy`       VARCHAR(30),
  `processedAt`       DATETIME(3),
  `createdAt`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `withdrawal_requests_userId_status_idx`    (`userId`, `status`),
  INDEX `withdrawal_requests_status_createdAt_idx` (`status`, `createdAt`),
  CONSTRAINT `withdrawal_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
