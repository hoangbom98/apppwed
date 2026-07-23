-- ============================================================
-- trade_db — Trading Platform Full Schema v2
-- MySQL 8.0+ / utf8mb4
-- ============================================================
CREATE DATABASE IF NOT EXISTS `trade_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `trade_db`;

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `username`           VARCHAR(50)  NOT NULL UNIQUE,
  `email`              VARCHAR(100) NOT NULL UNIQUE,
  `password_hash`      VARCHAR(255) NOT NULL,
  `full_name`          VARCHAR(100) NULL,
  `phone`              VARCHAR(20)  NULL,
  `avatar`             VARCHAR(255) NULL,
  `role`               ENUM('admin','support','user') DEFAULT 'user',
  `status`             ENUM('active','inactive','banned') DEFAULT 'active',
  `totp_secret`        VARCHAR(64)  NULL COMMENT 'TOTP secret for 2FA',
  `totp_enabled`       BOOLEAN DEFAULT FALSE,
  `kyc_status`         ENUM('pending','submitted','approved','rejected') DEFAULT 'pending',
  `kyc_submitted_at`   DATETIME NULL,
  `referral_code`      VARCHAR(10)  NULL UNIQUE,
  `invited_by`         INT NULL,
  `last_login_at`      DATETIME NULL,
  `last_login_ip`      VARCHAR(45)  NULL,
  `created_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_kyc`    (`kyc_status`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_email`  (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. refresh_tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `token`      VARCHAR(512) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `ip`         VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_rt_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. kyc_documents
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kyc_documents` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      INT NOT NULL,
  `doc_type`     ENUM('id_card','passport','driver_license') NOT NULL,
  `front_image`  VARCHAR(255) NULL,
  `back_image`   VARCHAR(255) NULL,
  `selfie`       VARCHAR(255) NULL,
  `real_name`    VARCHAR(100) NULL,
  `id_number`    VARCHAR(30)  NULL,
  `dob`          DATE NULL,
  `note`         TEXT NULL COMMENT 'Admin review note',
  `status`       ENUM('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by`  INT NULL,
  `reviewed_at`  DATETIME NULL,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_kyc_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. market_categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `market_categories` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(100) NOT NULL UNIQUE,
  `slug`        VARCHAR(100) NOT NULL UNIQUE,
  `icon`        VARCHAR(255) NULL,
  `sort_order`  INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `market_categories` (`name`,`slug`,`sort_order`) VALUES
  ('Crypto','crypto',1),('Forex','forex',2),('Stocks','stocks',3),
  ('Commodities','commodities',4),('Indices','indices',5),('Crypto Futures','futures',6)
ON DUPLICATE KEY UPDATE `slug`=`slug`;

-- ------------------------------------------------------------
-- 5. symbols
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `symbols` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `category_id`   INT NOT NULL,
  `symbol`        VARCHAR(20)  NOT NULL UNIQUE,
  `name`          VARCHAR(100) NOT NULL,
  `base_asset`    VARCHAR(20)  NOT NULL,
  `quote_asset`   VARCHAR(20)  NOT NULL,
  `description`   TEXT NULL,
  `pip_size`      DECIMAL(10,8) DEFAULT 0.00010000,
  `min_lot`       DECIMAL(10,4) DEFAULT 0.01,
  `max_lot`       DECIMAL(10,4) DEFAULT 100.00,
  `margin_rate`   DECIMAL(5,2)  DEFAULT 1.00 COMMENT 'Required margin %',
  `leverage_max`  INT DEFAULT 100,
  `fee_rate`      DECIMAL(5,4)  DEFAULT 0.0010 COMMENT 'Taker fee %',
  `maker_fee`     DECIMAL(5,4)  DEFAULT 0.0005 COMMENT 'Maker fee %',
  `icon_url`      VARCHAR(255)  NULL,
  `status`        ENUM('active','inactive','halted') DEFAULT 'active',
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `market_categories`(`id`) ON DELETE CASCADE,
  INDEX `idx_sym_status` (`status`),
  INDEX `idx_sym_cat`    (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. wallets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallets` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `currency`       VARCHAR(10) DEFAULT 'USD',
  `balance`        DECIMAL(20,8) DEFAULT 0.00000000,
  `frozen_balance` DECIMAL(20,8) DEFAULT 0.00000000,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_currency` (`user_id`,`currency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`          VARCHAR(36) PRIMARY KEY,   -- UUID
  `user_id`     INT NOT NULL,
  `symbol_id`   INT NOT NULL,
  `side`        ENUM('buy','sell') NOT NULL,
  `type`        ENUM('market','limit','stop_loss','take_profit') NOT NULL,
  `lot`         DECIMAL(10,4) NOT NULL,
  `price`       DECIMAL(20,8) NULL COMMENT 'NULL for market orders',
  `stop_price`  DECIMAL(20,8) NULL,
  `fill_price`  DECIMAL(20,8) NULL,
  `status`      ENUM('pending','filled','partially_filled','cancelled','rejected','expired') DEFAULT 'pending',
  `leverage`    INT DEFAULT 1,
  `fee`         DECIMAL(20,8) DEFAULT 0.00000000,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `filled_at`   DATETIME NULL,
  `expires_at`  DATETIME NULL COMMENT 'GTD order expiry',
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`symbol_id`) REFERENCES `symbols`(`id`) ON DELETE CASCADE,
  INDEX `idx_orders_user`   (`user_id`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_symbol` (`symbol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. positions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `positions` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`       INT NOT NULL,
  `symbol_id`     INT NOT NULL,
  `order_id`      VARCHAR(36) NOT NULL,
  `side`          ENUM('long','short') NOT NULL,
  `lot`           DECIMAL(10,4) NOT NULL,
  `entry_price`   DECIMAL(20,8) NOT NULL,
  `current_price` DECIMAL(20,8) NOT NULL DEFAULT 0,
  `stop_loss`     DECIMAL(20,8) NULL,
  `take_profit`   DECIMAL(20,8) NULL,
  `pnl`           DECIMAL(20,8) DEFAULT 0.00000000,
  `pnl_pct`       DECIMAL(10,4) DEFAULT 0.0000 COMMENT 'PnL %',
  `leverage`      INT DEFAULT 1,
  `margin`        DECIMAL(20,8) NOT NULL,
  `status`        ENUM('open','closed') DEFAULT 'open',
  `closed_at`     DATETIME NULL,
  `closed_price`  DECIMAL(20,8) NULL,
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`symbol_id`) REFERENCES `symbols`(`id`) ON DELETE CASCADE,
  INDEX `idx_pos_user`   (`user_id`),
  INDEX `idx_pos_status` (`status`),
  INDEX `idx_pos_symbol` (`symbol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. transactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`             BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `amount`         DECIMAL(20,8) NOT NULL,
  `currency`       VARCHAR(10) DEFAULT 'USD',
  `type`           ENUM('credit','debit') NOT NULL,
  `reference_type` ENUM('deposit','withdraw','trade_fee','trade_pnl','transfer','referral','bonus') NOT NULL,
  `reference_id`   VARCHAR(100) NOT NULL,
  `balance_after`  DECIMAL(20,8) DEFAULT 0.00000000,
  `description`    VARCHAR(255) NULL,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_tx_user` (`user_id`),
  INDEX `idx_tx_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. deposits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deposits` (
  `id`             VARCHAR(36) PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `amount`         DECIMAL(15,2) NOT NULL,
  `currency`       VARCHAR(10) DEFAULT 'VND',
  `payment_method` ENUM('momo','banking','usdt','zalopay','viettelpay') NOT NULL,
  `tx_id`          VARCHAR(100) NULL COMMENT 'External transaction ID',
  `status`         ENUM('pending','success','failed','cancelled') DEFAULT 'pending',
  `proof_image`    VARCHAR(255) NULL,
  `admin_note`     TEXT NULL,
  `processed_by`   INT NULL,
  `processed_at`   DATETIME NULL,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_dep_status` (`status`),
  INDEX `idx_dep_user`   (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. withdrawals
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id`              VARCHAR(36) PRIMARY KEY,
  `user_id`         INT NOT NULL,
  `amount`          DECIMAL(15,2) NOT NULL,
  `fee`             DECIMAL(15,2) DEFAULT 0.00,
  `currency`        VARCHAR(10) DEFAULT 'VND',
  `bank_name`       VARCHAR(100) NULL,
  `bank_code`       VARCHAR(20)  NULL,
  `bank_account`    VARCHAR(50)  NULL,
  `account_name`    VARCHAR(100) NULL,
  `status`          ENUM('pending','approved','rejected','paid','cancelled') DEFAULT 'pending',
  `admin_note`      TEXT NULL,
  `processed_by`    INT NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed_at`    DATETIME NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_wth_status` (`status`),
  INDEX `idx_wth_user`   (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. candlesticks (OHLCV data — realtime feed store)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `candlesticks` (
  `id`         BIGINT AUTO_INCREMENT PRIMARY KEY,
  `symbol_id`  INT NOT NULL,
  `interval`   ENUM('1m','3m','5m','15m','30m','1h','2h','4h','6h','12h','1d','1w','1M') NOT NULL,
  `open_time`  BIGINT UNSIGNED NOT NULL COMMENT 'Unix ms',
  `open`       DECIMAL(20,8) NOT NULL,
  `high`       DECIMAL(20,8) NOT NULL,
  `low`        DECIMAL(20,8) NOT NULL,
  `close`      DECIMAL(20,8) NOT NULL,
  `volume`     DECIMAL(24,8) NOT NULL DEFAULT 0,
  `close_time` BIGINT UNSIGNED NOT NULL,
  FOREIGN KEY (`symbol_id`) REFERENCES `symbols`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_candle` (`symbol_id`,`interval`,`open_time`),
  INDEX `idx_candle_time` (`symbol_id`,`interval`,`open_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. price_alerts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `price_alerts` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `symbol_id`  INT NOT NULL,
  `price`      DECIMAL(20,8) NOT NULL,
  `condition`  ENUM('above','below') NOT NULL,
  `note`       VARCHAR(100) NULL,
  `is_fired`   BOOLEAN DEFAULT FALSE,
  `fired_at`   DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`symbol_id`) REFERENCES `symbols`(`id`) ON DELETE CASCADE,
  INDEX `idx_alerts_user`   (`user_id`),
  INDEX `idx_alerts_status` (`is_fired`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 14. notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `title`      VARCHAR(150) NOT NULL,
  `content`    TEXT NOT NULL,
  `type`       ENUM('system','price_alert','trade','deposit','withdrawal','kyc','security') DEFAULT 'system',
  `is_read`    BOOLEAN DEFAULT FALSE,
  `link`       VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user` (`user_id`,`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. announcements (thông báo hệ thống)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `title`      VARCHAR(255) NOT NULL,
  `content`    TEXT NOT NULL,
  `type`       ENUM('info','warning','maintenance','promotion') DEFAULT 'info',
  `start_date` DATETIME NOT NULL,
  `end_date`   DATETIME NOT NULL,
  `status`     ENUM('active','inactive','draft') DEFAULT 'draft',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 16. audit_logs (lịch sử thao tác admin)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `admin_id`    INT NULL,
  `user_id`     INT NULL COMMENT 'User bị tác động',
  `action`      VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50)  NULL,
  `target_id`   VARCHAR(100) NULL,
  `old_value`   JSON NULL,
  `new_value`   JSON NULL,
  `ip`          VARCHAR(45)  NULL,
  `user_agent`  VARCHAR(255) NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_user`   (`user_id`),
  INDEX `idx_audit_date`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 17. settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `key`         VARCHAR(100) NOT NULL UNIQUE,
  `value`       TEXT NOT NULL,
  `group`       ENUM('general','fee','margin','leverage','withdrawal','security') DEFAULT 'general',
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`key`,`value`,`group`,`description`) VALUES
  ('default_leverage',      '10',     'leverage',   'Đòn bẩy mặc định'),
  ('max_leverage',          '100',    'leverage',   'Đòn bẩy tối đa'),
  ('taker_fee_rate',        '0.001',  'fee',        'Phí taker (%)'),
  ('maker_fee_rate',        '0.0005', 'fee',        'Phí maker (%)'),
  ('withdrawal_fee',        '0',      'fee',        'Phí rút tiền (VND, 0 = miễn phí)'),
  ('min_deposit',           '100000', 'general',    'Nạp tối thiểu (VND)'),
  ('min_withdrawal',        '200000', 'general',    'Rút tối thiểu (VND)'),
  ('max_withdrawal_daily',  '50000000','withdrawal', 'Rút tối đa/ngày (VND)'),
  ('max_open_positions',    '10',     'margin',     'Số vị thế mở tối đa/user'),
  ('maintenance',           'false',  'general',    'Chế độ bảo trì'),
  ('kyc_required_withdraw', 'true',   'security',   'Yêu cầu KYC để rút tiền'),
  ('2fa_required_withdraw', 'false',  'security',   'Yêu cầu 2FA để rút tiền')
ON DUPLICATE KEY UPDATE `key`=`key`;
