# KJC Multi-Project Platform — Architecture Reference

> **Version**: 2.1.0 | **Last updated**: 2025  
> **Stack**: Node.js 20 · Express 4 · Prisma 5 · MySQL 8 · Redis 7 · React 19 · Vite · TypeScript · Tailwind CSS · Capacitor · PM2 · Nginx

---

## 📐 System Overview

```
                        ┌─────────────────────────────────────────────┐
                        │               Ubuntu VPS                     │
                        │                                              │
                        │   ┌────────────┐    ┌──────────────────┐   │
  Internet  ──HTTPS──▶  │   │   Nginx    │───▶│  Node.js :5000   │   │
                        │   │ (reverse   │    │  (PM2 cluster)   │   │
                        │   │  proxy /   │    └──────┬───────────┘   │
                        │   │  static)   │           │               │
                        │   └─────┬──────┘      ┌────▼──────────┐   │
                        │         │              │  MySQL 8       │   │
                        │   ┌─────▼────────┐    │  6 Databases   │   │
                        │   │  6 SPA dist/ │    └────────────────┘   │
                        │   │  (static)    │    ┌────────────────┐   │
                        │   └──────────────┘    │  Redis 7       │   │
                        │                       │  (cache/queue) │   │
                        │                       └────────────────┘   │
                        └─────────────────────────────────────────────┘
```

---

## 🗂️ Directory Structure

```
source/
├── tsconfig.base.json          # Shared TS config (extended by all SPAs)
├── package.json                # Root workspace scripts (build:all, dev:all)
├── shared-types/               # @kjc/types — shared TypeScript interfaces
│   ├── src/index.ts            # IApp, IWallet, IUser, IApiResponse, ...
│   ├── tsconfig.json           # extends ../tsconfig.base.json
│   └── package.json
├── backend/                    # Express API (CommonJS, Node.js 20)
│   ├── server.js               # Entry point + Socket.IO + cron
│   ├── src/
│   │   ├── config/             # databases.js, cron.js, swagger.js
│   │   ├── modules/            # hub/ game/ trade/ dating/ sports/ admin/ lkvip/
│   │   └── shared/             # middlewares/ services/ utils/ socket/
│   ├── prisma/                 # 6 schema files (one per project DB)
│   └── package.json
├── frontend/
│   ├── package.json            # Orchestrator (dev:all, build:all via concurrently)
│   ├── shared-ui/              # Shared React components, hooks, stores, PWA utils
│   │   ├── index.js            # Barrel export
│   │   ├── index.d.ts          # TypeScript declarations
│   │   ├── components/         # Button, Modal, Input, WalletBalance, ...
│   │   ├── hooks/              # useAuth, useWalletStore, useDebounce, ...
│   │   ├── store/              # authStore.js, walletStore.js, uiStore.js
│   │   ├── api/                # client.js (Axios with JWT + refresh)
│   │   ├── pwa/
│   │   │   ├── serviceWorker/  # ServiceWorkerManager, useServiceWorker
│   │   │   ├── install/        # useInstallPrompt, InstallPrompt
│   │   │   ├── autoComplete/   # AutoComplete component, useAutoComplete
│   │   │   ├── network/        # useNetworkStatus, useOffline
│   │   │   └── update/         # UpdateBanner component
│   │   └── utils/              # formatters.js, validators.js, constants.js
│   ├── hub/                    # Hub SPA  (port 5173)
│   ├── game/                   # Game SPA (port 5174)
│   ├── dating/                 # Dating SPA (port 5176)
│   ├── trade/                  # Trade SPA (port 5177)
│   ├── sports/                 # Sports SPA (port 5178)
│   └── admin-dashboard/        # Admin SPA (port 5180)
├── nginx/
│   └── nginx.conf              # Production reverse proxy config
├── scripts/
│   ├── setup.sh                # VPS initial setup (run ONCE as root)
│   ├── first-deploy.sh         # First full deploy
│   ├── deploy.sh               # Rolling update deploy
│   ├── backup-db.sh            # Daily mysqldump rotation
│   └── ssl-setup.sh            # certbot for all 7 subdomains
├── database/                   # Backup SQL schemas
├── docs/                       # This directory
└── logs/                       # Application logs
```

---

## 🗄️ Database Architecture

**Pattern**: 6 completely isolated MySQL databases — one per project. No cross-DB JOINs or shared foreign keys.

| Project | DB Name    | Prisma Schema Path                    | Env Var               |
|---------|-----------|---------------------------------------|-----------------------|
| hub     | `hub_db`  | `prisma/hub/schema.prisma`            | `HUB_DATABASE_URL`    |
| game    | `game_db` | `prisma/game/schema.prisma`           | `GAME_DATABASE_URL`   |
| trade   | `trade_db`| `prisma/trade/schema.prisma`          | `TRADE_DATABASE_URL`  |
| dating  | `dating_db`| `prisma/dating/schema.prisma`        | `DATING_DATABASE_URL` |
| sports  | `sports_db`| `prisma/sports/schema.prisma`        | `SPORTS_DATABASE_URL` |
| admin   | `admin_db`| `prisma/admin/schema.prisma`          | `ADMIN_DATABASE_URL`  |

### Multi-Client Factory

```js
// code/backend/src/config/databases.js
function getPrismaClient(project) {
  if (!clients[project]) {
    const { PrismaClient } = require(`../../../node_modules/.prisma/${project}-client`);
    clients[project] = new PrismaClient();
  }
  return clients[project];
}
```

Every request gets `req.prisma = getPrismaClient(req.project)` via `projectResolver` middleware.

---

## 🌐 SPA Architecture — 6 Independent Apps

Each SPA is 100% independent with:
- Its own `package.json` / `node_modules`
- Its own `vite.config.ts` (no VitePWA plugin)
- Its own `public/sw.js` (Service Worker — manual, production-only)
- Its own `public/manifest.json` (PWA manifest)
- Its own `public/offline.html` (offline fallback)
- `@ui` alias → `../shared-ui/` (shared components, NO build step needed)

### Dev Ports

| SPA              | Port  | `VITE_PROJECT` |
|-----------------|-------|----------------|
| hub             | 5173  | `hub`          |
| game            | 5174  | `game`         |
| dating          | 5176  | `dating`       |
| trade           | 5177  | `trade`        |
| sports          | 5178  | `sports`       |
| admin-dashboard | 5180  | `admin`        |

### Shared-UI Import Pattern

```tsx
// In any SPA:
import { useAuthStore, useWalletStore } from '@ui';
import { AutoComplete }                 from '@ui/pwa/autoComplete';
import { UpdateBanner }                 from '@ui/pwa/update';
import { InstallPrompt }                from '@ui/pwa/install';
```

The `@ui` alias is resolved at build time via `vite.config.ts`:
```ts
resolve: { alias: { '@ui': path.resolve(__dirname, '../shared-ui') } }
```

---

## 💳 Cross-Cutting Wallet

Wallet is **not** a separate module. It is handled via shared hooks/stores:

```
shared-ui/store/walletStore.js    — Zustand store (balance, coins, diamonds)
shared-ui/components/payment/     — WalletBalance, GatewaySelector, DepositInstructions, WithdrawForm
```

Each SPA that needs wallet just imports from `@ui`:
```tsx
import { useWalletStore } from '@ui';
const { balance, fetchBalance } = useWalletStore();
```

The wallet API endpoint is `/api/{project}/wallet/balance` — each project uses its own DB.

---

## 🔧 Service Worker Strategy (Manual — no plugin)

Each SPA has `public/sw.js` with 4-tier fetch strategy:

| Request Type         | Strategy                    | Cache Name         |
|---------------------|-----------------------------|--------------------|
| `/api/*`            | Network-first + cache fallback | `kjc-{app}-vX.Y` |
| `/uploads/avatars/` | Stale-while-revalidate      | `kjc-{app}-avatar-v1` |
| `.js/.css/fonts`    | Cache-first                 | `kjc-{app}-vX.Y`  |
| `.png/.jpg/.svg`    | Cache-first + bg-revalidate | `kjc-{app}-image-v1` |
| HTML navigation     | Network-first + offline fallback | `kjc-{app}-vX.Y` |

SW is registered in `main.tsx` only in `import.meta.env.PROD`:
```ts
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' });
}
```

Update notification is dispatched via `CustomEvent('sw:update-available')` and consumed by `<UpdateBanner />`.

> **Admin SW exception**: Admin dashboard SW intentionally **skips API caching** for security.

---

## 🔐 Authentication Flow

```
POST /api/{project}/auth/login
  → JWT access_token (2h) + refresh_token (30d)
  → stored as localStorage `{project}_access_token`

Every API request:
  → Authorization: Bearer {token}
  → X-Project: {project}
  → projectResolver sets req.project + req.prisma
  → auth middleware verifies JWT
  → projectAccessGuard verifies user in project DB
```

### JWT Payload
```json
{ "id": 1, "email": "user@x.com", "role": "user", "project": "game", "iat": ..., "exp": ... }
```

Admin tokens use `"project": "admin"` and bypass `projectAccessGuard`.

---

## 🔄 Middleware Pipeline (Backend)

```
HTTP Request → Nginx :80/443 → Express :5000

 1. helmet()               — Security headers
 2. cors()                 — CORS whitelist
 3. express.json(5mb)      — Body parsing
 4. morgan()               — HTTP logging → Winston
 5. i18nMiddleware         — Language detection
 6. publicLimiter          — Rate limit /api/*
 7. authLimiter            — Rate limit /api/*/auth/*
 8. riskMiddleware          — DDoS / IP block / injection / bot guards
 9. projectResolver        — sets req.project + req.prisma
10. configResolver         — sets req.configService
    └── route handler
        └── auth + projectAccessGuard → controller
```

---

## 🤖 Auto-Complete (Smart Search)

Shared `AutoComplete` component available via `@ui/pwa/autoComplete`:

```tsx
import { AutoComplete } from '@ui/pwa/autoComplete';

<AutoComplete
  value={query}
  onChange={setQuery}
  onSelect={(item) => navigate(`/games/${item.value.slug}`)}
  apiPrefix="/api/game"
  source="game"
  placeholder="Tìm game..."
/>
```

Backend endpoint: `GET /api/{project}/autocomplete?q={query}&source={source}&limit={n}`

Returns: `{ data: { results: [{ source, items: [{ id, label, value, category, image, score }] }] } }`

---

## ⏰ Cron Jobs (10 registered)

| Schedule      | Job                  | Description                          |
|--------------|----------------------|--------------------------------------|
| `*/14 * * *` | keep-alive           | Self-ping /health/live (prod only)   |
| `*/5 * * *`  | clear-expired-cache  | Flush expired Redis keys             |
| `*/10 * * *` | health-snapshot      | Log RSS/heap/uptime                  |
| `*/30 * * *` | batch-risk-scoring   | Recalculate risk scores (admin DB)   |
| `0 * * * *`  | vip-expiry           | Expire VIP subscriptions             |
| `0 */6 * *`  | purge-ip-blacklist   | Delete expired IP blacklist entries  |
| `0 2 * * *`  | adaptive-limits      | Adjust rate limits per traffic       |
| `0 3 * * *`  | clean-audit-logs     | Delete old info-level audit logs     |
| `0 4 * * *`  | clean-security-logs  | Delete old low/medium security logs  |
| `0 0 * * *`  | reset-daily-flags    | Invalidate `daily:*` Redis keys      |

---

## 🚀 Development Workflow

### 1. First-time setup
```bash
# Install all dependencies
cd source
npm install                          # root workspace (concurrently, typescript)
npm run install:all                  # all 6 SPAs + backend

# Backend: generate Prisma clients + run migrations
cd code/backend
npm run prisma:generate
npm run prisma:migrate:all
npm run seed:all
```

### 2. Daily dev
```bash
# From source/ — run everything at once:
npm run dev:all

# Or start specific SPAs:
npm run dev:hub
npm run dev:game
# Backend only:
npm run dev:backend
```

### 3. Build for production
```bash
# From source/:
npm run build:all

# Or build specific SPA:
npm run build:game
npm run build:admin
```

### 4. Deploy
```bash
# Rolling deploy (no downtime):
bash code/backend/scripts/deploy.sh

# PM2 management:
pm2 reload api-server --update-env
pm2 status
pm2 logs api-server --lines 100
```

---

## 📦 shared-types Package

Located at `source/shared-types/`. Provides TypeScript interfaces for use across all projects.

```bash
# Build once:
cd source/shared-types
npm install
npm run build       # outputs to dist/

# To consume in a SPA's tsconfig.json paths:
# "@kjc/types": ["../../shared-types/dist/index.d.ts"]
```

### Key Types

```ts
IApp            — App catalog entry
IUser           — Platform user
IWallet         — Wallet aggregate (balance, coins, diamonds, transactions)
ITransaction    — Single financial transaction
IApiResponse<T> — Standard API envelope { success, data, error, message, pagination }
INotification   — Push/in-app notification
ISiteConfig     — Dynamic site configuration
IJwtPayload     — JWT token payload
IPaymentGateway — Payment gateway config
```

---

## 🔧 Environment Variables

Copy `code/backend/.env.example` to `code/backend/.env` and fill in all values.

Critical variables:

```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=<48-byte-hex>
JWT_REFRESH_SECRET=<48-byte-hex>
CORS_ORIGINS=https://hub.domain.com,https://game.domain.com,...
HUB_DATABASE_URL=mysql://webadmin:PASS@127.0.0.1:3306/hub_db
GAME_DATABASE_URL=mysql://webadmin:PASS@127.0.0.1:3306/game_db
# ... (see .env.example for all vars)
REDIS_URL=redis://127.0.0.1:6379
```

Each SPA requires `.env` with:
```bash
VITE_PROJECT=hub        # or game / dating / trade / sports / admin
VITE_API_URL=           # empty for web (uses Vite proxy); set for Capacitor native builds
```

---

## 📱 Capacitor (Mobile Apps)

Both `hub` and `game` SPAs support Capacitor for Android/iOS builds.

```bash
# Build + sync to Android:
cd code/frontend/game
npm run cap:android      # builds → sync → open Android Studio

# Live reload on device:
npm run cap:live:android
```

The `CAPACITOR_BUILD=true` env flag switches `base` from `/` to `./` in Vite config for relative asset paths.

---

## 🌍 Nginx Subdomain Map

| Subdomain           | Served From                                     |
|--------------------|-------------------------------------------------|
| `hub.domain.com`   | `frontend/hub/dist/`                           |
| `game.domain.com`  | `frontend/game/dist/`                          |
| `trade.domain.com` | `frontend/trade/dist/`                         |
| `dating.domain.com`| `frontend/dating/dist/`                        |
| `sports.domain.com`| `frontend/sports/dist/`                        |
| `admin.domain.com` | `frontend/admin-dashboard/dist/`               |
| `api.domain.com`   | Proxy → `http://127.0.0.1:5000`                |

SSL via Let's Encrypt (`code/backend/scripts/ssl-setup.sh`).

---

## ✅ Architecture Checklist

- [x] npm (not pnpm / yarn)
- [x] 6 independent SPAs (not monolith)
- [x] Service Workers manual (no VitePWA plugin)
- [x] Wallet cross-cutting via shared-ui (not separate module)
- [x] TypeScript everywhere (strict: false for gradual adoption)
- [x] Auto-complete via `AutoComplete` + `useAutoComplete`
- [x] PWA: install prompt, update banner, offline page
- [x] 6 isolated MySQL databases (Prisma multi-client)
- [x] Redis for caching + job queues
- [x] Socket.IO for real-time events
- [x] PM2 cluster mode for zero-downtime deploy
- [x] Nginx with rate limiting, SSL, gzip, security headers
