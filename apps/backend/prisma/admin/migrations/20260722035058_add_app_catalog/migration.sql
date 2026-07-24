-- CreateTable: app_catalog
CREATE TABLE `app_catalog` (
    `id`           INTEGER NOT NULL AUTO_INCREMENT,
    `appId`        VARCHAR(50) NOT NULL,
    `name`         VARCHAR(255) NOT NULL,
    `developer`    VARCHAR(255) NULL,
    `category`     VARCHAR(60) NULL,
    `iconUrl`      VARCHAR(500) NULL,
    `primaryColor` VARCHAR(20) NULL,
    `rating`       DECIMAL(3, 1) NOT NULL DEFAULT 5.0,
    `reviewsCount` VARCHAR(30) NULL,
    `downloads`    VARCHAR(30) NULL,
    `androidLink`  VARCHAR(1000) NULL,
    `iosLink`      VARCHAR(1000) NULL,
    `description`  TEXT NULL,
    `features`     JSON NULL,
    `isPublished`  BOOLEAN NOT NULL DEFAULT true,
    `sortOrder`    INTEGER NOT NULL DEFAULT 0,
    `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`    DATETIME(3) NOT NULL,

    UNIQUE INDEX `app_catalog_appId_key`(`appId`),
    INDEX `app_catalog_isPublished_idx`(`isPublished`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
