-- =====================================================================
-- Database Initialization Script
-- Run this ONCE to create all 6 databases and their users
-- Usage: mysql -u root -p < init-databases.sql
-- =====================================================================

-- 1. HUB Database
CREATE DATABASE IF NOT EXISTS hub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'hub_user'@'localhost' IDENTIFIED BY 'Hub@Secure2024!';
GRANT ALL PRIVILEGES ON hub_db.* TO 'hub_user'@'localhost';

-- 2. GAME Database
CREATE DATABASE IF NOT EXISTS game_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'game_user'@'localhost' IDENTIFIED BY 'Game@Secure2024!';
GRANT ALL PRIVILEGES ON game_db.* TO 'game_user'@'localhost';

-- 3. TRADE Database
CREATE DATABASE IF NOT EXISTS trade_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'trade_user'@'localhost' IDENTIFIED BY 'Trade@Secure2024!';
GRANT ALL PRIVILEGES ON trade_db.* TO 'trade_user'@'localhost';

-- 4. DATING Database
CREATE DATABASE IF NOT EXISTS dating_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'dating_user'@'localhost' IDENTIFIED BY 'Dating@Secure2024!';
GRANT ALL PRIVILEGES ON dating_db.* TO 'dating_user'@'localhost';

-- 5. SPORTS Database
CREATE DATABASE IF NOT EXISTS sports_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sports_user'@'localhost' IDENTIFIED BY 'Sports@Secure2024!';
GRANT ALL PRIVILEGES ON sports_db.* TO 'sports_user'@'localhost';

-- 6. ADMIN Database
CREATE DATABASE IF NOT EXISTS admin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'admin_user'@'localhost' IDENTIFIED BY 'Admin@Secure2024!';
GRANT ALL PRIVILEGES ON admin_db.* TO 'admin_user'@'localhost';

FLUSH PRIVILEGES;

SELECT 'All 6 databases and users created successfully!' AS status;
