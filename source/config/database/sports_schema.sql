-- ============================================================
-- sports_db — Sports Scores & Live Schema
-- MySQL 8.0+ / utf8mb4
-- ============================================================
CREATE DATABASE IF NOT EXISTS `sports_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sports_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `username`      VARCHAR(50)  NOT NULL UNIQUE,
  `email`         VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name`     VARCHAR(100) NULL,
  `avatar`        VARCHAR(255) NULL,
  `role`          ENUM('admin','user') DEFAULT 'user',
  `status`        ENUM('active','inactive','banned') DEFAULT 'active',
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `token`      VARCHAR(512) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sports` (
  `id`   INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `icon` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sports` (`name`,`slug`) VALUES
  ('Football','football'),('Basketball','basketball'),('Tennis','tennis'),('Volleyball','volleyball')
ON DUPLICATE KEY UPDATE `slug`=`slug`;

CREATE TABLE IF NOT EXISTS `leagues` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `sport_id`    INT NOT NULL,
  `name`        VARCHAR(150) NOT NULL,
  `slug`        VARCHAR(150) NOT NULL UNIQUE,
  `country`     VARCHAR(100) NULL,
  `logo`        VARCHAR(255) NULL,
  `current_season` VARCHAR(20) NULL,
  `status`      ENUM('active','inactive') DEFAULT 'active',
  FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `teams` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `league_id`  INT NOT NULL,
  `name`       VARCHAR(150) NOT NULL,
  `slug`       VARCHAR(150) NOT NULL UNIQUE,
  `short_name` VARCHAR(10)  NULL,
  `logo`       VARCHAR(255) NULL,
  `country`    VARCHAR(100) NULL,
  FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `matches` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `league_id`        INT NOT NULL,
  `home_team_id`     INT NOT NULL,
  `away_team_id`     INT NOT NULL,
  `match_date`       DATETIME NOT NULL,
  `venue`            VARCHAR(255) NULL,
  `status`           ENUM('scheduled','live','finished','postponed','cancelled') DEFAULT 'scheduled',
  `home_score`       SMALLINT UNSIGNED DEFAULT 0,
  `away_score`       SMALLINT UNSIGNED DEFAULT 0,
  `home_score_ht`    SMALLINT UNSIGNED DEFAULT 0 COMMENT 'Half-time home',
  `away_score_ht`    SMALLINT UNSIGNED DEFAULT 0 COMMENT 'Half-time away',
  `minute`           SMALLINT UNSIGNED DEFAULT 0 COMMENT 'Current match minute',
  `external_id`      VARCHAR(50) NULL UNIQUE COMMENT 'ID from data provider',
  `extra_data`       JSON NULL COMMENT 'Stats, lineups, events from provider',
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`league_id`)    REFERENCES `leagues`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  INDEX `idx_matches_date`   (`match_date`),
  INDEX `idx_matches_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `live_events` (
  `id`         BIGINT AUTO_INCREMENT PRIMARY KEY,
  `match_id`   INT NOT NULL,
  `minute`     SMALLINT UNSIGNED NOT NULL,
  `type`       ENUM('goal','yellow_card','red_card','substitution','var','penalty','own_goal') NOT NULL,
  `team`       ENUM('home','away') NOT NULL,
  `player`     VARCHAR(100) NULL,
  `detail`     VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE,
  INDEX `idx_le_match` (`match_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `highlights` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `match_id`    INT NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `thumbnail`   VARCHAR(255) NULL,
  `video_url`   VARCHAR(255) NOT NULL,
  `duration_sec` INT NULL,
  `views`       INT UNSIGNED DEFAULT 0,
  `status`      ENUM('active','inactive') DEFAULT 'active',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `news` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `league_id`    INT NULL,
  `title`        VARCHAR(255) NOT NULL,
  `slug`         VARCHAR(255) NOT NULL UNIQUE,
  `content`      LONGTEXT NOT NULL,
  `image`        VARCHAR(255) NULL,
  `author`       VARCHAR(100) NULL,
  `status`       ENUM('published','draft') DEFAULT 'draft',
  `views`        INT UNSIGNED DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `match_id`    INT NULL,
  `news_id`     INT NULL,
  `user_id`     INT NOT NULL,
  `content`     TEXT NOT NULL,
  `is_approved` BOOLEAN DEFAULT TRUE,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_comments_match` (`match_id`),
  INDEX `idx_comments_news`  (`news_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorite_teams` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `team_id`    INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_team` (`user_id`,`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `title`      VARCHAR(150) NOT NULL,
  `content`    TEXT NOT NULL,
  `type`       ENUM('system','match_start','goal','result') DEFAULT 'system',
  `is_read`    BOOLEAN DEFAULT FALSE,
  `match_id`   INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user` (`user_id`,`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sync_log` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `provider`    VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `records_synced` INT DEFAULT 0,
  `status`      ENUM('success','failed') DEFAULT 'success',
  `error`       TEXT NULL,
  `synced_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
