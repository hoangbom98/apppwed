# 🌐 KJC Platform — Multi-Project Ecosystem v2.0

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=nodedotjs)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://prisma.io)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://mysql.com)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis)](https://redis.io)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/your-org/website-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/website-admin/actions/workflows/ci.yml)

Hệ sinh thái giải trí trực tuyến gồm **5 sub-projects** độc lập và **1 Admin Portal**, chạy trên một Backend Express/Node.js duy nhất với 6 MySQL database riêng biệt.

---

## 📁 Cấu trúc thư mục

```
website-admin/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Lint + Test khi mở PR
│       └── deploy.yml      # Auto-deploy khi push vào main
├── source/
│   ├── backend/            ⭐ PRODUCTION BACKEND (duy nhất)
│   │   ├── server.ts       # TypeScript entrypoint (compiled → dist/server.js)
│   │   ├── package.json    # npm scripts (prisma, seed, test, backup)
│   │   ├── prisma/         # 6 Prisma schemas (hub, game, trade, dating, sports, admin)
│   │   ├── src/
│   │   │   ├── modules/    # hub, game, trade, dating, sports, admin, lkvip
│   │   │   └── shared/     # middlewares, services, utils, base, config
│   │   ├── scripts/        # backup.js, cleanup.js, restore.js
│   │   └── uploads/        # File uploads
│   ├── frontend/
│   │   ├── shared-ui/      # Components, hooks, store, utils dùng chung
│   │   ├── hub/            # KJC Hub Portal (port 5173)
│   │   ├── game/           # KJC Game Center (port 5174)
│   │   ├── dating/         # KJC Dating (port 5176)
│   │   ├── trade/          # KJC Trade Pro (port 5177)
│   │   ├── sports/         # KJC Sports Live (port 5178)
│   │   └── admin-dashboard/ # Admin Portal (port 5180)
│   ├── database/           # SQL reference files, indexes, schema docs
│   ├── nginx/              # Nginx config
│   └── scripts/            # backup.sh, restore.sh, ssl-setup.sh, deploy.sh...
├── docs/
│   ├── plans/              # Architecture & planning documents
│   └── legacy/             # Archived legacy deploy scripts
├── .env.example            # Template biến môi trường
├── ecosystem.config.js     # PM2 config → source/backend/dist/server.js
└── package.json            # Root scripts tiện lợi
```

> ⚠️ **Không có** `backend/` hay `database/` ở root. Tất cả source code thực nằm trong `source/`.

---

## 🚀 Bắt đầu nhanh (Development)

### 1. Cài đặt prerequisites

```bash
node --version   # >= 20.0.0
mysql --version  # >= 8.0
redis-cli ping   # PONG
```

### 2. Cấu hình môi trường

```bash
cp .env.example source/backend/.env
# Điền DATABASE_URL_*, JWT_SECRET, REDIS_URL...
```

### 3. Cài đặt dependencies & generate Prisma clients

```bash
cd source/backend
npm install
npm run prisma:generate     # Generate tất cả 6 Prisma clients
npm run prisma:migrate:all  # Tạo tables (dev)
npm run seed:all            # Dữ liệu mặc định
npm run seed:demo           # Dữ liệu mẫu (optional)
```

### 4. Chạy Backend

```bash
# Từ root:
npm run dev:backend

# Hoặc trực tiếp:
cd source/backend && npm run dev
```

Backend API: `http://localhost:5000`  
Swagger docs: `http://localhost:5000/api/docs`  
Health check: `http://localhost:5000/health`

### 5. Chạy Frontend (mỗi project riêng)

```bash
cd source/frontend/hub    && npm install && npm run dev   # :5173
cd source/frontend/game   && npm install && npm run dev   # :5174
cd source/frontend/dating && npm install && npm run dev   # :5176
cd source/frontend/trade  && npm install && npm run dev   # :5177
cd source/frontend/sports && npm install && npm run dev   # :5178
cd source/frontend/admin-dashboard && npm install && npm run dev  # :5180
```

---

## 📦 Scripts từ root

| Script | Mô tả |
|--------|-------|
| `npm run dev:backend` | Chạy backend (nodemon) |
| `npm run db:generate` | Generate tất cả 6 Prisma clients |
| `npm run db:migrate` | Chạy migration (dev) |
| `npm run db:deploy` | Deploy migration (production) |
| `npm run db:seed` | Seed dữ liệu mặc định |
| `npm run db:seed:demo` | Seed dữ liệu mẫu (test data) |
| `npm run build:all` | Build tất cả 6 frontend |
| `npm run check-env` | Kiểm tra biến môi trường |

---

## 🏗️ Kiến trúc

```
                     ┌─────────────────────────────────┐
                     │        Nginx Reverse Proxy       │
                     │  hub.* | game.* | admin.* | ...  │
                     └────────────────┬────────────────┘
                                      │
              ┌──────────────────────▼──────────────────────┐
              │         Express API — source/backend/         │
              │    /api/hub  /api/game  /api/dating  ...      │
              │         Socket.IO  |  PM2 Cluster             │
              └───────┬───────┬───────┬───────┬──────────────┘
                      │       │       │       │
               ┌──────┘  ┌────┘  ┌────┘  ┌───┘
               ▼         ▼       ▼       ▼
           hub_db    game_db  dating_db  trade_db  sports_db  admin_db
           (MySQL)   (MySQL)  (MySQL)   (MySQL)   (MySQL)    (MySQL)
```

---

## 🗄️ Database

| DB | Mô tả | Port module |
|----|-------|-------------|
| `hub_db` | Hub portal, CMS, news, games | `/api/hub` |
| `game_db` | Game center, transactions, LKVIP | `/api/game`, `/api/lkvip` |
| `dating_db` | Dating app, chat, livestream | `/api/dating` |
| `trade_db` | Trading platform, orders, KYC | `/api/trade` |
| `sports_db` | Sports news, matches, live | `/api/sports` |
| `admin_db` | Admin portal, users, config | `/api/admin` |

**Apply indexes sau migration:**
```bash
mysql -u root -p < source/database/indexes.sql
```

---

## 🔒 Bảo mật

- JWT Bearer token (1h access + 30d refresh)
- Rate limiting: 100 req/min (public), 200 (authenticated), 5 (auth endpoints)
- CORS chỉ cho phép origins trong `.env` `CORS_ORIGINS`
- Helmet headers (HSTS, nosniff, ...)
- Bcrypt salt 12 cho password
- AES-256-CBC cho dữ liệu nhạy cảm (CMND, số tài khoản)

---

## 📱 Mobile (Capacitor)

3 apps mobile: Hub, Game, Dating — build bằng Capacitor.

```powershell
# Windows:
.\source\scripts\build-mobile.ps1

# Build một app:
.\source\scripts\build-mobile.ps1 -App hub
```

---

## 🚢 Production Deploy

```bash
# 1. Setup server lần đầu (Ubuntu 22.04)
bash source/scripts/setup.sh yourdomain.com admin@yourdomain.com

# 2. Deploy code
bash source/scripts/deploy.sh

# 3. Apply indexes DB
mysql -u root -p < source/database/indexes.sql

# 4. Cài SSL
bash source/scripts/ssl-setup.sh yourdomain.com admin@yourdomain.com

# 5. Setup cron jobs (backup, cleanup)
sudo bash source/scripts/cron-setup.sh
```

---

## 🧪 Testing

```bash
npm test                      # Chạy tất cả tests
cd source/backend && npm test # Backend tests (Jest)
```

---

## 📄 Tài liệu tham khảo

- [`source/database/DATABASE_GUIDE.md`](source/database/DATABASE_GUIDE.md) — Hướng dẫn vận hành database
- [`source/backend/README.md`](source/backend/README.md) — Backend API docs
- [`docs/plans/PLAN-INDEX.md`](docs/plans/PLAN-INDEX.md) — Danh sách tất cả implementation plans còn active
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Kiến trúc hệ thống
- `http://localhost:5000/api/docs` — Swagger UI (khi đang chạy dev)

---

## 👤 Tài khoản mặc định (sau khi seed)

| Loại | Email | Mật khẩu |
|------|-------|----------|
| Super Admin | `admin@admin.com` | `Admin@123456` |
| Game users | `nguyenvana@gmail.com` | `Demo@123456` |
| Dating streamers | `lily@dating.kjc` | `Demo@123456` |
| Trade traders | `trader_an@trade.kjc` | `Demo@123456` |

> ⚠️ **Đổi mật khẩu ngay trước khi deploy lên production!**

---

*KJC Platform v2.0 — Backend: Node.js 20 + TypeScript + Prisma 5 + MySQL 8 | Frontend: React 19 + Vite + TailwindCSS*
