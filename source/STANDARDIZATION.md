# 📋 STANDARDIZATION.md — LKVIP GROUP

> Trạng thái: **Đã chuẩn hóa** · Cập nhật lần cuối: Dựa trên hướng dẫn chuẩn hóa framework

---

## 🧠 Nguyên tắc cốt lõi (bất biến)

| Nguyên tắc | Thực hiện |
|------------|-----------|
| Giữ nguyên 6 databases | ✅ Cách ly hoàn toàn — không cross-DB JOINs |
| Giữ nguyên 6 SPAs | ✅ Deploy độc lập, build riêng |
| Chia sẻ code qua workspace | ✅ `pnpm workspaces` — packages/*, shared-ui, shared-types |
| Lazy load & Code splitting | ✅ `manualChunks` trong tất cả vite.config.ts |
| Cache + Nginx | ✅ `immutable` 1y cho /assets/, `no-cache` cho index.html |

---

## 🏗️ Cấu trúc Root Workspace

```
source/
├── packages/                       # Server-side shared packages
│   └── shared-utils/               #   @lkvip/utils (slugify, validators, dates, numbers, strings)
├── backend/                        # lkvip-backend (Express + Prisma multi-client)
│   ├── scripts/                    #   ← helper scripts nội bộ (prisma-run.js, ...)
│   ├── prisma/                     #   6 schemas (admin/hub/game/dating/trade/sports)
│   │   └── seeds/                  #   14 seed scripts
│   ├── src/                        #   application source
│   ├── uploads/                    #   runtime only (.gitkeep)
│   └── backups/                    #   runtime only (.gitkeep)
├── frontend/
│   ├── _template/                  #   Template cho SPA mới
│   ├── shared-ui/                  #   @lkvip/ui (components, hooks, stores, API client)
│   ├── admin-dashboard/            #   @lkvip/admin  (port 5180)
│   ├── hub/                        #   @lkvip/hub    (port 5173)
│   ├── game/                       #   @lkvip/game   (port 5174)
│   ├── dating/                     #   @lkvip/dating (port 5176)
│   ├── trade/                      #   @lkvip/trade  (port 5177)
│   └── sports/                     #   @lkvip/sports (port 5178)
├── shared-types/                   # @lkvip/types (TypeScript interfaces)
├── scripts/                        # @lkvip/cli (Commander CLI)
│   ├── new-module.sh               #   Scaffold backend module
│   └── new-spa.sh                  #   Scaffold frontend SPA
├── logs/                           # runtime only (.gitkeep — excluded from git)
├── uploads/                        # runtime only (.gitkeep — excluded from git)
├── tsconfig.base.json              # Base TS config cho backend/shared-types/@lkvip/cli
├── tsconfig.frontend.base.json     # ← Base TS config dùng chung cho tất cả 6 SPAs
├── .eslintrc.base.js               # ESLint base cho React/TypeScript (frontend)
├── .eslintrc.node.js               # ← ESLint base cho Node.js/CommonJS (backend)
└── pnpm-workspace.yaml             # Workspace packages
```

---

## 📦 Packages (`source/packages/`)

### `@lkvip/utils` — Backend utilities (CommonJS, source-direct)

```js
const { slugify, isEmail, formatVND, addDays, truncate, mask, randomCode } = require('@lkvip/utils');
```

| Module | Exports |
|--------|---------|
| `slugify` | `slugify(str, opts)` — URL-safe slug hỗ trợ tiếng Việt |
| `strings` | `truncate`, `zeroPad`, `mask`, `randomCode`, `normalizePhone`, `toSnakeCase` |
| `dates` | `formatVNDateTime`, `addMinutes`, `addDays`, `isPast`, `startOfDay`, `formatDuration` |
| `validators` | `isEmail`, `isPassword`, `isUsername`, `isPhone`, `isValidAmount`, `missingFields` |
| `numbers` | `formatVND`, `clamp`, `round`, `pct`, `safeInt` |

---

## 🖥️ Backend — Chuẩn hóa

### Response helpers (`shared/utils/response.js`)

Tất cả responses đều bao gồm `timestamp: Date.now()`.

```js
const { ok, created, paginate, badRequest, notFound, forbidden, unauthorized, conflict, validationError, serverError } = require('./shared/utils/response');

ok(res, data)                                  // 200 { success, message, data, timestamp }
created(res, data)                             // 201
paginate(res, items, { total, page, limit })   // 200 + meta.pages tự tính
badRequest(res, 'Invalid input')               // 400
validationError(res, 'Failed', [{field, message}]) // 422
```

### Error Handler (`shared/middlewares/errorHandler.js`)

- Import đúng từ `../services/logger` (đã fix)
- Log `[METHOD] /url → STATUS — message` + `project` + `userId`
- Stack trace trong `body.stack` khi `NODE_ENV !== production`

### Prisma Connection Pool (`config/databases.js`)

Thêm `?connection_limit=N` vào DATABASE_URL:

```bash
# .env
GAME_DATABASE_URL=mysql://user:pass@127.0.0.1:3306/game_db?connection_limit=10
HUB_DATABASE_URL=mysql://user:pass@127.0.0.1:3306/hub_db?connection_limit=8
```

**Khuyến nghị:**
- hub, trade, sports, dating: `5–8`
- game, admin: `10–15`
- MySQL 8 default max_connections = 151

**Graceful shutdown:**
```js
const { disconnectAll } = require('./config/databases');
process.on('SIGTERM', async () => { await disconnectAll(); process.exit(0); });
```

---

## 🎨 Frontend — Chuẩn hóa

### Vite Config chuẩn (tất cả 6 SPAs)

```typescript
resolve: {
  alias: {
    '@':          path.resolve(__dirname, './src'),
    '@ui':        path.resolve(__dirname, '../shared-ui'),      // source-direct
    '@lkvip/types': path.resolve(__dirname, '../../shared-types/src'), // source-direct
    // Force peer deps từ SPA's node_modules (ngăn duplicate React instances)
    'react':            path.resolve(__dirname, './node_modules/react'),
    'react-dom':        path.resolve(__dirname, './node_modules/react-dom'),
    'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
    'lucide-react':     path.resolve(__dirname, './node_modules/lucide-react'),
    'zustand':          path.resolve(__dirname, './node_modules/zustand'),
    'axios':            path.resolve(__dirname, './node_modules/axios'),
  },
  dedupe: ['react', 'react-dom', 'react-router-dom'],
}
```

### Trạng thái vite.config.ts sau chuẩn hóa

| SPA | Peer dep aliases | minify | manualChunks fn | /uploads proxy |
|-----|:---:|:---:|:---:|:---:|
| hub | ✅ | — | ✅ | ✅ |
| game | ✅ | ✅ | ✅ | — |
| admin-dashboard | ✅ | ✅ | ✅ | — |
| trade | ✅ | ✅ | ✅ | — |
| sports | ✅ | ✅ | ✅ | — |
| dating | ✅ ← fixed | ✅ ← added | ✅ ← fixed | ✅ ← added |

---

## 🚀 Tạo module/SPA mới

### Backend module mới

```bash
bash source/scripts/new-module.sh loyalty
```

Tạo: `backend/src/modules/loyalty/` với controllers, routes, services.

### Frontend SPA mới

```bash
bash source/scripts/new-spa.sh loyalty loyalty 5181
```

Tạo: `frontend/loyalty/` từ `_template/` với port và project ID được inject.

Sau đó thêm vào `pnpm-workspace.yaml`:
```yaml
- "frontend/loyalty"
```

---

## 🛠 Bộ công cụ CLI đa nền tảng (Node.js)

Toàn bộ các script quản trị đã được chuyển đổi sang `.js` để chạy đồng nhất trên Windows/Linux/macOS.

- **Chạy script:** Sử dụng lệnh `node scripts/<tên-script>.js`.
- **Các cờ hỗ trợ (tùy chọn):**
    - `--verbose`: In log chi tiết các lệnh hệ thống.
    - `--dry-run`: Chạy thử, in lệnh sẽ thực hiện mà không làm thay đổi hệ thống.

| Script cũ | Lệnh Node.js mới |
| :--- | :--- |
| `bash scripts/check-env.sh` | `node scripts/check-env.js` |
| `bash scripts/migrate-all.sh` | `node scripts/migrate-all.js` |
| `bash scripts/backup-db.sh` | `node scripts/backup-db.js` |
| `bash scripts/deploy.sh` | `node scripts/deploy.js` |

---

## 🗄️ Nginx Cache Strategy

| Loại file | Cache | Lý do |
|-----------|-------|-------|
| `index.html` | `no-cache` | Chứa hash references — phải luôn fresh |
| `/assets/*.js`, `*.css` | `1y + immutable` | Vite hash tên file → safe to cache forever |
| `/uploads/*` | `30d` | User content — ít thay đổi |
| Font/image ngoài /assets/ | `1y + immutable` | Add `location ~* \.(woff2?|png|...)` nếu cần |

---

## ✅ Checklist chuẩn hóa

### ✅ Đã hoàn thành — v2.0

- [x] `pnpm-workspace.yaml` — thêm `packages/*`, fix `allowBuilds` lỗi
- [x] `source/package.json` — thêm `build:utils`, `build:packages`
- [x] `packages/shared-utils` (`@lkvip/utils`) — slugify, strings, dates, validators, numbers
- [x] `backend/src/shared/middlewares/errorHandler.js` — fix import logger, log request context
- [x] `backend/src/shared/utils/response.js` — thêm `timestamp`, `noContent`, `conflict`
- [x] `backend/src/config/databases.js` — document connection pooling, thêm `disconnectAll()`
- [x] `frontend/dating/vite.config.ts` — thêm peer dep aliases, fix manualChunks, thêm minify
- [x] `frontend/_template/` — SPA template chuẩn (package.json, vite.config, tsconfig, App, main)
- [x] `nginx/nginx.conf` — document cache strategy cho immutable assets
- [x] `scripts/new-module.sh` — scaffold backend module tự động
- [x] `scripts/new-spa.sh` — scaffold frontend SPA từ _template

### ✅ Đã hoàn thành — v2.1 (Cleanup & Standardization)

- [x] `backend/scripts/prisma-run.ts` — tham số hóa 18 Prisma scripts → 1 TypeScript script linh hoạt (tsx)
- [x] `backend/package.json` — rút gọn từ ~50 → 33 scripts; seeds đổi sang `.ts` + `tsx`; thêm jest/ts-jest
- [x] `backend/tsconfig.json` — thêm `scripts/**/*` vào include (bao gồm prisma-run.ts)
- [x] `tsconfig.frontend.base.json` — base TS config dùng chung cho tất cả 7 React packages
- [x] `frontend/{hub,game,dating,trade,sports,admin-dashboard,_template}/tsconfig.json` — đều extend `tsconfig.frontend.base.json`
- [x] `frontend/{hub,game,dating,_template}/tsconfig.node.json` — chuẩn hóa thống nhất (ES2022/bundler/verbatimModuleSyntax)
- [x] `frontend/shared-ui/tsconfig.json` — extend `tsconfig.frontend.base.json`, bỏ outDir/declaration (source-direct)
- [x] `.eslintrc.node.js` — ESLint base riêng cho Node.js/CommonJS backend
- [x] `backend/.eslintrc.js` — extend `.eslintrc.node.js` + TypeScript parser override cho `.ts` files
- [x] `frontend/admin-dashboard/eslint.config.js` — ESLint v9 flat config
- [x] `frontend/shared-ui/eslint.config.js` — ESLint v9 flat config
- [x] `frontend/{hub,game,dating,trade,sports}/.oxlintrc.json` — oxlint config (react-hooks rules)
- [x] `frontend/{game,dating,trade,sports}/package.json` — thêm `lint` + `typecheck` scripts + `oxlint` dep
- [x] `frontend/shared-ui/package.json` — thêm `lint`, `typecheck`, `eslint`, `@eslint/js` deps
- [x] `source/package.json` — thêm `prisma:generate`, `prisma:deploy`, `prisma:status`, `lint:frontend`, `typecheck:all`, `test`, `test:all` ở root
- [x] `source/.gitignore` — thêm `**/seeds_backup/`, `**/uploads/*`, `.pnpm-store/`
- [x] `logs/`, `uploads/`, `backend/uploads/`, `backend/backups/` — dọn files rác, chỉ giữ `.gitkeep`

### ✅ Đã hoàn thành — v2.2 (Backend Hardening)

- [x] `backend/src/shared/utils/response.ts` — chuyển từ ES Module `export` sang `module.exports` (CommonJS)
- [x] `backend/src/shared/middlewares/projectResolver.ts` — sửa path `require('../config/databases')` → `../../config/databases`; dùng `ROUTE_PROJECT_MAP` + `PROJECT_IDS` từ `@lkvip/constants`
- [x] `backend/src/shared/middlewares/projectAccessGuard.ts` — sửa path `require('../config/databases')` → `../../config/databases`
- [x] `backend/src/shared/middlewares/configResolver.ts` — sửa path `require('../config/databases')` → `../../config/databases`
- [x] `backend/src/shared/middlewares/adminGuard.ts` — dùng `ADMIN_ROLES` từ `@lkvip/constants`
- [x] `backend/src/shared/middlewares/auth.ts` — dùng `PROJECT_IDS` từ `@lkvip/constants`; loại bỏ hardcode list
- [x] `backend/src/shared/services/configService.ts` — bỏ `new Redis()` riêng, dùng shared redis singleton (`../../config/redis`)
- [x] `backend/src/shared/services/notificationService.ts` — thêm `get _io()` getter để cron jobs có thể truy cập `notifSvc._io`
- [x] `backend/src/shared/services/riskService.ts` — sửa path `require('../config/databases')` → `../../config/databases`
- [x] `backend/src/shared/services/authService.ts` — dùng `PROJECT_IDS` từ `@lkvip/constants`; thêm TypeScript interfaces
- [x] `backend/src/shared/utils/helpers.ts` — re-export từ `@lkvip/utils` + backend-only helpers (paginate, calcAge, …)
- [x] `backend/src/shared/utils/constants.ts` — re-export từ `@lkvip/constants` + backend-only status enums
- [x] `backend/src/shared/utils/validators.ts` — re-export từ `@lkvip/utils` + stricter backend validators
- [x] `backend/src/shared/config/swagger.ts` — chuyển từ unsafe `swaggerJsdoc()` trực tiếp → re-export `../../config/swagger` (graceful fallback)
- [x] `backend/src/shared/config/databases.ts` — cập nhật comment `.js` → `.ts`
- [x] `backend/src/shared/types/index.d.ts` — xóa `export * from '@lkvip/types'` (package không tồn tại); viết inline `ProjectId`, `JwtPayload`, `IConfigService`
- [x] `backend/src/config/index.ts` — thêm export `socket` (socketStore setIo/getIo singleton)
- [x] `backend/src/server.ts` (shim) — sửa path `require('../../server')` → `require('../server')` (đúng relative path)
- [x] `backend/server.ts` (root entry) — thêm i18n middleware, riskMiddleware pipeline, configResolver, socketStore.setIo, shared errorHandler, disconnectAll() trong graceful shutdown, gzip compression
- [x] `backend/server.ts` — **CORS production guard**: throw `Error` nếu `CORS_ORIGINS` không được set trong production
- [x] `backend/package.json` — thêm `@lkvip/constants: workspace:*`, `@lkvip/utils: workspace:*`; xác nhận `compression` đã có
- [x] `backend/tsconfig.json` — thêm `paths` alias cho `@lkvip/constants` và `@lkvip/utils`
- [x] `backend/jsconfig.json` — sửa `baseUrl` sai (`./backend/src` → `./src`), thêm `@lkvip/*` paths
- [x] `source/.nvmrc` — tạo file chỉ định Node.js 20
- [x] `source/packages/constants` (`@lkvip/constants`) — tạo package: `PROJECT_IDS`, `USER_ROLES`, `ADMIN_ROLES`, `ROLE_LEVEL`, `isAdminRole`, `roleAtLeast`, `HTTP_STATUS`, `ERROR_CODES`, `CURRENCY_CODES`, `GATEWAY_MIN_AMOUNT`
- [x] `node_modules/@lkvip/{constants,utils}` — tạo junction symlinks để resolve workspace packages

### ✅ Đã hoàn thành — v2.3 (Path Fix — Zero TSC Errors)

- [x] `backend/src/risk/fraudDetector.ts` — sửa `'../config/databases'` → `'../../config/databases'`
- [x] `backend/src/risk/deviceFingerprint.ts` — sửa path tương tự
- [x] `backend/src/risk/bruteForceDetector.ts` — sửa path tương tự
- [x] `backend/src/risk/botDetector.ts` — sửa path tương tự
- [x] `backend/src/risk/securityMonitor.ts` — sửa path tương tự
- [x] `backend/src/risk/contentModerator.ts` — sửa path tương tự
- [x] `backend/src/risk/ddosDetector.ts` — sửa path tương tự
- [x] `backend/src/shared/services/auditService.ts` — sửa `'../config/databases'` → `'../../config/databases'`
- [x] `backend/src/shared/controllers/paymentController.ts` — sửa path tương tự
- [x] `backend/src/shared/controllers/paymentMonitorController.ts` — sửa path tương tự
- [x] `backend/src/shared/services/aggregators/index.ts` — sửa `'../../../config/databases'` → `'../../config/databases'`
- [x] `backend/src/modules/admin/controllers/opsController.ts` — sửa `'../../../config/databases'` → `'../../../shared/config/databases'`
- [x] `backend/src/modules/admin/controllers/appCatalogController.ts` — sửa path tương tự
- [x] **`tsc --noEmit` PASS — zero errors** ✅
- [x] `backend/src/app.ts` vs `backend/src/server.ts` — xác nhận 2 shims đúng, khác nhau ở comment; không trùng lặp logic

### ✅ Đã hoàn thành — v2.4 (MySQL · Redis · Socket.IO Standardization)

Dựa trên patterns từ egg-mysql, @eggjs/redis và egg-socket.io — áp dụng vào Express/Prisma/ioredis/Socket.IO stack.

#### MySQL / Prisma

- [x] `backend/src/shared/services/transactionService.ts` — **tạo mới**: Prisma `$transaction` helper với:
  - `runTx(prisma, fn, options)` — chạy interactive transaction, retry tự động khi deadlock (P2034, tối đa 3 lần, exponential backoff 100 → 200 → 400ms)
  - `runTxWith(project, fn, options)` — variant tiện lợi, resolve client từ tên project
  - `creditBalance(prisma, userId, amount, type, note)` — credit + ledger entry nguyên tử
  - `debitBalance(prisma, userId, amount, type, note)` — debit + ledger entry nguyên tử, throw `INSUFFICIENT_BALANCE` nếu thiếu tiền
  - Options: `isolationLevel`, `maxWait` (5 000ms), `timeout` (15 000ms), `maxRetries`
  - Log slow transactions (> 80% timeout), log mọi retry attempt
- [x] `backend/src/modules/admin/controllers/monitorController.ts` — `getOnlineStats()` dùng `sessionService.countOnline()` (Redis sorted-set) thay vì heuristic từ Socket.IO room size; vẫn đính kèm `socketConnections` như secondary signal

#### Redis / ioredis

- [x] `backend/src/shared/middlewares/rateLimiter.ts` — **refactor**: loại bỏ 3rd Redis connection riêng; dùng shared singleton `require('../../config/redis').raw` cho `RateLimiterRedis`; check `redisStore.isConnected` để switch fallback; thêm `insuranceLimiter` (memory fallback khi Redis momentarily unavailable)
- [x] `backend/src/shared/services/sessionService.ts` — **tạo mới**: Redis-backed session management với:
  - Key schema: `session:{project}:{userId}` (TTL 2h), `sessions:online:{project}` (sorted-set, score = last seen), `session:refresh:{project}:{userId}` (TTL 30d)
  - `create/touch/get/destroy` — CRUD phiên, tự động update sorted-set presence
  - `bindRefreshToken / verifyRefreshToken / revokeRefreshToken` — refresh token binding (lưu SHA-256 hash, không lưu raw token)
  - `isOnline / getOnlineUsers / countOnline` — presence queries từ Redis sorted-set (ONLINE_TTL = 5 phút)
  - Graceful fallback: tất cả lỗi Redis được log + suppress, không crash request
- [x] Process duy trì **đúng 1 Redis connection** (config/redis.ts); cả `rateLimiter`, `cacheService`, `configService`, `riskMiddleware`, `sessionService` đều dùng chung

#### Socket.IO

- [x] `backend/src/config/socket.ts` — thêm `emitAdminNsp(project, event, data)`: emit song song tới `/admin` namespace `project:{p}` + `admin:all` rooms; fallback về default ns khi `/admin` chưa mount
- [x] `backend/src/shared/socket/handlers.ts` — **nâng cấp**:
  - Tách `makeAuthMiddleware()` factory để tái sử dụng cho cả default `/` và `/admin` namespaces
  - Mount **`/admin` namespace** (`io.of('/admin')`): auth-gate chỉ cho role `admin`/`super_admin`; auto-join rooms theo role; `admin:join_project` để switch project context; `admin:joined` ack event
  - `heartbeat` event: `sessionSvc.touch(project, userId)` để refresh TTL và sorted-set score mà không cần DB round-trip
  - `user:join`: lưu `socket._joinedProject` cho disconnect cleanup; gọi `sessionSvc.touch()` + emit `admin:online_count` update tới admin rooms
  - `disconnect`: `sessionSvc.destroy(project, userId)` cho graceful logout; TTL-based expiry xử lý ungraceful disconnect
  - Legacy `admin:join_project` trên default ns vẫn giữ (backwards compat)
- [x] `backend/src/shared/socket/projectEmitter.ts` — `_adminBroadcast()` helper: fan-out mọi event tới cả default ns rooms (`emitAdminEvent`) **và** `/admin` ns rooms (`emitAdminNsp`); đảm bảo cả legacy lẫn new admin-dashboard clients đều nhận events

#### Services index

- [x] `backend/src/shared/services/index.ts` — thêm `sessionService` và `transactionService` vào barrel export

### ⬜ Còn lại (thực hiện khi cần)

- [ ] Thêm `?connection_limit=N` vào DATABASE_URLs trong `.env` (production)
- [ ] Kiểm tra và bổ sung indexes trên các cột thường query (per-project Prisma schema)
- [ ] CDN cho static assets (Cloudinary, S3) — cập nhật `CDN_BASE_URL` trong .env
- [ ] Push Notifications (FCM/APNs) — hiện tại là stub
- [ ] Docker: `Dockerfile` + `docker-compose.yml` cho local dev
- [ ] CI/CD: `.github/workflows/` — GitHub Actions (lint → typecheck → test → build)

---

## 📚 Tài liệu liên quan

- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) — Hướng dẫn Prisma migrations
- [`backend/scripts/README.md`](./backend/scripts/README.md) — prisma-run.ts usage & cú pháp
- [`backend/src/shared/README.md`](./backend/src/shared/README.md) — Shared middleware/service docs
- [`packages/shared-utils/README.md`](./packages/shared-utils/README.md) — @lkvip/utils API docs
- [`frontend/_template/`](./frontend/_template/) — Template cho SPA mới
- [`tsconfig.frontend.base.json`](./tsconfig.frontend.base.json) — Base TS config cho React SPAs
- [`.eslintrc.node.js`](./.eslintrc.node.js) — ESLint base cho Node.js/CommonJS projects
