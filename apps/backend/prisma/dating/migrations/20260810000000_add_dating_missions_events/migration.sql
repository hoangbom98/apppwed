-- Migration: add_dating_missions_events
-- Added: DatingMission, UserMissionProgress, DatingEvent
-- Reason: Replace static gamification stubs with DB-backed models

-- CreateTable: dating_missions
CREATE TABLE `dating_missions` (
    `id`          VARCHAR(191)   NOT NULL,
    `slug`        VARCHAR(100)   NOT NULL,
    `title`       VARCHAR(255)   NOT NULL,
    `description` VARCHAR(500)   NULL,
    `reward`      DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `type`        VARCHAR(20)    NOT NULL DEFAULT 'daily',
    `targetCount` INT            NOT NULL DEFAULT 1,
    `icon`        VARCHAR(255)   NULL,
    `sortOrder`   INT            NOT NULL DEFAULT 0,
    `status`      VARCHAR(20)    NOT NULL DEFAULT 'active',
    `createdAt`   DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3)    NOT NULL,

    UNIQUE INDEX `dating_missions_slug_key`(`slug`),
    INDEX `dating_missions_status_type_idx`(`status`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: user_mission_progress
CREATE TABLE `user_mission_progress` (
    `id`          VARCHAR(191) NOT NULL,
    `userId`      VARCHAR(30)  NOT NULL,
    `missionId`   VARCHAR(30)  NOT NULL,
    `progress`    INT          NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3)  NULL,
    `claimedAt`   DATETIME(3)  NULL,
    `resetAt`     DATETIME(3)  NULL,
    `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3)  NOT NULL,

    UNIQUE INDEX `user_mission_progress_userId_missionId_key`(`userId`, `missionId`),
    INDEX `user_mission_progress_userId_completedAt_idx`(`userId`, `completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: dating_events
CREATE TABLE `dating_events` (
    `id`          VARCHAR(191) NOT NULL,
    `title`       VARCHAR(255) NOT NULL,
    `description` LONGTEXT     NULL,
    `type`        VARCHAR(30)  NOT NULL DEFAULT 'promotion',
    `banner`      VARCHAR(500) NULL,
    `startsAt`    DATETIME(3)  NOT NULL,
    `endsAt`      DATETIME(3)  NOT NULL,
    `isActive`    BOOLEAN      NOT NULL DEFAULT true,
    `metadata`    JSON         NULL,
    `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3)  NOT NULL,

    INDEX `dating_events_isActive_startsAt_endsAt_idx`(`isActive`, `startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: user_mission_progress.missionId → dating_missions.id
ALTER TABLE `user_mission_progress`
    ADD CONSTRAINT `user_mission_progress_missionId_fkey`
    FOREIGN KEY (`missionId`)
    REFERENCES `dating_missions`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
