# LKVIP GROUP — Multi-Service Entertainment Platform

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=nodedotjs)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://prisma.io)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://mysql.com)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis)](https://redis.io)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220?logo=pnpm)](https://pnpm.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/your-org/lkvip/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/lkvip/actions/workflows/ci.yml)

Nền tảng giải trí trực tuyến gồm **6 sub-projects** độc lập và **1 Admin Portal**, chạy trên một Backend Express/TypeScript duy nhất với 6 MySQL database riêng biệt.

---

## 📁 Cấu trúc thư mục

```
/var/LKVIP/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           # Lint + Typecheck + Test (on PR & push)
│   │   ├── deploy.yml       # Auto-deploy on push to main
│   │   └── prisma-check.yml # Validate Prisma schemas on change
│   └── pull_request_template.md
├── docs/                    # Architecture, API, deployment guides
│   ├── ARCHITECTURE.md
│   ├── API_ENDPOINTS.md
│   ├── DEPLOYMENT.md
│   ├── MIGRATION_GUIDE.md
│   ├── MODULES.md
│   ├── NFR.md
│   ├── OPERATIONS.md
│   ├── RISK_SYSTEM.md
│   ├── SETUP.md
│   ├── STANDARDIZATION.md
│   └── VPS_DEPLOYMENT.md
├── source/
│   ├── code/                ⭐ ALL SOURCE CODE (pnpm workspace)
│   │   ├── backend/         # Express API — TypeScript + Prisma
│   │   ├── frontend/
│   │   │   ├── admin-dashboard/  # Admin Portal (port 5180)
│   │   │   ├── hub/              # Hub Portal (port 5173)
│   │   │   ├── game/             # Game Center (port 5174)
│   │   │   ├── dating/           # Dating App (port 5176)
│   │   │   ├── trade/            # Trade Platform (port 5177)
│   │   │   ├── sports/           # Sports Live (port 5178)
│   │   │   ├── shared-ui/        # Shared React components & hooks
│   │   │   └── _template/        # Starter template for new SPAs
│   │   ├── packages/
│   │   │   ├── constants/        # @lkvip/constants
│   │   │   ├── shared-utils/     # @lkvip/utils
│   │   │   └── mobile/           # @lkvip/mobile (Capacitor)
│   │   ├── shared-types/         # @lkvip/types — shared TypeScript interfaces
│   │   ├── tests/
│   │   │   ├── integration/
│   │   │   └── load/
│   │   ├── package.json          # Workspace root scripts
│   │   └── pnpm-workspace.yaml
│   └── config/
│       ├── nginx/                # Nginx reverse proxy configs
│       ├── database/             # DB init scripts & indexes
│       └── monitoring/           # Monitoring configs
├── .env.example             # Environment template
├── .editorconfig
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── ecosystem.config.js      # PM2 config (points to code/backend)
└── package.json             # Root convenience scripts
```

> **Source code thực nằm hoàn toàn trong `code/`.** Root chỉ chứa meta files và configs.

---

## 🚀 Bắt đầu nhanh

### 1. Prerequisites

```bash
node --version   # >= 20.0.0
pnpm --version   # >= 9.0.0
mysql --version  # >= 8.0
redis-cli ping   # PONG
```

### 2. Cài đặt

```bash
# Clone
git clone <repo-url> /var/LKVIP
cd /var/LKVIP

# Cấu hình môi trường
cp .env.example code/backend/.env
# → Điền DATABASE_URL_*, JWT_SECRET, REDIS_URL...

# Cài dependencies (pnpm workspace)
cd code
pnpm install

# Tạo Prisma clients + chạy migrations + seed
pnpm --filter lkvip-backend run prisma:generate
pnpm --filter lkvip-backend run prisma:migrate:all
pnpm --filter lkvip-backend run seed:all
```

### 3. Chạy development

```bash
cd code

# Backend (port 5000)
pnpm dev:backend

# Từng frontend
pnpm dev:hub      # :5173
pnpm dev:game     # :5174
pnpm dev:admin    # :5180
pnpm dev:dating   # :5176
pnpm dev:trade    # :5177
pnpm dev:sports   # :5178
```

**API:** `http://localhost:5000`  
**Swagger:** `http://localhost:5000/api/docs`  
**Health:** `http://localhost:5000/health`

---

## 📦 Scripts gốc

| Script | Mô tả |
|--------|-------|
| `pnpm dev:backend` | Chạy backend dev server |
| `pnpm build:all` | Build tất cả packages + frontends |
| `pnpm prisma:generate` | Generate tất cả 6 Prisma clients |
| `pnpm prisma:deploy` | Deploy migrations (production) |
| `pnpm lint:all` | Lint toàn bộ codebase |
| `pnpm typecheck:all` | Typecheck toàn bộ |
| `pnpm test` | Chạy backend tests |

---

## 🏗️ Kiến trúc tổng quan

```
Internet (HTTPS)
       │
  [Nginx] ── SSL termination, gzip, rate limit
       │
       ├─ hub.domain.com    → frontend/hub/dist/
       ├─ game.domain.com   → frontend/game/dist/
       ├─ trade.domain.com  → frontend/trade/dist/
       ├─ dating.domain.com → frontend/dating/dist/
       ├─ sports.domain.com → frontend/sports/dist/
       ├─ admin.domain.com  → frontend/admin-dashboard/dist/
       └─ api.domain.com    → proxy → :5000

[PM2 Cluster — Node.js + Express + TypeScript]
       │
       ├── hub_db ──── game_db ──── trade_db
       └── dating_db ─ sports_db ─ admin_db
            (6 MySQL 8 databases — fully isolated)
```

---

## 🗄️ Databases

| DB | Module | Env Var |
|----|--------|---------|
| `hub_db` | Hub portal, CMS, news | `HUB_DATABASE_URL` |
| `game_db` | Gaming, wallet, VIP, lottery | `GAME_DATABASE_URL` |
| `dating_db` | Dating, chat, livestream | `DATING_DATABASE_URL` |
| `trade_db` | Trading, orders, KYC | `TRADE_DATABASE_URL` |
| `sports_db` | Sports, matches, betting | `SPORTS_DATABASE_URL` |
| `admin_db` | Admin, users, config, audit | `ADMIN_DATABASE_URL` |

---

## 🔒 Bảo mật

- JWT Bearer (2h access + 30d refresh)
- Rate limiting: 100 req/min (public), 5 req/min (auth endpoints)
- CORS chỉ cho phép origins trong `CORS_ORIGINS`
- Helmet headers (HSTS, nosniff, CSP...)
- Bcrypt salt 12 cho password hashing
- AES-256-CBC cho PII (CCCD, số tài khoản)
- Risk Engine: transaction monitor, brute-force, DDoS, bot detection

---

## 📱 Mobile (Capacitor)

3 apps: Hub, Game, Dating — build bằng Capacitor.

```bash
cd code
pnpm mobile:sync           # Sync web assets to native
pnpm mobile:open:android   # Open Android Studio
pnpm mobile:open:ios       # Open Xcode (macOS only)
```

---

## 🚢 Production Deploy

```bash
# Setup VPS lần đầu (Ubuntu 22.04)
bash source/config/nginx/setup.sh yourdomain.com admin@yourdomain.com

# Deploy code (sau lần đầu)
git pull origin main
cd code && pnpm install --frozen-lockfile
pnpm --filter lkvip-backend run build
pnpm run build:frontends
pm2 reload lkvip-api --update-env
```

---

## 📄 Tài liệu

| File | Nội dung |
|------|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Kiến trúc hệ thống |
| [`docs/MODULES.md`](docs/MODULES.md) | API endpoints từng module |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Hướng dẫn deploy VPS |
| [`docs/MIGRATION_GUIDE.md`](docs/MIGRATION_GUIDE.md) | Prisma migrations |
| [`docs/SETUP.md`](docs/SETUP.md) | Setup local dev |
| [`docs/RISK_SYSTEM.md`](docs/RISK_SYSTEM.md) | Risk detection engine |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md) | Runbook vận hành |

---

## 👤 Tài khoản mặc định (sau seed)

| Loại | Email | Mật khẩu |
|------|-------|----------|
| Super Admin | `admin@admin.com` | `Admin@123456` |
| Game user | `nguyenvana@gmail.com` | `Demo@123456` |

> ⚠️ **Đổi mật khẩu ngay trước khi deploy lên production!**

---

*LKVIP Platform — Backend: Node.js 20 + TypeScript + Prisma 5 + MySQL 8 | Frontend: React 19 + Vite + TailwindCSS*
