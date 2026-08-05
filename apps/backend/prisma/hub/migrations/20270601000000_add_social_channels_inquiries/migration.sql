-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_social_channels_inquiries
-- Created  : 2025-06-01
-- Schema   : hub_db
-- Adds two new tables migrated from apps/external/landing/server:
--   1. social_channels — Footer / contact link management (CRUD + order)
--   2. inquiries       — Visitor contact / lead form submissions
-- ─────────────────────────────────────────────────────────────────────────────

-- social_channels
CREATE TABLE `social_channels` (
    `id`        VARCHAR(191)    NOT NULL,
    `name`      VARCHAR(100)    NOT NULL,
    `url`       VARCHAR(500)    NOT NULL,
    -- icon slug: whatsapp | telegram | youtube | facebook | instagram | x | linkedin | link
    `icon`      VARCHAR(50)     NOT NULL DEFAULT 'link',
    `isActive`  BOOLEAN         NOT NULL DEFAULT TRUE,
    -- Display order (ascending)
    `order`     INT             NOT NULL DEFAULT 0,
    `createdAt` DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(3)     NOT NULL,

    INDEX `social_channels_isActive_order_idx` (`isActive`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- inquiries
CREATE TABLE `inquiries` (
    `id`            VARCHAR(191)    NOT NULL,
    `name`          VARCHAR(150)    NOT NULL,
    `email`         VARCHAR(254)    NOT NULL,
    `phone`         VARCHAR(30)     NULL,
    `message`       TEXT            NOT NULL,
    `budget`        VARCHAR(100)    NULL,
    -- Optional reference to a specific resource (news, tool, game, event)
    `resourceType`  VARCHAR(50)     NULL,
    `resourceId`    VARCHAR(36)     NULL,
    `resourceTitle` VARCHAR(255)    NULL,
    -- Workflow: new | in_progress | resolved | archived
    `status`        VARCHAR(20)     NOT NULL DEFAULT 'new',
    `adminNote`     TEXT            NULL,
    -- IP of submitter (rate-limit reference)
    `submitterIp`   VARCHAR(45)     NULL,
    `createdAt`     DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt`     DATETIME(3)     NOT NULL,

    INDEX `inquiries_status_idx`    (`status`),
    INDEX `inquiries_email_idx`     (`email`),
    INDEX `inquiries_createdAt_idx` (`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
