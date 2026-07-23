-- ============================================================
-- hub_db — Full Schema for Hub Project
-- MySQL 8.0+ / utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS `hub_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hub_db`;

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `username`          VARCHAR(50)  NOT NULL UNIQUE,
  `email`             VARCHAR(100) NOT NULL UNIQUE,
  `password_hash`     VARCHAR(255) NOT NULL,
  `full_name`         VARCHAR(100) NULL,
  `avatar`            VARCHAR(255) NULL,
  `role`              ENUM('admin','user') DEFAULT 'user',
  `status`            ENUM('active','inactive','banned') DEFAULT 'active',
  `preferred_language` VARCHAR(10) DEFAULT 'vi',
  `created_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role`   (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. refresh_tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `token`      VARCHAR(512) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_rt_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(100) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL UNIQUE,
  `type`        ENUM('game','website','tool','news') NOT NULL,
  `parent_id`   INT NULL,
  `icon`        VARCHAR(255) NULL,
  `sort_order`  INT DEFAULT 0,
  `status`      ENUM('active','inactive') DEFAULT 'active',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_cat_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. games
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `games` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `category_id`  INT NOT NULL,
  `name`         VARCHAR(150) NOT NULL,
  `slug`         VARCHAR(150) NOT NULL UNIQUE,
  `description`  TEXT NULL,
  `publisher`    VARCHAR(100) NULL,
  `image`        VARCHAR(255) NULL,
  `link`         VARCHAR(255) NOT NULL,
  `status`       ENUM('active','inactive') DEFAULT 'active',
  `sort_order`   INT DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  INDEX `idx_games_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. websites
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `websites` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `category_id`  INT NOT NULL,
  `name`         VARCHAR(150) NOT NULL,
  `slug`         VARCHAR(150) NOT NULL UNIQUE,
  `description`  TEXT NULL,
  `logo`         VARCHAR(255) NULL,
  `link`         VARCHAR(255) NOT NULL,
  `status`       ENUM('active','inactive') DEFAULT 'active',
  `sort_order`   INT DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. tools
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tools` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `category_id`    INT NOT NULL,
  `name`           VARCHAR(150) NOT NULL,
  `slug`           VARCHAR(150) NOT NULL UNIQUE,
  `description`    TEXT NULL,
  `version`        VARCHAR(30) NULL,
  `os`             SET('windows','android','ios','linux','macos') NOT NULL,
  `file_size`      VARCHAR(30) NULL,
  `download_link`  VARCHAR(255) NOT NULL,
  `logo`           VARCHAR(255) NULL,
  `status`         ENUM('active','inactive') DEFAULT 'active',
  `sort_order`     INT DEFAULT 0,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. news
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `news` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `category_id`  INT NOT NULL,
  `title`        VARCHAR(255) NOT NULL,
  `slug`         VARCHAR(255) NOT NULL UNIQUE,
  `content`      LONGTEXT NOT NULL,
  `image`        VARCHAR(255) NULL,
  `author`       VARCHAR(100) NULL,
  `status`       ENUM('published','draft') DEFAULT 'draft',
  `views`        INT UNSIGNED DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  INDEX `idx_news_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. pages (static CMS pages: about, policy, terms, faq, contact)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pages` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `slug`             VARCHAR(100) NOT NULL UNIQUE,
  `title`            VARCHAR(255) NOT NULL,
  `content`          LONGTEXT NULL,
  `seo_title`        VARCHAR(255) NULL,
  `seo_description`  TEXT NULL,
  `status`           ENUM('published','draft') DEFAULT 'published',
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pages` (`slug`,`title`,`content`,`status`) VALUES
  ('about',   'Giới thiệu', '<p>Nội dung trang giới thiệu</p>', 'published'),
  ('policy',  'Chính sách',  '<p>Nội dung chính sách</p>',       'published'),
  ('terms',   'Điều khoản',  '<p>Điều khoản sử dụng</p>',        'published'),
  ('faq',     'FAQ',         '<p>Câu hỏi thường gặp</p>',         'published'),
  ('contact', 'Liên hệ',     '<p>Thông tin liên hệ</p>',          'published')
ON DUPLICATE KEY UPDATE `slug`=`slug`;

-- ------------------------------------------------------------
-- 9. banners
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `banners` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `title`           VARCHAR(150) NOT NULL,
  `image_desktop`   VARCHAR(255) NOT NULL,
  `image_mobile`    VARCHAR(255) NULL,
  `link`            VARCHAR(255) NULL,
  `position`        ENUM('home','sidebar') DEFAULT 'home',
  `type`            ENUM('slider','popup') DEFAULT 'slider',
  `sort_order`      INT DEFAULT 0,
  `status`          ENUM('active','inactive') DEFAULT 'active',
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_banners_pos` (`position`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. menus
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `menus` (
  `id`        INT AUTO_INCREMENT PRIMARY KEY,
  `name`      VARCHAR(100) NOT NULL,
  `location`  ENUM('header','footer','sidebar') DEFAULT 'header',
  `items`     JSON NOT NULL COMMENT 'Array of {label, url, target, children[]}',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. feedbacks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NULL,
  `email`      VARCHAR(100) NULL,
  `name`       VARCHAR(100) NULL,
  `content`    TEXT NOT NULL,
  `attachment` VARCHAR(255) NULL,
  `status`     ENUM('pending','replied','resolved') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_fb_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `title`      VARCHAR(150) NOT NULL,
  `content`    TEXT NOT NULL,
  `is_read`    BOOLEAN DEFAULT FALSE,
  `link`       VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user` (`user_id`,`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. announcements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `title`      VARCHAR(255) NOT NULL,
  `content`    TEXT NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date`   DATETIME NOT NULL,
  `status`     ENUM('active','inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 14. favorites
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `favorites` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`       INT NOT NULL,
  `target_type`   ENUM('game','website','tool') NOT NULL,
  `target_id`     INT NOT NULL,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_fav` (`user_id`,`target_type`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. seo_meta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `seo_meta` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `page_url`         VARCHAR(255) NOT NULL UNIQUE,
  `meta_title`       VARCHAR(255) NULL,
  `meta_description` TEXT NULL,
  `meta_keywords`    TEXT NULL,
  `og_image`         VARCHAR(255) NULL,
  `robots`           VARCHAR(50) DEFAULT 'index,follow',
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 16. redirects
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `redirects` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `from_url`    VARCHAR(255) NOT NULL UNIQUE,
  `to_url`      VARCHAR(255) NOT NULL,
  `status_code` SMALLINT DEFAULT 301,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 17. settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `key`         VARCHAR(100) NOT NULL UNIQUE,
  `value`       TEXT NOT NULL,
  `group`       ENUM('general','seo','email','social') DEFAULT 'general',
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`key`,`value`,`group`,`description`) VALUES
  ('site_name',        'Hub Portal',      'general', 'Tên website'),
  ('site_logo',        '',                'general', 'URL logo'),
  ('site_description', 'Cổng thông tin',  'general', 'Mô tả ngắn'),
  ('contact_email',    'admin@hub.local', 'general', 'Email liên hệ'),
  ('contact_phone',    '',                'general', 'Hotline'),
  ('facebook_url',     '',                'social',  'Facebook page'),
  ('telegram_url',     '',                'social',  'Telegram'),
  ('google_analytics', '',                'seo',     'GA tracking ID')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- ------------------------------------------------------------
-- 18. uploads
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `uploads` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `file_name`    VARCHAR(255) NOT NULL,
  `file_path`    VARCHAR(255) NOT NULL,
  `mime_type`    VARCHAR(100) NULL,
  `size`         INT UNSIGNED NULL,
  `uploaded_by`  INT NULL,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 19. visit_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `visit_logs` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT NULL,
  `ip`          VARCHAR(45) NULL,
  `user_agent`  TEXT NULL,
  `page`        VARCHAR(255) NULL,
  `referer`     VARCHAR(255) NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_vl_page` (`page`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 20. download_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `download_logs` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `tool_id`     INT NOT NULL,
  `user_id`     INT NULL,
  `ip`          VARCHAR(45) NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON DELETE CASCADE,
  INDEX `idx_dl_tool` (`tool_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 21. click_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `click_logs` (
  `id`           BIGINT AUTO_INCREMENT PRIMARY KEY,
  `target_type`  ENUM('game','website') NOT NULL,
  `target_id`    INT NOT NULL,
  `user_id`      INT NULL,
  `ip`           VARCHAR(45) NULL,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cl_target` (`target_type`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 22. search_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `search_logs` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `keyword`     VARCHAR(255) NOT NULL,
  `user_id`     INT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sl_kw` (`keyword`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
