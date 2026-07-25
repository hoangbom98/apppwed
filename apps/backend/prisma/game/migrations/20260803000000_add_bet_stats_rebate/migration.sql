-- Migration: add_bet_stats_rebate
-- Adds BetStats and Rebate tables for game rebate/cashback system
-- Learned from BoYue RebateService pattern (T+1 settlement)

-- bet_stats: daily aggregated betting stats per user per game type
CREATE TABLE IF NOT EXISTS `bet_stats` (
  `id`          VARCHAR(30)   NOT NULL,
  `userId`      VARCHAR(30)   NOT NULL,
  `date`        VARCHAR(10)   NOT NULL,
  `gameType`    VARCHAR(20)   NOT NULL,
  `aggregator`  VARCHAR(30)   NOT NULL DEFAULT '',
  `validBet`    DECIMAL(18,2) NOT NULL DEFAULT 0,
  `totalBet`    DECIMAL(18,2) NOT NULL DEFAULT 0,
  `totalWin`    DECIMAL(18,2) NOT NULL DEFAULT 0,
  `roundCount`  INT           NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `bet_stats_userId_date_gameType_aggregator_key` (`userId`, `date`, `gameType`, `aggregator`),
  INDEX `bet_stats_userId_date_idx` (`userId`, `date`),
  INDEX `bet_stats_date_gameType_idx` (`date`, `gameType`),
  CONSTRAINT `bet_stats_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- rebates: daily rebate records per user per game type (T+1 settlement)
CREATE TABLE IF NOT EXISTS `rebates` (
  `id`          VARCHAR(30)   NOT NULL,
  `userId`      VARCHAR(30)   NOT NULL,
  `betDate`     VARCHAR(10)   NOT NULL,
  `gameType`    VARCHAR(20)   NOT NULL,
  `validBet`    DECIMAL(18,2) NOT NULL,
  `rate`        DECIMAL(6,4)  NOT NULL,
  `amount`      DECIMAL(18,2) NOT NULL,
  `vipLevel`    INT           NOT NULL DEFAULT 1,
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `claimedAt`   DATETIME(3)   NULL,
  `settledAt`   DATETIME(3)   NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `rebates_userId_betDate_gameType_key` (`userId`, `betDate`, `gameType`),
  INDEX `rebates_userId_status_idx` (`userId`, `status`),
  INDEX `rebates_betDate_status_idx` (`betDate`, `status`),
  INDEX `rebates_status_createdAt_idx` (`status`, `createdAt`),
  CONSTRAINT `rebates_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
