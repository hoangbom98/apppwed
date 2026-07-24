-- ============================================================
-- dating_db — Dating & Livestream Platform Schema
-- MySQL 8.0+ / utf8mb4
-- ============================================================
CREATE DATABASE IF NOT EXISTS `dating_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dating_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `username`       VARCHAR(50)  NOT NULL UNIQUE,
  `email`          VARCHAR(100) NOT NULL UNIQUE,
  `password_hash`  VARCHAR(255) NOT NULL,
  `full_name`      VARCHAR(100) NULL,
  `avatar`         VARCHAR(255) NULL,
  `gender`         ENUM('male','female','other') NULL,
  `bio`            TEXT NULL,
  `role`           ENUM('admin','streamer','user') DEFAULT 'user',
  `status`         ENUM('active','inactive','banned') DEFAULT 'active',
  `balance`        DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Coin/point balance',
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role`   (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `token`      VARCHAR(512) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `streamers` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`          INT NOT NULL UNIQUE,
  `display_name`     VARCHAR(100) NOT NULL,
  `cover_image`      VARCHAR(255) NULL,
  `call_price_min`   DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Price per minute for video call',
  `commission_rate`  DECIMAL(5,2)  DEFAULT 70.00 COMMENT '% of revenue streamer receives',
  `total_earnings`   DECIMAL(15,2) DEFAULT 0.00,
  `is_online`        BOOLEAN DEFAULT FALSE,
  `tags`             JSON NULL,
  `status`           ENUM('active','inactive','suspended') DEFAULT 'active',
  `approved_at`      DATETIME NULL,
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_streamers_status` (`status`),
  INDEX `idx_streamers_online` (`is_online`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `videos` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `streamer_id`  INT NOT NULL,
  `title`        VARCHAR(255) NOT NULL,
  `description`  TEXT NULL,
  `thumbnail`    VARCHAR(255) NULL,
  `file_path`    VARCHAR(255) NOT NULL,
  `duration_sec` INT NULL,
  `price`        DECIMAL(10,2) DEFAULT 0.00,
  `is_free`      BOOLEAN DEFAULT FALSE,
  `views`        INT UNSIGNED DEFAULT 0,
  `status`       ENUM('active','inactive','pending') DEFAULT 'pending',
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`streamer_id`) REFERENCES `streamers`(`id`) ON DELETE CASCADE,
  INDEX `idx_videos_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `live_rooms` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `streamer_id`   INT NOT NULL,
  `title`         VARCHAR(255) NOT NULL,
  `thumbnail`     VARCHAR(255) NULL,
  `stream_key`    VARCHAR(100) NOT NULL UNIQUE,
  `viewer_count`  INT UNSIGNED DEFAULT 0,
  `is_live`       BOOLEAN DEFAULT FALSE,
  `started_at`    DATETIME NULL,
  `ended_at`      DATETIME NULL,
  FOREIGN KEY (`streamer_id`) REFERENCES `streamers`(`id`) ON DELETE CASCADE,
  INDEX `idx_rooms_live` (`is_live`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gifts` (
  `id`       INT AUTO_INCREMENT PRIMARY KEY,
  `name`     VARCHAR(100) NOT NULL,
  `icon`     VARCHAR(255) NULL,
  `price`    DECIMAL(10,2) NOT NULL COMMENT 'Cost in platform coins',
  `value`    DECIMAL(10,2) NOT NULL COMMENT 'Monetary value to streamer',
  `status`   ENUM('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gift_sends` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id`   INT NOT NULL,
  `streamer_id` INT NOT NULL,
  `gift_id`     INT NOT NULL,
  `quantity`    INT DEFAULT 1,
  `total_cost`  DECIMAL(10,2) NOT NULL,
  `room_id`     INT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`streamer_id`) REFERENCES `streamers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`gift_id`)     REFERENCES `gifts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `calls` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `caller_id`    INT NOT NULL,
  `streamer_id`  INT NOT NULL,
  `start_time`   DATETIME NOT NULL,
  `end_time`     DATETIME NULL,
  `duration_sec` INT DEFAULT 0,
  `price_per_min` DECIMAL(10,2) NOT NULL,
  `total_cost`   DECIMAL(10,2) DEFAULT 0.00,
  `status`       ENUM('pending','active','ended','missed') DEFAULT 'pending',
  FOREIGN KEY (`caller_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`streamer_id`) REFERENCES `streamers`(`id`) ON DELETE CASCADE,
  INDEX `idx_calls_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vip_plans` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(100) NOT NULL,
  `price`       DECIMAL(10,2) NOT NULL,
  `duration_days` INT NOT NULL,
  `benefits`    JSON NULL COMMENT 'Array of benefit strings',
  `status`      ENUM('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vip_memberships` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `plan_id`    INT NOT NULL,
  `starts_at`  DATETIME NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `status`     ENUM('active','expired','cancelled') DEFAULT 'active',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan_id`) REFERENCES `vip_plans`(`id`) ON DELETE CASCADE,
  INDEX `idx_vip_user`   (`user_id`),
  INDEX `idx_vip_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id`             BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `amount`         DECIMAL(15,2) NOT NULL,
  `type`           ENUM('credit','debit') NOT NULL,
  `reference_type` ENUM('deposit','gift','call','vip','withdraw','video_purchase') NOT NULL,
  `reference_id`   VARCHAR(100) NOT NULL,
  `balance_after`  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `description`    VARCHAR(255) NULL,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_tx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `sender_id`   INT NOT NULL,
  `receiver_id` INT NULL COMMENT 'NULL = stream broadcast',
  `room_id`     INT NULL,
  `content`     TEXT NOT NULL,
  `type`        VARCHAR(20) DEFAULT 'text',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_msg_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `video_purchases` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT NOT NULL,
  `video_id`    INT NOT NULL,
  `price_paid`  DECIMAL(10,2) NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_video` (`user_id`,`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `title`      VARCHAR(150) NOT NULL,
  `content`    TEXT NOT NULL,
  `type`       ENUM('system','gift','call','vip','stream') DEFAULT 'system',
  `is_read`    BOOLEAN DEFAULT FALSE,
  `link`       VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
