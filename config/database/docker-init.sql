-- LKVIP Dev Database Initialization
-- Run automatically by docker-compose.dev.yml on first start
-- Creates all 6 project databases + grants privileges

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ── Project databases ──────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS hub_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS game_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS trade_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS dating_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS sports_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS admin_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ── Grant all privileges to lkvip user ────────────────────────────────────────
GRANT ALL PRIVILEGES ON hub_db.*    TO 'lkvip'@'%';
GRANT ALL PRIVILEGES ON game_db.*   TO 'lkvip'@'%';
GRANT ALL PRIVILEGES ON trade_db.*  TO 'lkvip'@'%';
GRANT ALL PRIVILEGES ON dating_db.* TO 'lkvip'@'%';
GRANT ALL PRIVILEGES ON sports_db.* TO 'lkvip'@'%';
GRANT ALL PRIVILEGES ON admin_db.*  TO 'lkvip'@'%';

FLUSH PRIVILEGES;

-- Done — Prisma migrations will create tables via: pnpm prisma:deploy
