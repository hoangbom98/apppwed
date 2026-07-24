-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `tradingPassword` VARCHAR(255) NULL,
    `fullName` VARCHAR(100) NULL,
    `avatar` VARCHAR(500) NULL,
    `phone` VARCHAR(20) NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'user',
    `kycStatus` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `kycData` JSON NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `tradingFrozen` BOOLEAN NOT NULL DEFAULT false,
    `memberLevel` INTEGER NOT NULL DEFAULT 1,
    `integral` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `referralCode` VARCHAR(20) NULL,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_referralCode_key`(`referralCode`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_kycStatus_idx`(`kycStatus`),
    INDEX `users_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `markets` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `timezone` VARCHAR(50) NULL,
    `openTime` VARCHAR(10) NULL,
    `closeTime` VARCHAR(10) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `markets_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `symbols` (
    `id` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(30) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `baseAsset` VARCHAR(20) NULL,
    `quoteAsset` VARCHAR(20) NULL,
    `minQty` DECIMAL(18, 8) NOT NULL DEFAULT 0,
    `maxQty` DECIMAL(18, 8) NOT NULL DEFAULT 0,
    `stepSize` DECIMAL(18, 8) NOT NULL DEFAULT 0,
    `tickSize` DECIMAL(18, 8) NOT NULL DEFAULT 0,
    `minLeverage` INTEGER NOT NULL DEFAULT 1,
    `maxLeverage` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `tradingSchedule` JSON NULL,
    `orderFeeRate` DECIMAL(8, 4) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `symbols_code_key`(`code`),
    INDEX `symbols_marketId_status_idx`(`marketId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_history` (
    `id` VARCHAR(191) NOT NULL,
    `symbolId` VARCHAR(30) NOT NULL,
    `price` DECIMAL(18, 8) NOT NULL,
    `high` DECIMAL(18, 8) NOT NULL,
    `low` DECIMAL(18, 8) NOT NULL,
    `open` DECIMAL(18, 8) NOT NULL,
    `close` DECIMAL(18, 8) NOT NULL,
    `volume` DECIMAL(18, 8) NOT NULL DEFAULT 0,
    `interval` VARCHAR(10) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,

    INDEX `price_history_symbolId_timestamp_idx`(`symbolId`, `timestamp`),
    INDEX `price_history_symbolId_interval_timestamp_idx`(`symbolId`, `interval`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `symbolId` VARCHAR(30) NOT NULL,
    `side` VARCHAR(10) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `price` DECIMAL(18, 8) NOT NULL,
    `quantity` DECIMAL(18, 8) NOT NULL,
    `executedQty` DECIMAL(18, 8) NOT NULL DEFAULT 0,
    `avgPrice` DECIMAL(18, 8) NULL,
    `stopPrice` DECIMAL(18, 8) NULL,
    `leverage` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `note` VARCHAR(500) NULL,
    `filledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `orders_userId_status_idx`(`userId`, `status`),
    INDEX `orders_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `orders_symbolId_status_idx`(`symbolId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `symbolId` VARCHAR(30) NOT NULL,
    `side` VARCHAR(10) NOT NULL,
    `quantity` DECIMAL(18, 8) NOT NULL,
    `entryPrice` DECIMAL(18, 8) NOT NULL,
    `currentPrice` DECIMAL(18, 8) NOT NULL,
    `stopLoss` DECIMAL(18, 8) NULL,
    `takeProfit` DECIMAL(18, 8) NULL,
    `pnl` DECIMAL(18, 8) NOT NULL DEFAULT 0,
    `pnlPercent` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `leverage` INTEGER NOT NULL DEFAULT 1,
    `margin` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'open',
    `closedPrice` DECIMAL(18, 8) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `positions_userId_status_idx`(`userId`, `status`),
    INDEX `positions_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `positions_symbolId_status_idx`(`symbolId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `balance` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `frozen` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wallets_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `withdrawals` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `fee` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `netAmount` DECIMAL(18, 2) NOT NULL,
    `method` VARCHAR(30) NOT NULL,
    `address` VARCHAR(200) NULL,
    `bankInfo` JSON NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `txId` VARCHAR(200) NULL,
    `note` VARCHAR(500) NULL,
    `adminNote` VARCHAR(500) NULL,
    `processedBy` VARCHAR(30) NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `withdrawals_userId_status_idx`(`userId`, `status`),
    INDEX `withdrawals_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kyc` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `fullName` VARCHAR(100) NOT NULL,
    `idNumber` VARCHAR(30) NOT NULL,
    `idFront` VARCHAR(500) NOT NULL,
    `idBack` VARCHAR(500) NOT NULL,
    `selfie` VARCHAR(500) NOT NULL,
    `address` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `note` VARCHAR(500) NULL,
    `reviewedBy` VARCHAR(30) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kyc_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `referenceId` VARCHAR(30) NULL,
    `referenceType` VARCHAR(30) NULL,
    `note` VARCHAR(500) NULL,
    `balanceBefore` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `balanceAfter` DECIMAL(18, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transactions_userId_type_idx`(`userId`, `type`),
    INDEX `transactions_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `link` VARCHAR(500) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `symbolId` VARCHAR(30) NOT NULL,
    `condition` VARCHAR(20) NOT NULL,
    `price` DECIMAL(18, 8) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `note` VARCHAR(255) NULL,
    `triggeredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `price_alerts_userId_status_idx`(`userId`, `status`),
    INDEX `price_alerts_symbolId_status_idx`(`symbolId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `watchlists` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `watchlists_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `watchlist_items` (
    `id` VARCHAR(191) NOT NULL,
    `watchlistId` VARCHAR(30) NOT NULL,
    `symbolId` VARCHAR(30) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `watchlist_items_watchlistId_symbolId_key`(`watchlistId`, `symbolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_rooms` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'private',
    `name` VARCHAR(100) NULL,
    `avatar` VARCHAR(500) NULL,
    `lastMessage` TEXT NULL,
    `lastMessageAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_participants` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `isAgent` BOOLEAN NOT NULL DEFAULT false,
    `lastReadAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,

    INDEX `support_participants_userId_idx`(`userId`),
    UNIQUE INDEX `support_participants_roomId_userId_key`(`roomId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_messages` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(30) NOT NULL,
    `senderId` VARCHAR(30) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'text',
    `content` TEXT NOT NULL,
    `metadata` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `origLang` VARCHAR(10) NULL,
    `translated` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `support_messages_roomId_createdAt_idx`(`roomId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `roomId` VARCHAR(30) NULL,
    `subject` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'general',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(20) NOT NULL DEFAULT 'open',
    `assignedTo` VARCHAR(30) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `support_tickets_userId_status_idx`(`userId`, `status`),
    INDEX `support_tickets_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_ticket_replies` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(30) NOT NULL,
    `senderId` VARCHAR(30) NOT NULL,
    `content` TEXT NOT NULL,
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `attachments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `support_ticket_replies_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledge_articles` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'general',
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `summary` VARCHAR(500) NULL,
    `image` VARCHAR(500) NULL,
    `authorId` VARCHAR(30) NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `knowledge_articles_slug_key`(`slug`),
    INDEX `knowledge_articles_category_status_idx`(`category`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledge_translations` (
    `id` VARCHAR(191) NOT NULL,
    `articleId` VARCHAR(30) NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `knowledge_translations_articleId_language_key`(`articleId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_settings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `email` BOOLEAN NOT NULL DEFAULT true,
    `push` BOOLEAN NOT NULL DEFAULT true,
    `sms` BOOLEAN NOT NULL DEFAULT false,
    `inApp` BOOLEAN NOT NULL DEFAULT true,
    `types` JSON NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_settings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `translation_logs` (
    `id` VARCHAR(191) NOT NULL,
    `sourceLang` VARCHAR(10) NOT NULL,
    `targetLang` VARCHAR(10) NOT NULL,
    `sourceText` TEXT NOT NULL,
    `translatedText` TEXT NOT NULL,
    `service` VARCHAR(50) NOT NULL DEFAULT 'deepseek',
    `tokenCount` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `translation_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_uploads` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'general',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `file_uploads_userId_type_idx`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deposits` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `method` VARCHAR(30) NOT NULL,
    `txHash` VARCHAR(200) NULL,
    `proof` VARCHAR(500) NULL,
    `bankInfo` JSON NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `note` VARCHAR(500) NULL,
    `adminNote` VARCHAR(500) NULL,
    `processedBy` VARCHAR(30) NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `deposits_userId_status_idx`(`userId`, `status`),
    INDEX `deposits_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `investment_packages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `minAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `maxAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `dailyProfit` DECIMAL(8, 4) NOT NULL,
    `duration` INTEGER NOT NULL,
    `totalSlots` INTEGER NOT NULL DEFAULT 0,
    `usedSlots` INTEGER NOT NULL DEFAULT 0,
    `perUserLimit` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `investment_packages_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `investments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `packageId` VARCHAR(30) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `profitPaid` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NOT NULL,
    `lastPaidAt` DATETIME(3) NULL,
    `voucherId` VARCHAR(30) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `investments_userId_status_idx`(`userId`, `status`),
    INDEX `investments_status_lastPaidAt_idx`(`status`, `lastPaidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `investment_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `investmentId` VARCHAR(30) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `investment_schedules_investmentId_status_idx`(`investmentId`, `status`),
    INDEX `investment_schedules_dueDate_status_idx`(`dueDate`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrals` (
    `id` VARCHAR(191) NOT NULL,
    `referrerId` VARCHAR(30) NOT NULL,
    `referredId` VARCHAR(30) NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `referrals_referredId_key`(`referredId`),
    INDEX `referrals_referrerId_idx`(`referrerId`),
    INDEX `referrals_referredId_idx`(`referredId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `fromUserId` VARCHAR(30) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `level` INTEGER NOT NULL,
    `source` VARCHAR(30) NOT NULL,
    `sourceId` VARCHAR(30) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paidAt` DATETIME(3) NULL,

    INDEX `commission_logs_userId_status_idx`(`userId`, `status`),
    INDEX `commission_logs_fromUserId_idx`(`fromUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_configs` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `group` VARCHAR(50) NOT NULL DEFAULT 'general',
    `description` VARCHAR(255) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_configs_key_key`(`key`),
    INDEX `system_configs_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_configs` (
    `id` VARCHAR(191) NOT NULL,
    `symbolId` VARCHAR(30) NOT NULL,
    `qybl` DECIMAL(8, 4) NOT NULL DEFAULT 0,
    `qkbl` DECIMAL(8, 4) NOT NULL DEFAULT 0,
    `maxPositionAmt` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `marginCallRate` DECIMAL(8, 4) NOT NULL DEFAULT 0.1,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `risk_configs_symbolId_key`(`symbolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'bank',
    `bankName` VARCHAR(100) NULL,
    `accountNumber` VARCHAR(50) NOT NULL,
    `accountName` VARCHAR(100) NOT NULL,
    `branch` VARCHAR(100) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bank_accounts_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_signins` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `reward` DECIMAL(18, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_signins_userId_idx`(`userId`),
    UNIQUE INDEX `user_signins_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `yuebao_products` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `interestRate` DECIMAL(8, 4) NOT NULL,
    `days` INTEGER NOT NULL,
    `minAmount` DECIMAL(18, 2) NOT NULL,
    `maxAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `stars` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `yuebao_investments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `profitPaid` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NOT NULL,
    `settledAt` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `yuebao_investments_userId_status_idx`(`userId`, `status`),
    INDEX `yuebao_investments_endDate_status_idx`(`endDate`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mining_machines` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `price` DECIMAL(18, 2) NOT NULL,
    `totalStock` INTEGER NOT NULL DEFAULT 0,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `dayIncome` DECIMAL(18, 2) NOT NULL,
    `cost` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `perUserLimit` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mining_investments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `machineId` VARCHAR(30) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `deposit` DECIMAL(18, 2) NOT NULL,
    `dayIncome` DECIMAL(18, 2) NOT NULL,
    `profitPaid` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `lastPaidAt` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mining_investments_userId_status_idx`(`userId`, `status`),
    INDEX `mining_investments_status_lastPaidAt_idx`(`status`, `lastPaidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vouchers` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'fixed',
    `amount` DECIMAL(18, 2) NOT NULL,
    `minPurchase` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `maxUses` INTEGER NOT NULL DEFAULT 1,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vouchers_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `voucher_usages` (
    `id` VARCHAR(191) NOT NULL,
    `voucherId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `referenceId` VARCHAR(30) NULL,
    `usedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `voucher_usages_voucherId_userId_key`(`voucherId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prize_configs` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'cash',
    `amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `odds` DECIMAL(8, 4) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `eventId` VARCHAR(30) NULL,
    `endTime` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prize_records` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `prizeId` VARCHAR(30) NOT NULL,
    `wonAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `claimed` BOOLEAN NOT NULL DEFAULT false,
    `claimedAt` DATETIME(3) NULL,

    INDEX `prize_records_userId_idx`(`userId`),
    INDEX `prize_records_wonAt_idx`(`wonAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `linkUrl` VARCHAR(500) NULL,
    `position` VARCHAR(20) NOT NULL DEFAULT 'top',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `banners_status_position_idx`(`status`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news_articles` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `summary` VARCHAR(500) NULL,
    `thumbnail` VARCHAR(500) NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'news',
    `authorId` VARCHAR(30) NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `readReward` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `news_articles_slug_key`(`slug`),
    INDEX `news_articles_category_status_idx`(`category`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news_view_logs` (
    `id` VARCHAR(191) NOT NULL,
    `articleId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `reward` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `news_view_logs_userId_idx`(`userId`),
    UNIQUE INDEX `news_view_logs_articleId_userId_key`(`articleId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_items` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `points` DECIMAL(18, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `type` VARCHAR(20) NOT NULL DEFAULT 'physical',
    `cashValue` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_orders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `itemId` VARCHAR(30) NOT NULL,
    `points` DECIMAL(18, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `shop_orders_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `symbols` ADD CONSTRAINT `symbols_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `markets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_history` ADD CONSTRAINT `price_history_symbolId_fkey` FOREIGN KEY (`symbolId`) REFERENCES `symbols`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_symbolId_fkey` FOREIGN KEY (`symbolId`) REFERENCES `symbols`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `positions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `positions_symbolId_fkey` FOREIGN KEY (`symbolId`) REFERENCES `symbols`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc` ADD CONSTRAINT `kyc_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_alerts` ADD CONSTRAINT `price_alerts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_alerts` ADD CONSTRAINT `price_alerts_symbolId_fkey` FOREIGN KEY (`symbolId`) REFERENCES `symbols`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `watchlists` ADD CONSTRAINT `watchlists_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `watchlist_items` ADD CONSTRAINT `watchlist_items_watchlistId_fkey` FOREIGN KEY (`watchlistId`) REFERENCES `watchlists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `watchlist_items` ADD CONSTRAINT `watchlist_items_symbolId_fkey` FOREIGN KEY (`symbolId`) REFERENCES `symbols`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_participants` ADD CONSTRAINT `support_participants_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `support_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_messages` ADD CONSTRAINT `support_messages_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `support_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `support_rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_ticket_replies` ADD CONSTRAINT `support_ticket_replies_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_translations` ADD CONSTRAINT `knowledge_translations_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `knowledge_articles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deposits` ADD CONSTRAINT `deposits_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investments` ADD CONSTRAINT `investments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investments` ADD CONSTRAINT `investments_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `investment_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investment_schedules` ADD CONSTRAINT `investment_schedules_investmentId_fkey` FOREIGN KEY (`investmentId`) REFERENCES `investments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_configs` ADD CONSTRAINT `risk_configs_symbolId_fkey` FOREIGN KEY (`symbolId`) REFERENCES `symbols`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_signins` ADD CONSTRAINT `user_signins_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `yuebao_investments` ADD CONSTRAINT `yuebao_investments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `yuebao_investments` ADD CONSTRAINT `yuebao_investments_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `yuebao_products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mining_investments` ADD CONSTRAINT `mining_investments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mining_investments` ADD CONSTRAINT `mining_investments_machineId_fkey` FOREIGN KEY (`machineId`) REFERENCES `mining_machines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher_usages` ADD CONSTRAINT `voucher_usages_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `vouchers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher_usages` ADD CONSTRAINT `voucher_usages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prize_records` ADD CONSTRAINT `prize_records_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prize_records` ADD CONSTRAINT `prize_records_prizeId_fkey` FOREIGN KEY (`prizeId`) REFERENCES `prize_configs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news_view_logs` ADD CONSTRAINT `news_view_logs_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `news_articles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_orders` ADD CONSTRAINT `shop_orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_orders` ADD CONSTRAINT `shop_orders_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `shop_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
