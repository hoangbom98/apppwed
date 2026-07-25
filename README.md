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
/var/LKVIP/                          ← Monorepo root
├── .github/
│   ├── workflows/
│   │   ├── ci.yml            # Lint + Typecheck + Test (on PR & push)
│   │   ├── deploy.yml        # Auto-deploy on push to main
│   │   └── prisma-check.yml  # Validate Prisma schemas on change
│   └── pull_request_template.md
├── apps/                     ⭐ ALL RUNNABLE APPLICATIONS
│   ├── backend/              # Express API — TypeScript + Prisma (port 5000)
│   ├── hub/                  # Hub Portal — @lkvip/hub (port 5173)
│   ├── game/                 # Game Center — @lkvip/game (port 5174)
│   ├── dating/               # Dating App — @lkvip/dating (port 5176)
│   ├── trading/              # Trade Platform — @lkvip/trade (port 5177)
│   ├── sports/               # Sports Live — @lkvip/sports (port 5178)
│   ├── admin-dashboard/      # Admin Portal — @lkvip/admin (port 5180)
│   └── _template/            # Starter template for new SPAs
├── packages/                 ⭐ SHARED LIBRARIES (no runnable server)
│   ├── constants/            # @lkvip/constants
│   ├── shared-types/         # @lkvip/types — shared TypeScript interfaces
│   ├── shared-ui/            # @lkvip/ui — shared React components & hooks
│   ├── shared-utils/         # @lkvip/utils
│   └── mobile/               # @lkvip/mobile — Capacitor
├── config/                   # Infrastructure configs (Nginx, DB, monitoring)
├── data/                     # Runtime data (uploads, cache)
├── docs/                     # Architecture, API, deployment guides
├── logs/                     # PM2 log output
├── scripts/                  # Root CLI scripts
├── tests/                    # Integration / load tests
├── archives/                 # Old code (not part of active build)
├── .env.example              # Environment template
├── .editorconfig
├── .gitignore
├── ecosystem.config.js       # PM2 config (points to apps/backend)
├── package.json              # Root convenience scripts + devDependencies
├── pnpm-workspace.yaml       # pnpm workspace definition
└── tsconfig.base.json        # Shared TypeScript config
```

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
cp .env.example apps/backend/.env
# → Điền DATABASE_URL_*, JWT_SECRET, REDIS_URL...

# Cài dependencies (pnpm workspace — chạy từ root)
pnpm install

# Tạo Prisma clients + chạy migrations + seed
pnpm --filter lkvip-backend run prisma:generate
pnpm --filter lkvip-backend run prisma:migrate:all
pnpm --filter lkvip-backend run seed:all
```

### 3. Chạy development

```bash
# Từ root /var/LKVIP

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
       ├─ hub.domain.com    → apps/hub/dist/
       ├─ game.domain.com   → apps/game/dist/
       ├─ trade.domain.com  → apps/trading/dist/
       ├─ dating.domain.com → apps/dating/dist/
       ├─ sports.domain.com → apps/sports/dist/
       ├─ admin.domain.com  → apps/admin-dashboard/dist/
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
# Từ root /var/LKVIP
pnpm mobile:sync           # Sync web assets to native
pnpm mobile:open:android   # Open Android Studio
pnpm mobile:open:ios       # Open Xcode (macOS only)
```

---

## 🚢 Production Deploy

```bash
# Setup VPS lần đầu (Ubuntu 22.04)
bash config/nginx/setup.sh yourdomain.com admin@yourdomain.com

# Deploy code (sau lần đầu)
git pull origin main
pnpm install --frozen-lockfile
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
