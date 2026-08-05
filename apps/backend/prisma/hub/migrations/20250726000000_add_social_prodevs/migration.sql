-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_social_prodevs
-- Created  : 2025-07-26
-- Schema   : hub_db
-- Thêm 6 bảng được tích hợp từ:
--   • apps/external/social  → social_posts, social_likes, social_reports
--   • apps/external/prodevs → prodevs_projects, prodevs_templates, prodevs_ai_config
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- SOCIAL APP (migrated từ apps/external/social React Native app)
-- ════════════════════════════════════════════════════════════════════════════

-- social_posts — Bài đăng của người dùng (ảnh + caption)
CREATE TABLE `social_posts` (
    `id`        VARCHAR(191)    NOT NULL,
    -- FK to hub users.id (author); no foreign key constraint — users may live in admin_db
    `userId`    VARCHAR(36)     NOT NULL,
    -- Caption / description của bài đăng
    `caption`   TEXT            NULL,
    -- URL ảnh chính (Cloudflare R2 / external)
    `imageUrl`  VARCHAR(500)    NULL,
    -- active | hidden | removed | pending
    `status`    VARCHAR(20)     NOT NULL DEFAULT 'active',
    `likeCount` INT             NOT NULL DEFAULT 0,
    `createdAt` DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(3)     NOT NULL,

    INDEX `social_posts_userId_idx`    (`userId`),
    INDEX `social_posts_status_idx`    (`status`),
    INDEX `social_posts_createdAt_idx` (`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- social_likes — Lượt thích bài đăng (unique per user+post)
CREATE TABLE `social_likes` (
    `id`        VARCHAR(191)    NOT NULL,
    `postId`    VARCHAR(191)    NOT NULL,
    `userId`    VARCHAR(36)     NOT NULL,
    `createdAt` DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE KEY `social_likes_postId_userId_key` (`postId`, `userId`),
    INDEX  `social_likes_userId_idx`  (`userId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `social_likes_postId_fk`
        FOREIGN KEY (`postId`) REFERENCES `social_posts` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- social_reports — Báo cáo vi phạm nội dung
CREATE TABLE `social_reports` (
    `id`               VARCHAR(191)    NOT NULL,
    `postId`           VARCHAR(191)    NOT NULL,
    `reporterId`       VARCHAR(36)     NOT NULL,
    `reporterUsername` VARCHAR(100)    NULL,
    `reason`           VARCHAR(500)    NOT NULL,
    -- pending | reviewed | resolved | dismissed
    `status`           VARCHAR(20)     NOT NULL DEFAULT 'pending',
    `adminNote`        TEXT            NULL,
    `createdAt`        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt`        DATETIME(3)     NOT NULL,

    INDEX `social_reports_postId_idx`    (`postId`),
    INDEX `social_reports_status_idx`    (`status`),
    INDEX `social_reports_createdAt_idx` (`createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `social_reports_postId_fk`
        FOREIGN KEY (`postId`) REFERENCES `social_posts` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════════════
-- PRODEVS CLI (migrated từ apps/external/prodevs TypeScript CLI scaffold)
-- ════════════════════════════════════════════════════════════════════════════

-- prodevs_projects — Dự án đã scaffold qua ProDevs CLI
CREATE TABLE `prodevs_projects` (
    `id`             VARCHAR(191)    NOT NULL,
    `name`           VARCHAR(150)    NOT NULL,
    `description`    TEXT            NULL,
    -- nextjs | express | nestjs | none
    `framework`      VARCHAR(30)     NOT NULL DEFAULT 'none',
    -- postgresql | mysql | none
    `database`       VARCHAR(30)     NOT NULL DEFAULT 'none',
    -- better-auth | authjs | clerk | none
    `authentication` VARCHAR(30)     NOT NULL DEFAULT 'none',
    -- tailwind | none
    `styling`        VARCHAR(30)     NOT NULL DEFAULT 'none',
    -- cloudinary | aws-s3 | none
    `storage`        VARCHAR(30)     NOT NULL DEFAULT 'none',
    -- stripe | flutterwave | paystack | none
    `payments`       VARCHAR(30)     NOT NULL DEFAULT 'none',
    -- openai | gemini | claude | groq | deepseek | mistral | none
    `aiProvider`     VARCHAR(30)     NOT NULL DEFAULT 'none',
    -- manual | ai
    `setupMode`      VARCHAR(20)     NOT NULL DEFAULT 'manual',
    -- JSON list of installed npm packages
    `packages`       JSON            NULL,
    -- Admin user who created the record (FK to admin_db, soft ref)
    `createdByAdmin` VARCHAR(60)     NULL,
    `createdAt`      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt`      DATETIME(3)     NOT NULL,

    INDEX `prodevs_projects_framework_idx`  (`framework`),
    INDEX `prodevs_projects_createdAt_idx`  (`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- prodevs_templates — Template stack configs (preset cho ProDevs CLI)
CREATE TABLE `prodevs_templates` (
    `id`             VARCHAR(191)    NOT NULL,
    `name`           VARCHAR(150)    NOT NULL,
    `description`    TEXT            NULL,
    `framework`      VARCHAR(30)     NOT NULL DEFAULT 'none',
    `database`       VARCHAR(30)     NOT NULL DEFAULT 'none',
    `authentication` VARCHAR(30)     NOT NULL DEFAULT 'none',
    `styling`        VARCHAR(30)     NOT NULL DEFAULT 'none',
    `storage`        VARCHAR(30)     NOT NULL DEFAULT 'none',
    `payments`       VARCHAR(30)     NOT NULL DEFAULT 'none',
    `aiProvider`     VARCHAR(30)     NOT NULL DEFAULT 'none',
    `isActive`       BOOLEAN         NOT NULL DEFAULT TRUE,
    `sortOrder`      INT             NOT NULL DEFAULT 0,
    `createdAt`      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt`      DATETIME(3)     NOT NULL,

    UNIQUE KEY `prodevs_templates_name_key`        (`name`),
    INDEX      `prodevs_templates_isActive_sort_idx` (`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- prodevs_ai_config — Singleton: AI provider config + encrypted API keys
-- id=1 always; use upsert pattern
CREATE TABLE `prodevs_ai_config` (
    `id`              INT             NOT NULL AUTO_INCREMENT,
    -- Default provider slug (openai | gemini | claude | ...)
    `defaultProvider` VARCHAR(30)     NOT NULL DEFAULT 'openai',
    -- JSON: { OPENAI_API_KEY: "enc:iv:tag:data", GEMINI_API_KEY: "enc:...", ... }
    -- Keys are AES-256-GCM encrypted via ENCRYPTION_KEY env var
    `keyStore`        JSON            NULL,
    `updatedAt`       DATETIME(3)     NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed singleton row so getAIConfig always finds id=1
INSERT INTO `prodevs_ai_config` (`defaultProvider`, `updatedAt`)
VALUES ('openai', NOW())
ON DUPLICATE KEY UPDATE `updatedAt` = NOW();
