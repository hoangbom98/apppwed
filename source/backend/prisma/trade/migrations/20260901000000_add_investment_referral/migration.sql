-- Migration: Add Deposit, InvestmentPackage, Investment, Referral, CommissionLog, CompanyBank, TradeConfig, AdminLog
-- Created at: 20260901000000

-- ─── DEPOSITS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `deposits` (
  `id`          VARCHAR(30)  NOT NULL,
  `userId`      VARCHAR(30)  NOT NULL,
  `amount`      DECIMAL(18,2) NOT NULL,
  `method`      VARCHAR(30)  NOT NULL,
  `txHash`      VARCHAR(200) NULL,
  `note`        VARCHAR(500) NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `adminNote`   VARCHAR(500) NULL,
  `processedBy` VARCHAR(30)  NULL,
  `processedAt` DATETIME(3)  NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `deposits_userId_status_idx` (`userId`, `status`),
  INDEX `deposits_status_createdAt_idx` (`status`, `createdAt`),
  CONSTRAINT `deposits_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── INVESTMENT PACKAGES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `investment_packages` (
  `id`          VARCHAR(30)  NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `description` TEXT         NULL,
  `price`       DECIMAL(18,2) NOT NULL,
  `minAmount`   DECIMAL(18,2) NOT NULL,
  `maxAmount`   DECIMAL(18,2) NOT NULL,
  `dailyProfit` DECIMAL(8,4) NOT NULL,
  `duration`    INT          NOT NULL,
  `totalReturn` DECIMAL(8,4) NOT NULL,
  `level`       INT          NOT NULL DEFAULT 1,
  `isActive`    BOOLEAN      NOT NULL DEFAULT TRUE,
  `sortOrder`   INT          NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `investment_packages_name_key` (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── INVESTMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `investments` (
  `id`          VARCHAR(30)  NOT NULL,
  `userId`      VARCHAR(30)  NOT NULL,
  `packageId`   VARCHAR(30)  NOT NULL,
  `amount`      DECIMAL(18,2) NOT NULL,
  `startDate`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endDate`     DATETIME(3)  NOT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'active',
  `profitPaid`  DECIMAL(18,2) NOT NULL DEFAULT 0,
  `lastPaidAt`  DATETIME(3)  NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `investments_userId_status_idx` (`userId`, `status`),
  INDEX `investments_status_endDate_idx` (`status`, `endDate`),
  CONSTRAINT `investments_userId_fkey`   FOREIGN KEY (`userId`)    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `investments_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `investment_packages` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── REFERRALS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `referrals` (
  `id`         VARCHAR(30) NOT NULL,
  `referrerId` VARCHAR(30) NOT NULL,
  `referredId` VARCHAR(30) NOT NULL,
  `level`      INT         NOT NULL DEFAULT 1,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `referrals_referredId_key` (`referredId`),
  INDEX `referrals_referrerId_idx` (`referrerId`),
  CONSTRAINT `referrals_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `referrals_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── COMMISSION LOGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `commission_logs` (
  `id`          VARCHAR(30)  NOT NULL,
  `userId`      VARCHAR(30)  NOT NULL,
  `fromUserId`  VARCHAR(30)  NOT NULL,
  `amount`      DECIMAL(18,2) NOT NULL,
  `level`       INT          NOT NULL,
  `source`      VARCHAR(30)  NOT NULL,
  `sourceId`    VARCHAR(30)  NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `paidAt`      DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  INDEX `commission_logs_userId_status_idx`   (`userId`, `status`),
  INDEX `commission_logs_fromUserId_idx`      (`fromUserId`),
  INDEX `commission_logs_status_createdAt_idx`(`status`, `createdAt`),
  CONSTRAINT `commission_logs_userId_fkey`     FOREIGN KEY (`userId`)     REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `commission_logs_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── COMPANY BANKS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `company_banks` (
  `id`            VARCHAR(30)  NOT NULL,
  `bankName`      VARCHAR(100) NOT NULL,
  `accountName`   VARCHAR(100) NOT NULL,
  `accountNumber` VARCHAR(50)  NOT NULL,
  `branch`        VARCHAR(100) NULL,
  `qrCode`        VARCHAR(500) NULL,
  `type`          VARCHAR(30)  NOT NULL DEFAULT 'bank',
  `isActive`      BOOLEAN      NOT NULL DEFAULT TRUE,
  `sortOrder`     INT          NOT NULL DEFAULT 0,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `company_banks_accountNumber_key` (`accountNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── TRADE CONFIGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `trade_configs` (
  `id`          VARCHAR(30)  NOT NULL,
  `key`         VARCHAR(100) NOT NULL,
  `value`       JSON         NOT NULL,
  `description` VARCHAR(500) NULL,
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `trade_configs_key_key` (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── ADMIN LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id`        VARCHAR(30)  NOT NULL,
  `adminId`   VARCHAR(30)  NOT NULL,
  `adminName` VARCHAR(100) NOT NULL,
  `action`    VARCHAR(100) NOT NULL,
  `target`    VARCHAR(100) NULL,
  `details`   JSON         NULL,
  `ip`        VARCHAR(45)  NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `admin_logs_adminId_idx`   (`adminId`),
  INDEX `admin_logs_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
