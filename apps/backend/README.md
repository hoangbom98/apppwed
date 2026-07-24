# LKVIP GROUP — Backend

> Node.js 20 · Express 4 · Prisma 5 · MySQL 8 · Redis 7 · Socket.IO 4 · PM2 cluster

Single Express server (`server.js`) that hosts **6 independent modules** — Hub, Game, Trade, Dating, Sports, Admin — each backed by its own MySQL database.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Setup](#3-local-development-setup)
4. [Environment Variables](#4-environment-variables)
5. [Database Migrations](#5-database-migrations)
6. [Seeding](#6-seeding)
7. [Running the Server](#7-running-the-server)
8. [API Structure](#8-api-structure)
9. [WebSocket Events](#9-websocket-events)
10. [Cron Jobs](#10-cron-jobs)
11. [Ubuntu VPS Deployment — Step by Step](#11-ubuntu-vps-deployment--step-by-step)
12. [Rolling Deploy (Updates)](#12-rolling-deploy-updates)
13. [PM2 Management](#13-pm2-management)
14. [Nginx Configuration](#14-nginx-configuration)
15. [SSL / HTTPS](#15-ssl--https)
16. [Backup & Recovery](#16-backup--recovery)
17. [Monitoring & Logs](#17-monitoring--logs)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Architecture Overview

```
Nginx (443/80)
  └─ Reverse proxy → http://127.0.0.1:5000  (Express, PM2 cluster)
       ├─ /api/hub/*     → modules/hub        (hub_db)
       ├─ /api/game/*    → modules/game       (game_db)
       ├─ /api/trade/*   → modules/trade      (trade_db)
       ├─ /api/dating/*  → modules/dating     (dating_db)
       ├─ /api/sports/*  → modules/sports     (sports_db)
       ├─ /api/admin/*   → modules/admin      (admin_db)
       ├─ /api/lkvip/*   → modules/lkvip      (game_db)
       ├─ /api/docs      → Swagger UI
       ├─ /health        → health check JSON
       └─ /metrics       → Prometheus-style text
```

**Key principle**: Each module only touches its own database via `req.prisma` (injected by `projectResolver`). No cross-DB JOINs. The `admin` module may read other DBs for aggregate statistics only.

---

## 2. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x | Use `nvm install 20` |
| npm | 10.x | Ships with Node 20 |
| MySQL | 8.x | Local socket or TCP |
| Redis | 7.x | Default port 6379 |
| PM2 | latest | `npm install -g pm2` |

---

## 3. Local Development Setup

```bash
# Clone the repo
git clone https://github.com/your-org/lkvip-platform.git
cd lkvip-platform/code/backend

# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env
# Edit .env — at minimum set the 6 DATABASE_URLs and JWT_SECRET

# Create local databases (MySQL must be running)
mysql -u root -p <<'SQL'
CREATE DATABASE IF NOT EXISTS hub_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS game_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS trade_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS dating_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sports_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS admin_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

# Generate all 6 Prisma clients
npm run prisma:generate

# Run migrations on all 6 DBs
npm run prisma:migrate:all

# Seed initial data
npm run seed:all

# Start dev server (nodemon)
npm run dev
```

Server starts at **http://localhost:5000** · Swagger UI at **http://localhost:5000/api/docs**

---

## 4. Environment Variables

Copy `.env.example` to `.env` and fill in every value. Key variables:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | HTTP port (default `5000`) |
| `JWT_SECRET` | 48-byte hex — access token signing |
| `JWT_REFRESH_SECRET` | 48-byte hex — refresh token signing (must differ from `JWT_SECRET`) |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `HUB_DATABASE_URL` | `mysql://user:pass@127.0.0.1:3306/hub_db` |
| `GAME_DATABASE_URL` | … same pattern … |
| `TRADE_DATABASE_URL` | … |
| `DATING_DATABASE_URL` | … |
| `SPORTS_DATABASE_URL` | … |
| `ADMIN_DATABASE_URL` | … |
| `REDIS_URL` | `redis://127.0.0.1:6379` |
| `ADMIN_DEFAULT_EMAIL` | Seeded admin email |
| `ADMIN_DEFAULT_PASSWORD` | Seeded admin password |

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 5. Database Migrations

```bash
# Development — creates migration files + applies them
npm run prisma:migrate:all

# Production — applies existing migration files only (safe, no file creation)
npm run prisma:deploy:all

# Check migration status
npm run prisma:status:all

# Regenerate Prisma clients after schema change
npm run prisma:generate
```

Individual schema commands:
```bash
npx prisma migrate dev   --schema prisma/hub/schema.prisma   --name "add_column"
npx prisma migrate deploy --schema prisma/game/schema.prisma
```

---

## 6. Seeding

```bash
# Full seed in dependency order
npm run seed:all
# admin → ui-config → payment-gateways → hub → game → lkvip → dating → sports

# Individual seeds
npm run seed:admin      # Creates super_admin user from ADMIN_DEFAULT_EMAIL/PASSWORD
npm run seed:payment    # Payment gateway configs (MoMo, ZaloPay, VNPay, VietQR)
npm run seed:demo       # Demo content (development only)
```

> ⚠️ Seeds are idempotent — safe to run multiple times (they use `upsert`/`createOrIgnore`).

---

## 7. Running the Server

```bash
# Development (hot-reload via nodemon)
npm run dev

# Production (plain node)
npm run start

# Production (PM2 cluster)
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # follow the printed command to persist across reboots
```

---

## 8. API Structure

All routes are prefixed with `/api/<module>`:

| Prefix | Module | Auth |
|--------|--------|------|
| `/api/hub` | Hub — CMS, news, games directory | JWT + projectAccessGuard |
| `/api/game` | Game — casino, wallet, agents | JWT + projectAccessGuard |
| `/api/trade` | Trade — markets, orders, KYC | JWT + projectAccessGuard |
| `/api/dating` | Dating — profiles, chat, livestream | JWT + projectAccessGuard |
| `/api/sports` | Sports — scores, fixtures, betting | JWT + projectAccessGuard |
| `/api/admin` | Admin dashboard — stats, config | JWT + adminGuard |
| `/api/lkvip` | Internal payment gateway | webhook secret |
| `/api/shared/config` | Public frontend config | none |
| `/api/docs` | Swagger UI | none |
| `/health` | Health check | none |
| `/metrics` | Prometheus metrics | none |

### Response envelope

All endpoints return:
```json
{ "success": true, "data": {...}, "message": "OK" }
{ "success": false, "message": "Error description" }
```

### Authentication

```http
Authorization: Bearer <access_token>
```

Tokens are project-scoped. A token issued for `game` will be rejected on `/api/trade/*` with `403 Forbidden`.

---

## 9. WebSocket Events

Connect via Socket.IO to `wss://api.yourdomain.com` (or `http://localhost:5000` in dev).

| Namespace / Event | Direction | Description |
|-------------------|-----------|-------------|
| `chat:join` | client→server | Join a chat room |
| `chat:message` | both | Send/receive chat message |
| `chat:seen` | client→server | Mark messages as read |
| `chat:recall` | client→server | Recall a sent message |
| `match_update` | server→client | Live sports score update |
| `price:update` | server→client | Trade real-time price tick |
| `notification` | server→client | System notifications |

---

## 10. Cron Jobs

Registered at startup by `src/config/cron.js`:

| Schedule | Name | Description |
|----------|------|-------------|
| `*/14 * * * *` | keep-alive | Pings `/health/live` (production only) |
| `*/5 * * * *` | clear-expired-cache | Flushes expired Redis keys |
| `*/10 * * * *` | health-snapshot | Logs RSS/heap/uptime |
| `*/30 * * * *` | batch-risk-scoring | Recalculates risk scores |
| `0 * * * *` | vip-expiry | Expires overdue VIP memberships |
| `0 */6 * * *` | purge-ip-blacklist | Removes expired IP blacklist entries |
| `0 2 * * *` | adaptive-limits | Adjusts rate limits per user risk |
| `0 3 * * *` | clean-audit-logs | Deletes info-level audit logs > 90 days |
| `0 4 * * *` | clean-security-logs | Deletes low/medium security logs > 30 days |
| `0 0 * * *` | reset-daily-flags | Clears `daily:*` Redis keys |
| `*/30 * * * * *` | trade-price-feed | Syncs prices from CoinGecko + Alpha Vantage (requires `ENABLE_PRICE_FEED=true`) |
| `* * * * *` | sports-live-scores | Live score simulation / provider sync |

---

## 11. Ubuntu VPS Deployment — Step by Step

### 11.1 Initial VPS Setup (run once as root)

```bash
# Upload scripts to VPS
scp -r scripts/ root@YOUR_VPS_IP:/tmp/lkvip-scripts/

# SSH into VPS
ssh root@YOUR_VPS_IP

# Run setup (installs Node 20, MySQL 8, Redis, Nginx, UFW, PM2)
bash /tmp/lkvip-scripts/setup.sh
# → saves DB credentials to /root/CREDENTIALS.txt
```

What `setup.sh` does:
- Installs Node.js 20 via NodeSource
- Installs MySQL 8, Redis 7, Nginx, UFW, git, PM2
- Creates 6 MySQL databases + `lkvip_db` user with grants
- Configures UFW (allows 22, 80, 443)
- Saves generated DB password to `/root/CREDENTIALS.txt`

### 11.2 First Deploy

```bash
# On the VPS, as the deploy user (or root)
cd /var/www
git clone https://github.com/your-org/lkvip-platform.git
cd lkvip-platform

# Create .env from example, fill in values
cp code/backend/.env.example code/backend/.env
nano code/backend/.env

# Run first-deploy
bash scripts/first-deploy.sh
```

What `first-deploy.sh` does (9 steps):
1. Validates all required `.env` vars (`check-env.sh`)
2. `npm ci` — installs production dependencies
3. `prisma generate` — generates all 6 Prisma clients
4. `prisma migrate deploy` — runs all migrations
5. `seed:all` — seeds initial data
6. Builds all 6 frontend SPAs
7. Creates upload directories
8. Starts PM2 (`pm2 start ecosystem.config.js --env production`)
9. Patches Nginx config with your domain and reloads

### 11.3 SSL Setup

```bash
bash scripts/ssl-setup.sh
# Runs certbot for: hub, game, trade, dating, sports, admin, api subdomains
# Requires DNS A-records to point to the VPS IP before running
```

---

## 12. Rolling Deploy (Updates)

```bash
# Full deploy (all modules)
bash scripts/deploy.sh

# Backend only (skip frontend builds)
bash scripts/deploy.sh --module=backend

# Single frontend module
bash scripts/deploy.sh --module=hub

# Deploy with auto-rollback on failure
bash scripts/deploy.sh --auto-rollback

# Manual rollback to previous commit
bash scripts/deploy.sh --rollback
```

Deploy steps (`deploy.sh`):
1. Pre-flight (disk space, commands available)
2. Saves rollback point (current git SHA)
3. `git fetch && git reset --hard origin/main`
4. `npm ci --omit=dev`
5. `prisma generate` (all 6 schemas)
6. `prisma migrate deploy` (all 6 schemas)
7. Frontend `npm ci && npm run build` (per selected module)
8. `pm2 reload lkvip-api --update-env` (zero-downtime)
9. `nginx -t && systemctl reload nginx`
10. Health check → `GET /health/ready`

---

## 13. PM2 Management

```bash
# Status
pm2 status
pm2 monit

# Logs
pm2 logs lkvip-api --lines 100
pm2 logs lkvip-api --err --lines 50

# Reload (zero-downtime, preserves connections)
pm2 reload lkvip-api --update-env

# Restart (hard restart, brief downtime)
pm2 restart lkvip-api

# Stop / Delete
pm2 stop lkvip-api
pm2 delete lkvip-api

# Persist across reboots
pm2 save
pm2 startup   # follow the printed systemd command

# Memory info
pm2 show lkvip-api
```

The production config (`ecosystem.config.js`) uses:
- `instances: 'max'` — one worker per CPU core
- `exec_mode: 'cluster'` — Node.js cluster for load balancing
- `kill_timeout: 30000` — 30 s graceful shutdown for open Socket.IO connections
- `max_memory_restart: '400M'` — auto-restart per worker if RSS exceeds 400 MB

---

## 14. Nginx Configuration

The Nginx config is at `config/nginx/nginx.conf`. It configures 7 server blocks:

| Subdomain | Serves |
|-----------|--------|
| `api.yourdomain.com` | Reverse proxy → Express :5000 |
| `hub.yourdomain.com` | Static SPA (`frontend/hub/dist/`) |
| `game.yourdomain.com` | Static SPA (`frontend/game/dist/`) |
| `trade.yourdomain.com` | Static SPA (`frontend/trade/dist/`) |
| `dating.yourdomain.com` | Static SPA (`frontend/dating/dist/`) |
| `sports.yourdomain.com` | Static SPA (`frontend/sports/dist/`) |
| `admin.yourdomain.com` | Static SPA (`frontend/admin-dashboard/dist/`) |

```bash
# Test config
nginx -t

# Reload (no downtime)
systemctl reload nginx

# Full restart
systemctl restart nginx
```

---

## 15. SSL / HTTPS

```bash
# Install certbot (if not done by setup.sh)
apt install certbot python3-certbot-nginx -y

# Issue certs for all subdomains
bash scripts/ssl-setup.sh

# Manual renewal test
certbot renew --dry-run

# Auto-renewal is set up by certbot (systemd timer or cron)
```

---

## 16. Backup & Recovery

```bash
# Manual backup — dumps all 6 DBs to /var/backups/lkvip-db/
bash scripts/backup-db.sh

# Install automated daily backup at 02:00
bash scripts/cron-setup.sh

# List backups
ls -lh /var/backups/lkvip-db/

# Restore a specific DB
gunzip < /var/backups/lkvip-db/game_db_2025-01-15.sql.gz | mysql -u lkvip_db -p game_db
```

Backup retention is controlled by `BACKUP_RETENTION_DAYS` in `.env` (default `30`).

---

## 17. Monitoring & Logs

### Health Endpoints

| URL | Description |
|-----|-------------|
| `GET /health` | Full health JSON (uptime, memory, Redis, request counts) |
| `GET /health/ready` | Readiness probe (`{ "ready": true }`) |
| `GET /health/live` | Liveness probe (`{ "alive": true }`) |
| `GET /metrics` | Prometheus-style text metrics |

### Log Files

| Location | Contents |
|----------|----------|
| `/var/log/pm2/lkvip-api-out.log` | stdout (Winston info/debug) |
| `/var/log/pm2/lkvip-api-err.log` | stderr (Winston error/warn) |
| `code/backend/logs/` | Local development logs |

### Viewing Logs

```bash
# Real-time PM2 logs
pm2 logs lkvip-api

# Last 200 lines of errors only
pm2 logs lkvip-api --err --lines 200

# Winston log files (if configured)
tail -f /var/log/pm2/lkvip-api-out.log | grep ERROR
```

---

## 18. Troubleshooting

### Server won't start

```bash
# Check for syntax errors
node code/backend/server.js

# Check PM2 error log
pm2 logs lkvip-api --err --lines 50

# Verify .env is present and readable
cat code/backend/.env | head -5
```

### Database connection errors

```bash
# Test MySQL connectivity
mysql -u lkvip_db -p -e "SHOW DATABASES;"

# Verify DATABASE_URL in .env
grep DATABASE_URL code/backend/.env

# Check Prisma clients are generated
ls code/backend/node_modules/.prisma/
```

### Redis connection errors

```bash
# Check Redis is running
systemctl status redis
redis-cli ping  # should return PONG

# Verify REDIS_URL in .env
grep REDIS_URL code/backend/.env
```

### Prisma migration errors

```bash
# Check migration status
cd code/backend
npm run prisma:status:all

# If migration table is out of sync
npx prisma migrate resolve --applied "20250101000000_init_hub" --schema prisma/hub/schema.prisma
```

### Port 5000 already in use

```bash
# Find and kill the occupying process
lsof -ti:5000 | xargs kill -9
pm2 start ecosystem.config.js --env production
```

### CORS errors in browser

Ensure `CORS_ORIGINS` in `.env` includes the exact frontend origin (scheme + host + port):
```
CORS_ORIGINS=https://hub.yourdomain.com,https://game.yourdomain.com,...
```

---

## Project Structure (Backend)

```
code/backend/
├── server.js                  # ← True entry point (PM2 runs this)
├── ecosystem.config.js        # PM2 production config
├── ecosystem.config.dev.js    # PM2 development config
├── package.json
├── .env.example               # Environment template (commit this)
├── .env                       # Actual secrets (DO NOT commit)
├── prisma/
│   ├── admin/schema.prisma
│   ├── hub/schema.prisma
│   ├── game/schema.prisma
│   ├── trade/schema.prisma
│   ├── dating/schema.prisma
│   └── sports/schema.prisma
├── src/
│   ├── app.js                 # Compatibility shim → re-exports server.js
│   ├── config/
│   │   ├── databases.js       # Prisma multi-client factory
│   │   ├── cron.js            # 12 scheduled jobs
│   │   └── index.js           # Barrel exports
│   ├── modules/
│   │   ├── hub/
│   │   ├── game/
│   │   ├── trade/
│   │   ├── dating/
│   │   ├── sports/
│   │   ├── admin/
│   │   └── lkvip/
│   ├── shared/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── socket/
│   │   └── utils/
│   ├── risk/
│   └── prisma/seeds/
└── uploads/                   # User-generated files (excluded from git)
```

---

*LKVIP GROUP v2.0 — Single VPS, 6 Projects, 1 Backend*
