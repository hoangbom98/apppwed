# 📋 STANDARDIZATION.md — KJC Multi-Project Platform

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
├── packages/                 # ← MỚI: Server-side shared packages
│   └── shared-utils/         #   @kjc/utils (slugify, validators, dates, numbers, strings)
├── backend/                  # @kjc/backend (Express + Prisma multi-client)
├── frontend/
│   ├── _template/            # ← MỚI: Template cho SPA mới
│   ├── shared-ui/            # @kjc/ui (components, hooks, stores, API client)
│   ├── admin-dashboard/      # @kjc/admin  (port 5180)
│   ├── hub/                  # @kjc/hub    (port 5173)
│   ├── game/                 # @kjc/game   (port 5174)
│   ├── dating/               # @kjc/dating (port 5176)
│   ├── trade/                # @kjc/trade  (port 5177)
│   └── sports/               # @kjc/sports (port 5178)
├── shared-types/             # @kjc/types (TypeScript interfaces)
├── scripts/                  # @kjc/cli (Commander CLI)
│   ├── new-module.sh         # ← MỚI: Scaffold backend module
│   └── new-spa.sh            # ← MỚI: Scaffold frontend SPA
└── pnpm-workspace.yaml       # Đã bao gồm packages/*
```

---

## 📦 Packages (`source/packages/`)

### `@kjc/utils` — Backend utilities (CommonJS, source-direct)

```js
const { slugify, isEmail, formatVND, addDays, truncate, mask, randomCode } = require('@kjc/utils');
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
    '@kjc/types': path.resolve(__dirname, '../../shared-types/src'), // source-direct
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

## 🗄️ Nginx Cache Strategy

| Loại file | Cache | Lý do |
|-----------|-------|-------|
| `index.html` | `no-cache` | Chứa hash references — phải luôn fresh |
| `/assets/*.js`, `*.css` | `1y + immutable` | Vite hash tên file → safe to cache forever |
| `/uploads/*` | `30d` | User content — ít thay đổi |
| Font/image ngoài /assets/ | `1y + immutable` | Add `location ~* \.(woff2?|png|...)` nếu cần |

---

## ✅ Checklist chuẩn hóa

### ✅ Đã hoàn thành

- [x] `pnpm-workspace.yaml` — thêm `packages/*`, fix `allowBuilds` lỗi
- [x] `source/package.json` — thêm `build:utils`, `build:packages`
- [x] `packages/shared-utils` (`@kjc/utils`) — slugify, strings, dates, validators, numbers
- [x] `backend/src/shared/middlewares/errorHandler.js` — fix import logger, log request context
- [x] `backend/src/shared/utils/response.js` — thêm `timestamp`, `noContent`, `conflict`
- [x] `backend/src/config/databases.js` — document connection pooling, thêm `disconnectAll()`
- [x] `frontend/dating/vite.config.ts` — thêm peer dep aliases, fix manualChunks, thêm minify
- [x] `frontend/_template/` — SPA template chuẩn (package.json, vite.config, tsconfig, App, main)
- [x] `nginx/nginx.conf` — document cache strategy cho immutable assets
- [x] `scripts/new-module.sh` — scaffold backend module tự động
- [x] `scripts/new-spa.sh` — scaffold frontend SPA từ _template

### ⬜ Còn lại (thực hiện khi cần)

- [ ] Thêm `?connection_limit=N` vào DATABASE_URLs trong `.env` (production)
- [ ] Thêm `disconnectAll()` vào PM2 SIGTERM handler trong `server.js`
- [ ] Kiểm tra và bổ sung indexes trên các cột thường query (per-project Prisma schema)
- [ ] CDN cho static assets (Cloudinary, S3) — cập nhật `CDN_BASE_URL` trong .env
- [ ] Push Notifications (FCM/APNs) — hiện tại là stub
- [ ] Fix `projectAccessGuard` để kiểm tra `req.user.project === req.project`
- [ ] Fix `CORS_ORIGINS` fallback — throw nếu không có trong production

---

## 📚 Tài liệu liên quan

- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) — Hướng dẫn Prisma migrations
- [`backend/src/shared/README.md`](./backend/src/shared/README.md) — Shared middleware/service docs
- [`packages/shared-utils/README.md`](./packages/shared-utils/README.md) — @kjc/utils API docs
- [`frontend/_template/`](./frontend/_template/) — Template cho SPA mới
