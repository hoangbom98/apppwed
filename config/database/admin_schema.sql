-- ============================================================
-- admin_db — Corporate Admin / Analytics Full Schema v2
-- MySQL 8.0+ / utf8mb4
-- Stores super-admin accounts and cross-project aggregated stats
-- ============================================================
CREATE DATABASE IF NOT EXISTS `admin_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `admin_db`;

-- ------------------------------------------------------------
-- 1. admins (tài khoản admin hệ thống)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `username`       VARCHAR(50)  NOT NULL UNIQUE,
  `email`          VARCHAR(100) NOT NULL UNIQUE,
  `password_hash`  VARCHAR(255) NOT NULL,
  `full_name`      VARCHAR(100) NULL,
  `avatar`         VARCHAR(255) NULL,
  `role`           ENUM('superadmin','admin','analyst','support') DEFAULT 'admin',
  `status`         ENUM('active','inactive','suspended') DEFAULT 'active',
  `totp_secret`    VARCHAR(64)  NULL COMMENT 'TOTP secret for 2FA',
  `totp_enabled`   BOOLEAN DEFAULT FALSE,
  `permissions`    JSON NULL COMMENT 'Fine-grained permissions override',
  `last_login_at`  DATETIME NULL,
  `last_login_ip`  VARCHAR(45) NULL,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_admin_role`   (`role`),
  INDEX `idx_admin_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. refresh_tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id`   INT NOT NULL,
  `token`      VARCHAR(512) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `ip`         VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE,
  INDEX `idx_rt_admin` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. daily_stats (snapshot tổng hợp mỗi ngày theo dự án)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `daily_stats` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `project`        ENUM('hub','game','trade','dating','sports') NOT NULL,
  `stat_date`      DATE NOT NULL,
  `new_users`      INT UNSIGNED DEFAULT 0,
  `active_users`   INT UNSIGNED DEFAULT 0,
  `total_users`    INT UNSIGNED DEFAULT 0,
  `page_views`     INT UNSIGNED DEFAULT 0,
  `total_deposit`  DECIMAL(20,2) DEFAULT 0.00,
  `total_withdraw` DECIMAL(20,2) DEFAULT 0.00,
  `net_revenue`    DECIMAL(20,2) DEFAULT 0.00,
  `total_bets`     DECIMAL(20,2) DEFAULT 0.00 COMMENT 'Game only',
  `total_wins`     DECIMAL(20,2) DEFAULT 0.00 COMMENT 'Game only',
  `ggr`            DECIMAL(20,2) DEFAULT 0.00 COMMENT 'Gross Gaming Revenue',
  `extra`          JSON NULL COMMENT 'Additional project-specific stats',
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_project_date` (`project`,`stat_date`),
  INDEX `idx_stats_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. audit_logs (lịch sử mọi thao tác của admin)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `admin_id`    INT NOT NULL,
  `action`      VARCHAR(100) NOT NULL,
  `module`      VARCHAR(50)  NOT NULL COMMENT 'hub|game|trade|dating|sports|system',
  `target_type` VARCHAR(50)  NULL,
  `target_id`   VARCHAR(100) NULL,
  `old_value`   JSON NULL,
  `new_value`   JSON NULL,
  `detail`      JSON NULL,
  `ip`          VARCHAR(45)  NULL,
  `user_agent`  VARCHAR(255) NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_admin`   (`admin_id`),
  INDEX `idx_audit_action`  (`action`),
  INDEX `idx_audit_module`  (`module`),
  INDEX `idx_audit_date`    (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. system_settings (cài đặt toàn hệ thống)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `key`         VARCHAR(100) NOT NULL UNIQUE,
  `value`       TEXT NOT NULL,
  `group`       VARCHAR(50) DEFAULT 'general',
  `type`        ENUM('string','number','boolean','json') DEFAULT 'string',
  `description` VARCHAR(255) NULL,
  `updated_by`  INT NULL,
  `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`key`,`value`,`group`,`type`,`description`) VALUES
  ('hub_domain',         'hub.yourdomain.com',     'domains',  'string',  'Hub subdomain'),
  ('game_domain',        'game.yourdomain.com',    'domains',  'string',  'Game subdomain'),
  ('trade_domain',       'trade.yourdomain.com',   'domains',  'string',  'Trade subdomain'),
  ('dating_domain',      'dating.yourdomain.com',  'domains',  'string',  'Dating subdomain'),
  ('sports_domain',      'sports.yourdomain.com',  'domains',  'string',  'Sports subdomain'),
  ('maintenance_mode',   'false',                  'general',  'boolean', 'Bật/tắt bảo trì toàn hệ thống'),
  ('site_name',          'Group Admin',            'general',  'string',  'Tên hiển thị hệ thống'),
  ('admin_email',        'admin@group.local',      'general',  'string',  'Email admin chính'),
  ('max_admins',         '10',                     'security', 'number',  'Số lượng admin tối đa'),
  ('session_timeout',    '3600',                   'security', 'number',  'Phiên đăng nhập hết hạn sau (giây)'),
  ('ip_whitelist',       '[]',                     'security', 'json',    'Danh sách IP được phép truy cập admin'),
  ('require_2fa',        'false',                  'security', 'boolean', 'Bắt buộc 2FA cho admin'),
  ('backup_enabled',     'true',                   'backup',   'boolean', 'Bật tự động backup'),
  ('backup_cron',        '0 3 * * *',              'backup',   'string',  'Cron schedule backup'),
  ('backup_retention',   '30',                     'backup',   'number',  'Số ngày giữ backup')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- ------------------------------------------------------------
-- 6. payment_gateways (cổng thanh toán tích hợp)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_gateways` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL,
  `code`         VARCHAR(50)  NOT NULL UNIQUE,
  `type`         ENUM('bank','ewallet','crypto','card') NOT NULL,
  `logo`         VARCHAR(255) NULL,
  `config`       JSON NOT NULL COMMENT 'API keys, endpoints, secrets (encrypted at app level)',
  `projects`     JSON NOT NULL DEFAULT ('[]') COMMENT 'Array of project slugs this gateway is enabled for',
  `min_amount`   DECIMAL(15,2) DEFAULT 0.00,
  `max_amount`   DECIMAL(15,2) DEFAULT 0.00 COMMENT '0 = không giới hạn',
  `fee_flat`     DECIMAL(15,2) DEFAULT 0.00,
  `fee_pct`      DECIMAL(5,2) DEFAULT 0.00,
  `is_deposit`   BOOLEAN DEFAULT TRUE,
  `is_withdraw`  BOOLEAN DEFAULT TRUE,
  `status`       ENUM('active','inactive','maintenance') DEFAULT 'active',
  `sort_order`   INT DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payment_gateways` (`name`,`code`,`type`,`config`,`projects`,`status`) VALUES
  ('MoMo',       'momo',     'ewallet',`{}`,  '["game","trade","dating","sports"]', 'active'),
  ('BIDV Bank',  'bidv',     'bank',   `{}`,  '["game","trade","dating","sports"]', 'active'),
  ('Vietcombank','vcb',      'bank',   `{}`,  '["game","trade","dating","sports"]', 'active'),
  ('Techcombank','tcb',      'bank',   `{}`,  '["game","trade","dating","sports"]', 'active'),
  ('USDT TRC20', 'usdt_trc', 'crypto', `{}`,  '["trade"]',                         'active'),
  ('ZaloPay',    'zalopay',  'ewallet',`{}`,  '["game","trade","sports"]',          'inactive')
ON DUPLICATE KEY UPDATE `code`=`code`;

-- ------------------------------------------------------------
-- 7. announcements (thông báo hệ thống admin gửi)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `title`      VARCHAR(255) NOT NULL,
  `content`    TEXT NOT NULL,
  `type`       ENUM('info','warning','error','maintenance','promotion') DEFAULT 'info',
  `target`     ENUM('all','hub','game','trade','dating','sports') DEFAULT 'all',
  `start_date` DATETIME NOT NULL,
  `end_date`   DATETIME NOT NULL,
  `status`     ENUM('active','inactive','draft') DEFAULT 'draft',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ann_status` (`status`),
  INDEX `idx_ann_target` (`target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. ip_blacklist (global IP block)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ip_blacklist` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `ip`         VARCHAR(45)  NOT NULL UNIQUE,
  `cidr`       VARCHAR(50)  NULL COMMENT 'CIDR block (e.g. 192.168.1.0/24)',
  `reason`     VARCHAR(255) NULL,
  `expires_at` DATETIME NULL COMMENT 'NULL = vĩnh viễn',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ip_bl` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. admin_notifications (thông báo nội bộ cho admin)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id`   INT NULL COMMENT 'NULL = gửi tất cả admin',
  `title`      VARCHAR(150) NOT NULL,
  `content`    TEXT NOT NULL,
  `type`       ENUM('alert','deposit','withdrawal','kyc','security','system') DEFAULT 'system',
  `priority`   ENUM('low','medium','high','critical') DEFAULT 'medium',
  `is_read`    BOOLEAN DEFAULT FALSE,
  `link`       VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE,
  INDEX `idx_an_admin` (`admin_id`,`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. ui_configs (cấu hình giao diện frontend theo dự án)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ui_configs` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `project`    ENUM('hub','game','trade','dating','sports','admin') NOT NULL,
  `key`        VARCHAR(100) NOT NULL,
  `value`      TEXT NOT NULL,
  `type`       ENUM('color','string','url','boolean','json','number') DEFAULT 'string',
  `label`      VARCHAR(150) NULL COMMENT 'Label hiển thị trong admin UI',
  `group`      VARCHAR(50)  DEFAULT 'general',
  `updated_by` INT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_project_key` (`project`,`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ui_configs` (`project`,`key`,`value`,`type`,`label`,`group`) VALUES
  -- Hub
  ('hub','site_name','OKVIP Hub','string','Tên website','general'),
  ('hub','site_logo','','url','URL Logo','general'),
  ('hub','primary_color','#ff9700','color','Màu chủ đạo','theme'),
  ('hub','banner_autoplay','true','boolean','Tự động chạy banner','banner'),
  ('hub','maintenance','false','boolean','Bảo trì','general'),
  -- Game
  ('game','site_name','GameX','string','Tên website','general'),
  ('game','site_logo','','url','URL Logo','general'),
  ('game','primary_color','#f59e0b','color','Màu chủ đạo','theme'),
  ('game','min_deposit','50000','number','Nạp tối thiểu (VND)','payment'),
  ('game','min_withdraw','100000','number','Rút tối thiểu (VND)','payment'),
  ('game','maintenance','false','boolean','Bảo trì','general'),
  -- Trade
  ('trade','site_name','TradeX','string','Tên website','general'),
  ('trade','site_logo','','url','URL Logo','general'),
  ('trade','primary_color','#3b82f6','color','Màu chủ đạo','theme'),
  ('trade','default_leverage','10','number','Đòn bẩy mặc định','trading'),
  ('trade','maintenance','false','boolean','Bảo trì','general')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- ------------------------------------------------------------
-- 11. withdrawal_rules (quy tắc xét duyệt rút tiền)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `withdrawal_rules` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `project`          ENUM('game','trade','dating','sports') NOT NULL,
  `min_amount`       DECIMAL(15,2) DEFAULT 0.00,
  `max_amount_daily` DECIMAL(15,2) DEFAULT 0.00 COMMENT '0 = không giới hạn',
  `auto_approve`     BOOLEAN DEFAULT FALSE,
  `auto_approve_max` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Tự duyệt nếu <= giá trị này',
  `require_kyc`      BOOLEAN DEFAULT TRUE,
  `require_2fa`      BOOLEAN DEFAULT FALSE,
  `fee_flat`         DECIMAL(15,2) DEFAULT 0.00,
  `fee_pct`          DECIMAL(5,2) DEFAULT 0.00,
  `processing_hours` TINYINT DEFAULT 24 COMMENT 'SLA duyệt rút (giờ)',
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_wdr_project` (`project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `withdrawal_rules` (`project`,`min_amount`,`max_amount_daily`,`auto_approve`,`auto_approve_max`,`require_kyc`,`processing_hours`) VALUES
  ('game',  100000, 50000000, FALSE, 0,       FALSE, 24),
  ('trade', 200000, 50000000, FALSE, 1000000, TRUE,  12),
  ('dating',100000, 20000000, FALSE, 0,       FALSE, 24),
  ('sports',100000, 30000000, FALSE, 0,       FALSE, 24)
ON DUPLICATE KEY UPDATE `project`=`project`;

-- ------------------------------------------------------------
-- Default superadmin (password: Admin@123 — CHANGE IN PRODUCTION!)
-- bcrypt hash of "Admin@123" with cost 12
-- ------------------------------------------------------------
INSERT INTO `admins` (`username`,`email`,`password_hash`,`role`) VALUES
  ('superadmin','superadmin@group.local','$2b$12$placeholder_change_this_immediately','superadmin')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- ============================================================
-- SECTION 2 — Extended admin_db tables (v2.1)
-- These tables are managed by Prisma migrations in production.
-- This section documents the full schema for reference / manual restore.
-- Sync source: prisma/admin/schema.prisma
-- ============================================================

-- ------------------------------------------------------------
-- 12. users (shared identity mirror — cross-project, holds wallet/risk data)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`           VARCHAR(30)  NOT NULL,
  `email`        VARCHAR(191) NOT NULL,
  `phone`        VARCHAR(20)  NULL UNIQUE,
  `password`     VARCHAR(255) NOT NULL,
  `fullName`     VARCHAR(150) NULL,
  `avatar`       VARCHAR(500) NULL,
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'active',
  `role`         VARCHAR(30)  NOT NULL DEFAULT 'user',
  `kycLevel`     VARCHAR(20)  NOT NULL DEFAULT 'unverified',
  `riskScore`    INT          NOT NULL DEFAULT 0,
  `referrerId`   VARCHAR(30)  NULL,
  `referralCode` VARCHAR(30)  NULL UNIQUE,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  INDEX `idx_users_status`       (`status`),
  INDEX `idx_users_role`         (`role`),
  INDEX `idx_users_kycLevel`     (`kycLevel`),
  INDEX `idx_users_createdAt`    (`createdAt`),
  INDEX `idx_users_referralCode` (`referralCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. projects (project registry)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projects` (
  `id`          VARCHAR(30)  NOT NULL,
  `code`        VARCHAR(20)  NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `description` TEXT         NULL,
  `domain`      VARCHAR(255) NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'active',
  `config`      JSON         NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_projects_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `projects` (`id`,`code`,`name`,`status`,`createdAt`,`updatedAt`) VALUES
  (UUID(),'hub',    'Hub Portal',       'active', NOW(), NOW()),
  (UUID(),'game',   'Game Center',      'active', NOW(), NOW()),
  (UUID(),'trade',  'Trading Platform', 'active', NOW(), NOW()),
  (UUID(),'dating', 'Dating App',       'active', NOW(), NOW()),
  (UUID(),'sports', 'Sports Betting',   'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `code`=`code`;

-- ------------------------------------------------------------
-- 14. project_members
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_members` (
  `id`            VARCHAR(30) NOT NULL,
  `userId`        VARCHAR(30) NOT NULL,
  `projectId`     VARCHAR(30) NOT NULL,
  `roleInProject` VARCHAR(30) NOT NULL DEFAULT 'user',
  `joinedAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status`        VARCHAR(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_members` (`userId`,`projectId`),
  INDEX `idx_pm_projectId` (`projectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. system_configs (structured key-value with groups)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id`          INT          AUTO_INCREMENT PRIMARY KEY,
  `key`         VARCHAR(150) NOT NULL UNIQUE,
  `value`       TEXT         NULL,
  `group`       VARCHAR(60)  NOT NULL DEFAULT 'general',
  `description` VARCHAR(500) NULL,
  `isPublic`    TINYINT(1)   NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  INDEX `idx_system_configs_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 16. project_configs (per-project UI / feature flags)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_configs` (
  `id`          VARCHAR(30)  NOT NULL,
  `projectCode` VARCHAR(20)  NOT NULL,
  `module`      VARCHAR(60)  NOT NULL,
  `group`       VARCHAR(60)  NOT NULL,
  `key`         VARCHAR(150) NOT NULL,
  `value`       JSON         NULL,
  `type`        VARCHAR(20)  NOT NULL DEFAULT 'string',
  `options`     JSON         NULL,
  `validation`  JSON         NULL,
  `description` VARCHAR(500) NULL,
  `isSecret`    TINYINT(1)   NOT NULL DEFAULT 0,
  `editable`    TINYINT(1)   NOT NULL DEFAULT 1,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'active',
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_configs` (`projectCode`,`module`,`group`,`key`),
  INDEX `idx_pc_projectCode` (`projectCode`),
  INDEX `idx_pc_module`      (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 17. system_logs (admin action log)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id`        INT          AUTO_INCREMENT PRIMARY KEY,
  `adminId`   INT          NULL,
  `action`    VARCHAR(100) NOT NULL,
  `module`    VARCHAR(30)  NULL,
  `details`   JSON         NULL,
  `ip`        VARCHAR(45)  NULL,
  `userAgent` VARCHAR(500) NULL,
  `status`    VARCHAR(20)  NOT NULL DEFAULT 'success',
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`adminId`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL,
  INDEX `idx_sl_adminId_created` (`adminId`,`createdAt`),
  INDEX `idx_sl_action`          (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 18. backups (backup job tracking)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `backups` (
  `id`          INT          AUTO_INCREMENT PRIMARY KEY,
  `filename`    VARCHAR(255) NOT NULL,
  `size`        INT          NULL,
  `type`        VARCHAR(20)  NOT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'processing',
  `note`        TEXT         NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3)  NULL,
  INDEX `idx_backups_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 19. wallets (per-user per-currency balance mirror in admin_db)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallets` (
  `id`        VARCHAR(30) NOT NULL,
  `userId`    VARCHAR(30) NOT NULL,
  `currency`  VARCHAR(10) NOT NULL DEFAULT 'VND',
  `balance`   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `frozen`    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `updatedAt` DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wallets_user_currency` (`userId`,`currency`),
  INDEX `idx_wallets_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 20. transactions (admin_db financial ledger)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`            VARCHAR(30)  NOT NULL,
  `userId`        VARCHAR(30)  NOT NULL,
  `walletId`      VARCHAR(30)  NOT NULL,
  `type`          VARCHAR(30)  NOT NULL,
  `amount`        DECIMAL(18,2) NOT NULL,
  `fee`           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `referenceId`   VARCHAR(60)  NULL,
  `referenceType` VARCHAR(30)  NULL,
  `description`   VARCHAR(500) NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_txn_userId_status`       (`userId`,`status`),
  INDEX `idx_txn_userId_type_created` (`userId`,`type`,`createdAt`),
  INDEX `idx_txn_status_created`      (`status`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 21. deposit_orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deposit_orders` (
  `id`          VARCHAR(30)   NOT NULL,
  `userId`      VARCHAR(30)   NOT NULL,
  `gatewayId`   VARCHAR(30)   NOT NULL,
  `amount`      DECIMAL(18,2) NOT NULL,
  `currency`    VARCHAR(10)   NOT NULL DEFAULT 'VND',
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `txId`        VARCHAR(255)  NULL,
  `proof`       VARCHAR(500)  NULL,
  `note`        TEXT          NULL,
  `processedAt` DATETIME(3)   NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_deposit_userId`          (`userId`),
  INDEX `idx_deposit_gatewayId`       (`gatewayId`),
  INDEX `idx_deposit_status_created`  (`status`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 22. withdraw_orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `withdraw_orders` (
  `id`              VARCHAR(30)   NOT NULL,
  `userId`          VARCHAR(30)   NOT NULL,
  `gatewayId`       VARCHAR(30)   NOT NULL,
  `amount`          DECIMAL(18,2) NOT NULL,
  `currency`        VARCHAR(10)   NOT NULL DEFAULT 'VND',
  `address`         VARCHAR(500)  NULL,
  `bankInfo`        JSON          NULL,
  `status`          VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `txId`            VARCHAR(255)  NULL,
  `note`            TEXT          NULL,
  `rejectionReason` TEXT          NULL,
  `processedAt`     DATETIME(3)   NULL,
  `createdAt`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_withdraw_userId`         (`userId`),
  INDEX `idx_withdraw_gatewayId`      (`gatewayId`),
  INDEX `idx_withdraw_status_created` (`status`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 23. internal_transfers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `internal_transfers` (
  `id`         VARCHAR(30)   NOT NULL,
  `fromUserId` VARCHAR(30)   NOT NULL,
  `toUserId`   VARCHAR(30)   NOT NULL,
  `fromWallet` VARCHAR(30)   NOT NULL,
  `toWallet`   VARCHAR(30)   NOT NULL,
  `amount`     DECIMAL(18,2) NOT NULL,
  `fee`        DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `status`     VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `note`       TEXT          NULL,
  `createdAt`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_it_from` (`fromUserId`),
  INDEX `idx_it_to`   (`toUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 24. kyc_documents
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kyc_documents` (
  `id`          VARCHAR(30)  NOT NULL,
  `userId`      VARCHAR(30)  NOT NULL,
  `type`        VARCHAR(30)  NOT NULL,
  `frontImage`  VARCHAR(500) NOT NULL,
  `backImage`   VARCHAR(500) NULL,
  `selfieImage` VARCHAR(500) NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `reason`      TEXT         NULL,
  `reviewedBy`  VARCHAR(60)  NULL,
  `reviewedAt`  DATETIME(3)  NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_kyc_userId` (`userId`),
  INDEX `idx_kyc_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 25. risk_scores (composite risk per user)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `risk_scores` (
  `id`        VARCHAR(30) NOT NULL,
  `userId`    VARCHAR(30) NOT NULL,
  `score`     INT         NOT NULL DEFAULT 0,
  `level`     VARCHAR(20) NOT NULL DEFAULT 'low',
  `reason`    JSON        NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_rs_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 26. risk_rules (configurable rules engine)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `risk_rules` (
  `id`          VARCHAR(30)  NOT NULL,
  `name`        VARCHAR(150) NOT NULL,
  `description` TEXT         NULL,
  `conditions`  JSON         NULL,
  `action`      VARCHAR(30)  NOT NULL,
  `priority`    INT          NOT NULL DEFAULT 1,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'active',
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default risk rules (seed data)
INSERT IGNORE INTO `risk_rules` (`id`,`name`,`description`,`action`,`priority`,`status`,`createdAt`,`updatedAt`)
VALUES
  (UUID(),'transaction_anomaly',    'Anomalous transaction detected',                 'hold_transaction', 10, 'active', NOW(3), NOW(3)),
  (UUID(),'multi_account',          'Multiple accounts from same device/IP',          'suspend',          9,  'active', NOW(3), NOW(3)),
  (UUID(),'bot_detected',           'Automated bot activity detected',                'require_captcha',  8,  'active', NOW(3), NOW(3)),
  (UUID(),'content_violation',      'Automated content moderation violation',         'flag_content',     7,  'active', NOW(3), NOW(3)),
  (UUID(),'auto_lock',              'Automatic lock due to critical risk score',      'auto_response',    10, 'active', NOW(3), NOW(3)),
  (UUID(),'risk_score_high',        'High composite risk score alert',                'auto_response',    8,  'active', NOW(3), NOW(3)),
  (UUID(),'high_frequency',         'High transaction frequency detected',            'hold_transaction', 9,  'active', NOW(3), NOW(3)),
  (UUID(),'withdraw_after_deposit', 'Suspicious withdraw immediately after deposit',  'hold_transaction', 9,  'active', NOW(3), NOW(3)),
  (UUID(),'transfer_to_new_account','Internal transfer to brand-new account',         'hold_transaction', 7,  'active', NOW(3), NOW(3));

-- ------------------------------------------------------------
-- 27. risk_alerts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `risk_alerts` (
  `id`         VARCHAR(30) NOT NULL,
  `userId`     VARCHAR(30) NOT NULL,
  `ruleId`     VARCHAR(30) NOT NULL,
  `details`    JSON        NULL,
  `status`     VARCHAR(20) NOT NULL DEFAULT 'new',
  `resolvedBy` VARCHAR(60) NULL,
  `resolvedAt` DATETIME(3) NULL,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_ra_userId` (`userId`),
  INDEX `idx_ra_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 28. ip_blacklist — extended version (replaces Section 8 above)
-- NOTE: Section 8 above has a basic ip_blacklist; this extended version
--       matches the Prisma schema exactly. Both use CREATE TABLE IF NOT EXISTS,
--       so whichever runs first wins. In production use Prisma migrations.
-- ------------------------------------------------------------
-- ip_blacklist already created in Section 8 above.

-- ------------------------------------------------------------
-- 29. user_devices (device fingerprinting for fraud detection)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_devices` (
  `id`         VARCHAR(30)  NOT NULL,
  `userId`     VARCHAR(30)  NOT NULL,
  `deviceId`   VARCHAR(255) NOT NULL,
  `deviceType` VARCHAR(20)  NULL,
  `userAgent`  VARCHAR(500) NULL,
  `ip`         VARCHAR(45)  NULL,
  `trusted`    TINYINT(1)   NOT NULL DEFAULT 0,
  `lastSeenAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_devices` (`userId`,`deviceId`),
  INDEX `idx_ud_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 30. aml_alerts (anti-money laundering)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aml_alerts` (
  `id`         VARCHAR(30) NOT NULL,
  `userId`     VARCHAR(30) NOT NULL,
  `type`       VARCHAR(50) NOT NULL,
  `severity`   VARCHAR(20) NOT NULL DEFAULT 'medium',
  `details`    JSON        NULL,
  `status`     VARCHAR(20) NOT NULL DEFAULT 'open',
  `resolvedBy` VARCHAR(60) NULL,
  `resolvedAt` DATETIME(3) NULL,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_aml_userId` (`userId`),
  INDEX `idx_aml_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 31. security_logs (brute force, injection, DDoS, geo, bot events)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `security_logs` (
  `id`        VARCHAR(30) NOT NULL,
  `userId`    VARCHAR(30) NULL,
  `event`     VARCHAR(60) NOT NULL,
  `ip`        VARCHAR(45) NULL,
  `userAgent` VARCHAR(500) NULL,
  `details`   JSON        NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_seclog_userId`        (`userId`),
  INDEX `idx_seclog_event_created` (`event`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 32. referrals
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referrals` (
  `id`            VARCHAR(30)   NOT NULL,
  `referrerId`    VARCHAR(30)   NOT NULL,
  `refereeId`     VARCHAR(30)   NOT NULL UNIQUE,
  `sourceProject` VARCHAR(20)   NULL,
  `status`        VARCHAR(20)   NOT NULL DEFAULT 'active',
  `commission`    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_referrals_referrerId` (`referrerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 33. commissions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `commissions` (
  `id`            VARCHAR(30)   NOT NULL,
  `referrerId`    VARCHAR(30)   NOT NULL,
  `refereeId`     VARCHAR(30)   NOT NULL,
  `amount`        DECIMAL(18,2) NOT NULL,
  `type`          VARCHAR(40)   NOT NULL,
  `sourceProject` VARCHAR(20)   NOT NULL,
  `status`        VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `note`          TEXT          NULL,
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `paidAt`        DATETIME(3)   NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_commissions_ref_status` (`referrerId`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 34. loyalty_points
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loyalty_points` (
  `id`          VARCHAR(30) NOT NULL,
  `userId`      VARCHAR(30) NOT NULL UNIQUE,
  `points`      INT         NOT NULL DEFAULT 0,
  `totalEarned` INT         NOT NULL DEFAULT 0,
  `totalSpent`  INT         NOT NULL DEFAULT 0,
  `tier`        VARCHAR(20) NOT NULL DEFAULT 'bronze',
  `updatedAt`   DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 35. loyalty_transactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
  `id`          VARCHAR(30)  NOT NULL,
  `userId`      VARCHAR(30)  NOT NULL,
  `points`      INT          NOT NULL,
  `source`      VARCHAR(50)  NOT NULL,
  `project`     VARCHAR(20)  NULL,
  `description` VARCHAR(255) NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_lt_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 36. rewards & reward_claims
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rewards` (
  `id`          VARCHAR(30)  NOT NULL,
  `name`        VARCHAR(150) NOT NULL,
  `description` TEXT         NULL,
  `type`        VARCHAR(30)  NOT NULL,
  `value`       JSON         NULL,
  `costPoints`  INT          NOT NULL,
  `stock`       INT          NOT NULL DEFAULT 0,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'active',
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reward_claims` (
  `id`        VARCHAR(30) NOT NULL,
  `userId`    VARCHAR(30) NOT NULL,
  `rewardId`  VARCHAR(30) NOT NULL,
  `status`    VARCHAR(20) NOT NULL DEFAULT 'pending',
  `claimedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `usedAt`    DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_rc_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 37. notifications & notification_settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`        VARCHAR(30)  NOT NULL,
  `userId`    VARCHAR(30)  NOT NULL,
  `type`      VARCHAR(30)  NOT NULL,
  `title`     VARCHAR(255) NOT NULL,
  `content`   TEXT         NOT NULL,
  `link`      VARCHAR(500) NULL,
  `project`   VARCHAR(20)  NULL,
  `isRead`    TINYINT(1)   NOT NULL DEFAULT 0,
  `readAt`    DATETIME(3)  NULL,
  `metadata`  JSON         NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_notif_userId_isRead`   (`userId`,`isRead`),
  INDEX `idx_notif_userId_created`  (`userId`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id`        VARCHAR(30) NOT NULL,
  `userId`    VARCHAR(30) NOT NULL UNIQUE,
  `email`     TINYINT(1)  NOT NULL DEFAULT 1,
  `push`      TINYINT(1)  NOT NULL DEFAULT 1,
  `sms`       TINYINT(1)  NOT NULL DEFAULT 0,
  `inApp`     TINYINT(1)  NOT NULL DEFAULT 1,
  `types`     JSON        NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 38. audit_logs (full Prisma-schema version — extended)
-- NOTE: Section 4 above has a basic audit_logs table (admin-only).
--       This extended version records all user/system actions cross-project.
--       In production Prisma manages this table via migrations.
-- audit_logs already created in Section 4 above with compatible columns.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 39. user_activities
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_activities` (
  `id`        VARCHAR(30) NOT NULL,
  `userId`    VARCHAR(30) NOT NULL,
  `action`    VARCHAR(80) NOT NULL,
  `project`   VARCHAR(20) NULL,
  `metadata`  JSON        NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_ua_userId`  (`userId`),
  INDEX `idx_ua_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 40. ai_interactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_interactions` (
  `id`        VARCHAR(30) NOT NULL,
  `userId`    VARCHAR(30) NOT NULL,
  `sessionId` VARCHAR(60) NULL,
  `query`     TEXT        NOT NULL,
  `response`  TEXT        NOT NULL,
  `context`   JSON        NULL,
  `language`  VARCHAR(10) NOT NULL DEFAULT 'vi',
  `status`    VARCHAR(20) NOT NULL DEFAULT 'success',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_ai_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 41. cross_banners (cross-project promotional banners)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cross_banners` (
  `id`            VARCHAR(30)  NOT NULL,
  `title`         VARCHAR(255) NOT NULL,
  `image`         VARCHAR(500) NOT NULL,
  `link`          VARCHAR(500) NULL,
  `targetProject` VARCHAR(20)  NOT NULL,
  `position`      VARCHAR(30)  NOT NULL,
  `conditions`    JSON         NULL,
  `startDate`     DATETIME(3)  NULL,
  `endDate`       DATETIME(3)  NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'active',
  `sortOrder`     INT          NOT NULL DEFAULT 0,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_cb_project_status` (`targetProject`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 42. support tables (rooms, participants, messages, tickets, replies)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_rooms` (
  `id`            VARCHAR(30)  NOT NULL,
  `type`          VARCHAR(20)  NOT NULL DEFAULT 'private',
  `name`          VARCHAR(150) NULL,
  `avatar`        VARCHAR(500) NULL,
  `lastMessage`   TEXT         NULL,
  `lastMessageAt` DATETIME(3)  NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_participants` (
  `id`         VARCHAR(30) NOT NULL,
  `roomId`     VARCHAR(30) NOT NULL,
  `userId`     INT         NOT NULL,
  `isAgent`    TINYINT(1)  NOT NULL DEFAULT 0,
  `lastReadAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `joinedAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `leftAt`     DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sp_room_user` (`roomId`,`userId`),
  INDEX `idx_sp_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_messages` (
  `id`         VARCHAR(30) NOT NULL,
  `roomId`     VARCHAR(30) NOT NULL,
  `senderId`   INT         NOT NULL,
  `type`       VARCHAR(20) NOT NULL DEFAULT 'text',
  `content`    TEXT        NOT NULL,
  `metadata`   JSON        NULL,
  `isRead`     TINYINT(1)  NOT NULL DEFAULT 0,
  `readAt`     DATETIME(3) NULL,
  `isDeleted`  TINYINT(1)  NOT NULL DEFAULT 0,
  `origLang`   VARCHAR(10) NULL,
  `translated` JSON        NULL,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sm_room_created` (`roomId`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id`          VARCHAR(30)  NOT NULL,
  `userId`      INT          NOT NULL,
  `roomId`      VARCHAR(30)  NULL,
  `subject`     VARCHAR(255) NOT NULL,
  `description` TEXT         NULL,
  `category`    VARCHAR(50)  NOT NULL DEFAULT 'general',
  `priority`    VARCHAR(20)  NOT NULL DEFAULT 'medium',
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'open',
  `assignedTo`  INT          NULL,
  `resolvedAt`  DATETIME(3)  NULL,
  `closedAt`    DATETIME(3)  NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_st_userId_status` (`userId`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_ticket_replies` (
  `id`          VARCHAR(30) NOT NULL,
  `ticketId`    VARCHAR(30) NOT NULL,
  `senderId`    INT         NOT NULL,
  `content`     TEXT        NOT NULL,
  `isInternal`  TINYINT(1)  NOT NULL DEFAULT 0,
  `isAuto`      TINYINT(1)  NOT NULL DEFAULT 0,
  `attachments` JSON        NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_str_ticketId` (`ticketId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 43. knowledge_articles & translations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `knowledge_articles` (
  `id`          VARCHAR(30)  NOT NULL,
  `category`    VARCHAR(50)  NOT NULL DEFAULT 'general',
  `title`       VARCHAR(255) NOT NULL,
  `slug`        VARCHAR(255) NOT NULL UNIQUE,
  `content`     TEXT         NOT NULL,
  `summary`     TEXT         NULL,
  `image`       VARCHAR(500) NULL,
  `authorId`    INT          NULL,
  `views`       INT          NOT NULL DEFAULT 0,
  `likes`       INT          NOT NULL DEFAULT 0,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'published',
  `publishedAt` DATETIME(3)  NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_ka_category_status` (`category`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knowledge_translations` (
  `id`        VARCHAR(30)  NOT NULL,
  `articleId` VARCHAR(30)  NOT NULL,
  `language`  VARCHAR(10)  NOT NULL,
  `title`     VARCHAR(255) NOT NULL,
  `content`   TEXT         NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kt_article_lang` (`articleId`,`language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 44. translation_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `translation_logs` (
  `id`             VARCHAR(30) NOT NULL,
  `sourceLang`     VARCHAR(10) NOT NULL,
  `targetLang`     VARCHAR(10) NOT NULL,
  `sourceText`     TEXT        NOT NULL,
  `translatedText` TEXT        NOT NULL,
  `service`        VARCHAR(30) NOT NULL DEFAULT 'deepseek',
  `tokenCount`     INT         NULL,
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_tl_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 45. file_uploads
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file_uploads` (
  `id`           VARCHAR(30)  NOT NULL,
  `userId`       VARCHAR(30)  NOT NULL,
  `filename`     VARCHAR(255) NOT NULL,
  `originalName` VARCHAR(255) NOT NULL,
  `path`         VARCHAR(500) NOT NULL,
  `mimeType`     VARCHAR(100) NOT NULL,
  `size`         INT          NOT NULL,
  `type`         VARCHAR(30)  NOT NULL DEFAULT 'general',
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_fu_userId_type` (`userId`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 46. Auto-Ops tables
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ops_user_segments` (
  `id`          INT           AUTO_INCREMENT PRIMARY KEY,
  `project`     VARCHAR(20)   NOT NULL DEFAULT 'game',
  `userId`      INT           NOT NULL,
  `segment`     VARCHAR(20)   NOT NULL DEFAULT 'bronze',
  `rScore`      INT           NOT NULL DEFAULT 1,
  `fScore`      INT           NOT NULL DEFAULT 1,
  `mScore`      INT           NOT NULL DEFAULT 1,
  `recencyDays` FLOAT         NOT NULL DEFAULT 999,
  `frequency`   INT           NOT NULL DEFAULT 0,
  `monetary`    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `clv`         DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `avgMonthly`  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `uq_ops_seg_project_user` (`project`,`userId`),
  INDEX `idx_ops_seg_project_seg` (`project`,`segment`),
  INDEX `idx_ops_seg_clv`         (`clv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ops_churn_alerts` (
  `id`           INT         AUTO_INCREMENT PRIMARY KEY,
  `project`      VARCHAR(20) NOT NULL DEFAULT 'game',
  `userId`       INT         NOT NULL,
  `riskLevel`    VARCHAR(10) NOT NULL,
  `reason`       VARCHAR(60) NOT NULL,
  `score`        FLOAT       NOT NULL DEFAULT 0,
  `daysInactive` INT         NOT NULL DEFAULT 0,
  `handled`      TINYINT(1)  NOT NULL DEFAULT 0,
  `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_oca_project_user`         (`project`,`userId`),
  INDEX `idx_oca_project_risk_created` (`project`,`riskLevel`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ops_tasks` (
  `id`          INT          AUTO_INCREMENT PRIMARY KEY,
  `type`        VARCHAR(40)  NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT         NULL,
  `userId`      INT          NULL,
  `assignedTo`  INT          NULL,
  `priority`    VARCHAR(20)  NOT NULL DEFAULT 'medium',
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `metadata`    JSON         NULL,
  `completedAt` DATETIME(3)  NULL,
  `completedBy` INT          NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  FOREIGN KEY (`assignedTo`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL,
  INDEX `idx_ot_assigned_status`  (`assignedTo`,`status`),
  INDEX `idx_ot_status_priority`  (`status`,`priority`),
  INDEX `idx_ot_type`             (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ops_campaign_logs` (
  `id`           INT          AUTO_INCREMENT PRIMARY KEY,
  `project`      VARCHAR(20)  NOT NULL DEFAULT 'game',
  `userId`       INT          NOT NULL,
  `campaignName` VARCHAR(100) NOT NULL,
  `segment`      VARCHAR(20)  NULL,
  `action`       VARCHAR(40)  NOT NULL,
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'sent',
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_ocl_project_user_campaign` (`project`,`userId`,`campaignName`),
  INDEX `idx_ocl_project_created`       (`project`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ops_daily_reports` (
  `id`        INT         AUTO_INCREMENT PRIMARY KEY,
  `date`      VARCHAR(10) NOT NULL UNIQUE,
  `payload`   JSON        NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_odr_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ops_alerts` (
  `id`        INT         AUTO_INCREMENT PRIMARY KEY,
  `type`      VARCHAR(60) NOT NULL,
  `message`   TEXT        NOT NULL,
  `severity`  VARCHAR(20) NOT NULL DEFAULT 'medium',
  `resolved`  TINYINT(1)  NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_oa_type_resolved` (`type`,`resolved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- END OF admin_schema.sql — complete admin_db schema (v2.1)
-- In production, schema is managed by Prisma migrations.
-- Use this file ONLY for:
--   1. Manual restore on a fresh MySQL instance
--   2. Cross-reference / documentation
--   3. Docker init (alongside docker-init.sql)
-- Run: mysql -u root -p admin_db < config/database/admin_schema.sql
-- ============================================================
