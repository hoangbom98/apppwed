# Setup Guide — KJC Platform v2.0

**Prerequisite OS:** Ubuntu 20.04+ / macOS / WSL2 Windows

---

## 1. Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20 LTS | `node --version` |
| npm | 10+ | `npm --version` |
| MySQL | 8.0 | `mysql --version` |
| Redis | 7.x | `redis-server --version` |
| Git | 2.x+ | `git --version` |
| PM2 (production) | latest | `pm2 --version` |

> **Docker alternative:** Nếu không muốn cài MySQL/Redis thủ công, xem [§6 Docker Quick Start](#6-docker-quick-start).

---

## 2. Clone & Install

```bash
# 1. Clone
git clone https://github.com/your-org/website-admin.git
cd website-admin

# 2. Copy env template
cp .env.example source/backend/.env

# 3. Chỉnh sửa .env — xem §3 Environment Variables
nano source/backend/.env

# 4. Install backend dependencies
cd source/backend
npm install
```

---

## 3. Environment Variables

File: `source/backend/.env`

### Bắt buộc (không có thì app không khởi động)

```env
# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET=your_jwt_secret_minimum_64_characters_random_string_here_xxxxxxxx
JWT_REFRESH_SECRET=your_refresh_secret_minimum_64_characters_random_string_xxxxxxxx
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=30d

# ── Database URLs (Prisma connection strings) ────────────────────────────────
HUB_DATABASE_URL=mysql://user:password@127.0.0.1:3306/hub_db
GAME_DATABASE_URL=mysql://user:password@127.0.0.1:3306/game_db
TRADE_DATABASE_URL=mysql://user:password@127.0.0.1:3306/trade_db
DATING_DATABASE_URL=mysql://user:password@127.0.0.1:3306/dating_db
SPORTS_DATABASE_URL=mysql://user:password@127.0.0.1:3306/sports_db
ADMIN_DATABASE_URL=mysql://user:password@127.0.0.1:3306/admin_db

# ── Redis ──────────────────────────────────────────────────────────────────
REDIS_URL=redis://127.0.0.1:6379
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Tùy chọn (có giá trị mặc định)

```env
# ── Server ────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
APP_NAME=KJC-Platform
LOG_LEVEL=debug                # debug | info | warn | error

# ── CORS — danh sách frontend URLs được phép ──────────────────────────────
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://localhost:5180

# ── Mã hóa PII (AES-256-CBC) — 64 ký tự hex ──────────────────────────────
ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000

# ── Email (Nodemailer) ────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@kjc-platform.com

# ── Upload ────────────────────────────────────────────────────────────────
MAX_FILE_SIZE=10485760         # 10MB in bytes
UPLOAD_PATH=./uploads

# ── Keep-alive (chỉ cần trên Render free tier) ───────────────────────────
APP_URL=https://your-app.onrender.com
```

---

## 4. Database Setup

### 4.1 Tạo databases trong MySQL

```sql
-- Chạy trong MySQL client (mysql -u root -p)
CREATE DATABASE IF NOT EXISTS hub_db     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS game_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS trade_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS dating_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sports_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS admin_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo user (thay thế password)
CREATE USER IF NOT EXISTS 'webadmin'@'localhost' IDENTIFIED BY 'StrongPassword@2024';
GRANT ALL PRIVILEGES ON hub_db.*     TO 'webadmin'@'localhost';
GRANT ALL PRIVILEGES ON game_db.*    TO 'webadmin'@'localhost';
GRANT ALL PRIVILEGES ON trade_db.*   TO 'webadmin'@'localhost';
GRANT ALL PRIVILEGES ON dating_db.*  TO 'webadmin'@'localhost';
GRANT ALL PRIVILEGES ON sports_db.*  TO 'webadmin'@'localhost';
GRANT ALL PRIVILEGES ON admin_db.*   TO 'webadmin'@'localhost';
FLUSH PRIVILEGES;
```

### 4.2 Chạy Prisma migrations

```bash
cd source/backend

# Generate tất cả 6 Prisma clients
npm run prisma:generate

# Chạy migrations (lần đầu hoặc có schema mới)
npm run prisma:migrate:all
```

### 4.3 Seed dữ liệu mẫu

```bash
# Seed tất cả modules (admin → game → hub → dating → trade → sports)
npm run seed:all

# Hoặc seed từng module riêng lẻ
npm run seed:admin    # Tạo tài khoản superadmin mặc định
npm run seed:game     # Dữ liệu mẫu game
npm run seed:hub      # Dữ liệu mẫu hub
```

> **Tài khoản mặc định sau seed:admin:**
> - Email: `admin@admin.com`
> - Password: `Admin@123456`
> - **⚠️ PHẢI đổi password trước khi deploy production.**

---

## 5. Chạy Development Server

```bash
cd source/backend

# Backend API (port 5000)
npm run dev

# Kiểm tra API docs
open http://localhost:5000/api/docs

# Health check
curl http://localhost:5000/health/live
```

### Chạy frontend (từ thư mục source/frontend/<project>)

```bash
# Admin dashboard (port 5180)
cd source/frontend/admin-dashboard
npm install && npm run dev

# Hub (port 5173)
cd source/frontend/hub
npm install && npm run dev
```

---

## 6. Docker Quick Start

Cách nhanh nhất — không cần cài MySQL/Redis thủ công:

```bash
# 1. Copy env
cp .env.example source/backend/.env
# Sửa JWT_SECRET trong .env

# 2. Khởi động stack (MySQL 8 + Redis 7 + Backend API)
cd source
docker-compose up -d

# 3. Chạy migrations và seed
docker-compose exec api npm run prisma:migrate:all
docker-compose exec api npm run seed:all

# Backend tại: http://localhost:5000
# API Docs tại: http://localhost:5000/api/docs
```

---

## 7. Kiểm tra sau khi cài xong

```bash
# 1. Server health
curl http://localhost:5000/health/live
# Expected: {"status":"ok","uptime":...}

# 2. Admin login
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"Admin@123456"}'
# Expected: {"success":true,"data":{"access_token":"..."}}

# 3. Chạy test suite
cd source/backend
npm test
```

---

## 8. Xử lý lỗi phổ biến

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `Can't connect to MySQL` | MySQL chưa chạy hoặc sai URL | Kiểm tra `MYSQL_DATABASE_URL` trong `.env` |
| `Prisma client not generated` | Chưa chạy `prisma:generate` | `npm run prisma:generate` |
| `JWT_SECRET too short` | Secret < 32 chars | Dùng string ngẫu nhiên ≥ 64 ký tự |
| `Redis connection refused` | Redis chưa chạy | `redis-server` hoặc `docker-compose up redis` |
| `EADDRINUSE :5000` | Port đã bị dùng | `lsof -i :5000 && kill -9 <PID>` |
