-- ============================================================
-- game_db — Game Platform Full Schema v2
-- MySQL 8.0+ / utf8mb4
-- ============================================================
CREATE DATABASE IF NOT EXISTS `game_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `game_db`;

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `username`          VARCHAR(50)  NOT NULL UNIQUE,
  `email`             VARCHAR(100) NOT NULL UNIQUE,
  `password_hash`     VARCHAR(255) NOT NULL,
  `full_name`         VARCHAR(100) NULL,
  `phone`             VARCHAR(20)  NULL,
  `avatar`            VARCHAR(255) NULL,
  `role`              ENUM('superadmin','admin','agent','support','user') DEFAULT 'user',
  `status`            ENUM('active','inactive','banned') DEFAULT 'active',
  `balance`           DECIMAL(15,2) DEFAULT 0.00,
  `referral_code`     VARCHAR(10)  NULL UNIQUE,
  `invited_by`        INT NULL,
  `last_login_ip`     VARCHAR(45)  NULL,
  `last_login_at`     DATETIME NULL,
  `vip_level`         TINYINT UNSIGNED DEFAULT 0,
  `total_deposit`     DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Tổng nạp tích lũy',
  `total_bet`         DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Tổng cược tích lũy',
  `created_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role`     (`role`),
  INDEX `idx_users_status`   (`status`),
  INDEX `idx_users_vip`      (`vip_level`),
  INDEX `idx_users_invited`  (`invited_by`)
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
-- 3. game_categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_categories` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100) NOT NULL,
  `slug`       VARCHAR(100) NOT NULL UNIQUE,
  `icon`       VARCHAR(255) NULL COMMENT 'URL ảnh icon',
  `sort_order` INT DEFAULT 0,
  `status`     ENUM('active','inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `game_categories` (`name`,`slug`,`sort_order`) VALUES
  ('Slots','slots',1),('Casino','casino',2),('Thể thao','sports',3),
  ('Xổ số','lottery',4),('Bắn cá','fishing',5),('Live casino','live',6),
  ('Bài','cards',7),('Nổ hũ','jackpot',8)
ON DUPLICATE KEY UPDATE `slug`=`slug`;

-- ------------------------------------------------------------
-- 4. games
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `games` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(150) NOT NULL,
  `slug`         VARCHAR(150) NOT NULL UNIQUE,
  `category_id`  INT NOT NULL,
  `thumbnail`    VARCHAR(255) NULL,
  `description`  TEXT NULL,
  `type`         VARCHAR(50)  NOT NULL,
  `provider`     VARCHAR(50)  NOT NULL,
  `api_endpoint` VARCHAR(255) NULL,
  `params`       JSON NULL,
  `is_hot`       BOOLEAN DEFAULT FALSE,
  `is_new`       BOOLEAN DEFAULT FALSE,
  `play_count`   BIGINT UNSIGNED DEFAULT 0,
  `status`       ENUM('active','inactive','maintenance') DEFAULT 'active',
  `sort_order`   INT DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `game_categories`(`id`) ON DELETE CASCADE,
  INDEX `idx_games_status`   (`status`),
  INDEX `idx_games_provider` (`provider`),
  INDEX `idx_games_hot`      (`is_hot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. game_rooms
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_rooms` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `game_id`     INT NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `min_bet`     DECIMAL(15,2) DEFAULT 0.00,
  `max_bet`     DECIMAL(15,2) DEFAULT 100000.00,
  `max_players` INT DEFAULT 100,
  `status`      ENUM('active','closed','maintenance') DEFAULT 'active',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. game_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_sessions` (
  `id`            BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`       INT NOT NULL,
  `game_id`       INT NOT NULL,
  `room_id`       INT NULL,
  `session_token` VARCHAR(255) NOT NULL UNIQUE,
  `bet_amount`    DECIMAL(15,2) DEFAULT 0.00,
  `win_amount`    DECIMAL(15,2) DEFAULT 0.00,
  `result`        JSON NULL,
  `status`        ENUM('playing','finished','abandoned') DEFAULT 'playing',
  `start_time`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `end_time`      TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE,
  INDEX `idx_sess_user`   (`user_id`),
  INDEX `idx_sess_status` (`status`),
  INDEX `idx_sess_game`   (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. wallets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallets` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `currency`       VARCHAR(10) DEFAULT 'VND',
  `balance`        DECIMAL(15,2) DEFAULT 0.00,
  `frozen_balance` DECIMAL(15,2) DEFAULT 0.00,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_currency` (`user_id`,`currency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. bank_accounts (tài khoản ngân hàng người dùng)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `bank_name`      VARCHAR(100) NOT NULL,
  `bank_code`      VARCHAR(20)  NULL,
  `account_number` VARCHAR(50)  NOT NULL,
  `account_name`   VARCHAR(100) NOT NULL,
  `is_default`     BOOLEAN DEFAULT FALSE,
  `status`         ENUM('active','inactive') DEFAULT 'active',
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_ba_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. orders (nạp / rút tiền)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`             VARCHAR(50) PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `order_type`     ENUM('deposit','withdraw','transfer') NOT NULL,
  `amount`         DECIMAL(15,2) NOT NULL,
  `currency`       VARCHAR(10) DEFAULT 'VND',
  `status`         ENUM('pending','success','failed','cancelled') DEFAULT 'pending',
  `payment_method` ENUM('momo','banking','usdt','card','zalopay','viettelpay') NOT NULL,
  `transaction_id` VARCHAR(100) NULL,
  `proof_image`    VARCHAR(255) NULL,
  `bank_account_id` INT NULL COMMENT 'FK tới bank_accounts',
  `admin_note`     TEXT NULL,
  `description`    TEXT NULL,
  `processed_by`   INT NULL COMMENT 'admin_id duyệt',
  `processed_at`   DATETIME NULL,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_orders_user`   (`user_id`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_type`   (`order_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. transactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`             BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `amount`         DECIMAL(15,2) NOT NULL,
  `type`           ENUM('credit','debit') NOT NULL,
  `reference_type` ENUM('order','bonus','commission','game_bet','game_win','manual','vip_reward','referral') NOT NULL,
  `reference_id`   VARCHAR(100) NOT NULL,
  `balance_after`  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `description`    VARCHAR(255) NULL,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_tx_user`   (`user_id`),
  INDEX `idx_tx_ref`    (`reference_type`),
  INDEX `idx_tx_date`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. agents (đại lý)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `agents` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`          INT NOT NULL UNIQUE,
  `parent_agent_id`  INT NULL,
  `level`            INT DEFAULT 1,
  `commission_rate`  DECIMAL(5,2) DEFAULT 0.00,
  `total_commission` DECIMAL(15,2) DEFAULT 0.00,
  `total_downline`   INT DEFAULT 0,
  `status`           ENUM('active','inactive','suspended') DEFAULT 'active',
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. referrals
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referrals` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `referrer_id`       INT NOT NULL,
  `referee_id`        INT NOT NULL,
  `commission_amount` DECIMAL(15,2) DEFAULT 0.00,
  `status`            ENUM('active','inactive') DEFAULT 'active',
  `created_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`referee_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_referrer_referee` (`referrer_id`,`referee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. vip_levels (cấu hình VIP)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vip_levels` (
  `level`             TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  `name`              VARCHAR(50) NOT NULL,
  `min_deposit`       DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng nạp tối thiểu',
  `min_bet`           DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng cược tối thiểu',
  `daily_withdraw`    DECIMAL(15,2) DEFAULT NULL COMMENT 'Hạn mức rút/ngày (NULL = không giới hạn)',
  `weekly_withdraw`   DECIMAL(15,2) DEFAULT NULL,
  `cashback_rate`     DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Hoàn tiền (%)',
  `birthday_bonus`    DECIMAL(15,2) DEFAULT 0.00,
  `upgrade_bonus`     DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Thưởng thăng cấp',
  `badge_image`       VARCHAR(255) NULL,
  `color_hex`         VARCHAR(7) DEFAULT '#888888',
  `description`       TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vip_levels` (`level`,`name`,`min_deposit`,`min_bet`,`cashback_rate`,`upgrade_bonus`,`color_hex`) VALUES
  (0,'Thường',0,0,0,0,'#888888'),
  (1,'Bronze',1000000,5000000,0.50,50000,'#CD7F32'),
  (2,'Silver',5000000,20000000,0.80,200000,'#C0C0C0'),
  (3,'Gold',20000000,80000000,1.00,500000,'#FFD700'),
  (4,'Platinum',50000000,200000000,1.50,1000000,'#E5E4E2'),
  (5,'Diamond',200000000,800000000,2.00,5000000,'#B9F2FF'),
  (6,'Elite',500000000,2000000000,2.50,20000000,'#FF4081'),
  (7,'Master',1000000000,5000000000,3.00,50000000,'#AA00FF'),
  (8,'Legend',3000000000,15000000000,3.50,100000000,'#FF6D00'),
  (9,'Supreme',10000000000,50000000000,4.00,500000000,'#00BCD4'),
  (10,'VVIP',30000000000,100000000000,5.00,1000000000,'#F44336')
ON DUPLICATE KEY UPDATE `level`=`level`;

-- ------------------------------------------------------------
-- 14. vip_rewards (lịch sử nhận thưởng VIP)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vip_rewards` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT NOT NULL,
  `vip_level`   TINYINT UNSIGNED NOT NULL,
  `reward_type` ENUM('upgrade_bonus','birthday','cashback','weekly','monthly') NOT NULL,
  `amount`      DECIMAL(15,2) NOT NULL,
  `claimed_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_vr_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NULL COMMENT 'NULL = broadcast tới tất cả',
  `title`      VARCHAR(150) NOT NULL,
  `content`    TEXT NOT NULL,
  `type`       ENUM('system','transaction','game','promotion','vip','agent') DEFAULT 'system',
  `is_read`    BOOLEAN DEFAULT FALSE,
  `link`       VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user` (`user_id`,`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 16. messages (hỗ trợ / chat)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `sender_id`   INT NOT NULL,
  `receiver_id` INT NULL,
  `room`        VARCHAR(50) DEFAULT 'general',
  `content`     TEXT NOT NULL,
  `type`        VARCHAR(20) DEFAULT 'text',
  `read_at`     TIMESTAMP NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_msg_room` (`room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 17. promotions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `promotions` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(150) NOT NULL,
  `slug`        VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `banner`      VARCHAR(255) NULL,
  `type`        ENUM('bonus','cashback','free_spin','reload','birthday','vip_only') NOT NULL,
  `value`       DECIMAL(15,2) NOT NULL,
  `min_deposit` DECIMAL(15,2) DEFAULT 0.00,
  `max_bonus`   DECIMAL(15,2) DEFAULT 0.00 COMMENT '0 = không giới hạn',
  `rollover'    INT DEFAULT 1 COMMENT 'Số lần cược yêu cầu trước khi rút',
  `start_date`  DATETIME NOT NULL,
  `end_date`    DATETIME NOT NULL,
  `conditions`  JSON NULL,
  `vip_min`     TINYINT UNSIGNED DEFAULT 0 COMMENT 'Cấp VIP tối thiểu',
  `status`      ENUM('active','inactive','draft') DEFAULT 'draft',
  `sort_order`  INT DEFAULT 0,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 18. user_promotions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_promotions` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      INT NOT NULL,
  `promotion_id` INT NOT NULL,
  `status`       ENUM('claimed','used','expired','rejected') DEFAULT 'claimed',
  `claimed_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expired_at`   DATETIME NULL,
  FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_promo` (`user_id`,`promotion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 19. kyc_requests (xác minh tài khoản)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kyc_requests` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      INT NOT NULL,
  `doc_type`     ENUM('id_card','passport','driver_license') NOT NULL,
  `front_image`  VARCHAR(255) NULL,
  `back_image`   VARCHAR(255) NULL,
  `selfie`       VARCHAR(255) NULL,
  `real_name`    VARCHAR(100) NULL,
  `id_number`    VARCHAR(30) NULL,
  `dob`          DATE NULL,
  `note`         TEXT NULL,
  `status`       ENUM('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by`  INT NULL,
  `reviewed_at`  DATETIME NULL,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_kyc_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 20. ip_blacklist
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ip_blacklist` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `ip`         VARCHAR(45) NOT NULL UNIQUE,
  `reason`     VARCHAR(255) NULL,
  `expires_at` DATETIME NULL COMMENT 'NULL = vĩnh viễn',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 21. settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `key`         VARCHAR(100) NOT NULL UNIQUE,
  `value`       TEXT NOT NULL,
  `group`       ENUM('general','payment','game','commission','vip','security') DEFAULT 'general',
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`key`,`value`,`group`,`description`) VALUES
  ('min_deposit',           '50000',   'payment',    'Nạp tối thiểu (VND)'),
  ('min_withdraw',          '100000',  'payment',    'Rút tối thiểu (VND)'),
  ('max_withdraw_daily',    '50000000','payment',    'Rút tối đa/ngày (VND)'),
  ('commission_f1',         '5.00',    'commission', 'Hoa hồng F1 (%)'),
  ('commission_f2',         '2.00',    'commission', 'Hoa hồng F2 (%)'),
  ('commission_f3',         '1.00',    'commission', 'Hoa hồng F3 (%)'),
  ('maintenance',           'false',   'general',    'Chế độ bảo trì'),
  ('site_name',             'GameX',   'general',    'Tên website'),
  ('max_login_attempts',    '5',       'security',   'Số lần đăng nhập sai tối đa'),
  ('login_lockout_minutes', '30',      'security',   'Thời gian khoá tài khoản (phút)')
ON DUPLICATE KEY UPDATE `key`=`key`;
