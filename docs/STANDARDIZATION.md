# Tài Liệu Chuẩn Hóa Kỹ Thuật — LKVIP GROUP Platform

> **Cập nhật lần cuối:** 2025-07 (sau task 1–8: Prisma migration, workspace-db async, TypeScript clean, deploy pipeline)
> **Phạm vi áp dụng:** Toàn bộ monorepo tại `/var/LKVIP`

---

## MỤC LỤC

1. [Tiêu Chuẩn DB Access](#1-tiêu-chuẩn-db-access)
2. [Tiêu Chuẩn TypeScript](#2-tiêu-chuẩn-typescript)
3. [Tiêu Chuẩn Dependency](#3-tiêu-chuẩn-dependency)
4. [Tiêu Chuẩn Deploy](#4-tiêu-chuẩn-deploy)
5. [Lịch Sử Chuẩn Hóa VPS Full-Stack](#5-lịch-sử-chuẩn-hóa-vps-full-stack)
6. [Chuẩn Hóa MongoDB & Security](#6-chuẩn-hóa-mongodb--security)

---

## 1. TIÊU CHUẨN DB ACCESS

### 1.1 Kiến Trúc Database Chuẩn

| Scope | Database | ORM/Client | Trạng Thái |
|-------|----------|-----------|------------|
| Core platform (hub, game, trade, dating, sports, admin) | MySQL 8 | Prisma 5.15.0 (6 client riêng biệt) | ✅ Chuẩn |
| `lkvipgroup-portal` | PostgreSQL (Supabase cloud) | Prisma 6.3.0 (`fortress-client`) | ✅ Chuẩn — exception được document |
| `apps/external/` (landing, anonymous-voice, graph-ai) | MongoDB | Mongoose / @nestjs/mongoose | ℹ️ Isolated — không kết nối core |

### 1.2 Quy Tắc Truy Cập DB

- **Bắt buộc:** Mọi truy vấn database trong portal phải sử dụng `async/await` với Prisma Client.
- **Cấm:** Truy cập file JSON phẳng (flat-file) hay bộ nhớ in-memory cho dữ liệu cần bền vững.
- **Cấm:** Tạo `new PrismaClient()` trực tiếp trong business logic — phải dùng singleton từ `src/lib/db.ts`.
- **Bắt buộc (backend):** Lấy Prisma client qua factory trong `apps/backend/src/config/databases.ts`.
- **Cấm:** Trộn datasource — MySQL schema không được truy cập từ portal, PostgreSQL schema không được truy cập từ backend.

### 1.3 Lớp DB Async cho Portal

Kể từ task 2–3, `apps/lkvipgroup-portal/src/lib/workspace-db.ts` là lớp truy cập DB chuẩn cho Workspace feature trong portal:

```
src/lib/
  db.ts            ← Prisma singleton (PrismaClient từ .prisma/fortress-client)
  workspace-db.ts  ← Async data layer cho Sprint, Task, Comment
```

Tất cả function trong `workspace-db.ts` đều là `async` và trả về `Promise<T>`. API routes phải dùng `await` khi gọi các function này.

---

## 2. TIÊU CHUẨN TYPESCRIPT

### 2.1 Quy Tắc Bắt Buộc

| Quy Tắc | Mô Tả |
|---------|-------|
| **0 lỗi TypeScript** | `tsc --noEmit` phải pass (exit code 0) trong tất cả workspace — bắt buộc trước khi merge/deploy |
| **Cấm `@ts-nocheck`** | Không được thêm `@ts-nocheck` vào bất kỳ file mới nào; các file legacy đang có không được mở rộng pattern này |
| **Hạn chế `any`** | Không dùng `any` như giải pháp tắt; dùng kiểu cụ thể, generic có ràng buộc, hoặc union/narrowed |
| **Cấm `@ts-ignore`** | Chỉ dùng khi có comment giải thích rõ lý do kỹ thuật cụ thể |

### 2.2 Cấu Hình TypeScript Theo Workspace

| Workspace | strict | Target | Ghi Chú |
|-----------|--------|--------|---------|
| `apps/backend` | `false` | ES2022 | Legacy CommonJS — không thay đổi |
| `apps/lkvipgroup-portal` | `true` (qua tsconfig base) | ES2022 | Next.js App Router |
| `apps/academy` | `true` | ES2022 | Next.js 15 |
| Frontend SPAs | `true` | ES2020 | Vite + React |

### 2.3 Trạng Thái TypeScript Sau Task 7

```
apps/backend:          tsc --noEmit → 0 lỗi ✅
apps/lkvipgroup-portal: tsc --noEmit → 0 lỗi ✅
```

**Lưu ý:** Backend có 256 file legacy dùng `@ts-nocheck` trong các module risk, social, marketing, gamification — đây là technical debt tồn tại từ trước, không được mở rộng thêm.

---

## 3. TIÊU CHUẨN DEPENDENCY

### 3.1 Quy Tắc Ghim Phiên Bản

- **Cấm wildcard `"*"`, `"latest"`, `"x"`** trong tất cả `package.json` của monorepo.
- **Cấm prefix `^` (caret)** trên các dependency production — dùng phiên bản exact.
- **Có thể dùng `^` cho devDependencies** khi phiên bản patch/minor không ảnh hưởng đến output.
- **Workspace references** (`workspace:*`) được phép vì được resolve bởi pnpm workspaces.

### 3.2 Ví Dụ Đúng / Sai

```json
// ❌ SAI — wildcard và caret rủi ro cao
{
  "react": "*",
  "next": "^15.3.0",
  "axios": "^1.7.9"
}

// ✅ ĐÚNG — phiên bản exact
{
  "react": "19.0.0",
  "next": "15.3.0",
  "axios": "1.7.9"
}
```

### 3.3 Đồng Bộ Phiên Bản Trong Monorepo

Khi cập nhật phiên bản của một package dùng chung (React, Next.js, TypeScript, Tailwind), phải cập nhật đồng bộ toàn bộ workspace liên quan. Tham khảo phiên bản từ workspace có phiên bản mới nhất và ổn định nhất (hiện tại: `lkvipgroup-portal`).

### 3.4 Trạng Thái Dependency Sau Task 5

| Workspace | Trạng Thái | Ghi Chú |
|-----------|-----------|---------|
| `apps/academy` | ✅ Đã ghim exact | Đã sửa trong task 5 |
| `apps/lkvipgroup-portal` | ✅ Đã ghim exact | Dùng làm tham chiếu |
| `apps/invest` | ⚠️ Vẫn còn `"*"` | Cần sửa trong phase tiếp theo |
| `apps/lkvip-store` | ⚠️ Vẫn còn `"*"` | Cần sửa trong phase tiếp theo |

---

## 4. TIÊU CHUẨN DEPLOY

### 4.1 Entry Point Deploy

- **`scripts/deploy.sh`** là entry point **duy nhất** cho mọi deployment lên VPS.
- Không deploy thủ công bằng các lệnh riêng lẻ — phải chạy toàn bộ script.
- Script có tính **idempotent**: an toàn khi chạy nhiều lần liên tiếp.

```bash
# Cách deploy chuẩn
bash /var/LKVIP/scripts/deploy.sh
```

### 4.2 Cấu Hình Next.js: Bắt Buộc Standalone

Tất cả ứng dụng Next.js trong monorepo **phải** khai báo `output: "standalone"` trong `next.config.ts`:

```typescript
// next.config.ts — cấu hình bắt buộc cho mọi Next.js app
const nextConfig: NextConfig = {
  output: "standalone",
  // ...
};
```

| App | Port | Standalone | Trạng Thái |
|-----|------|-----------|------------|
| `lkvipgroup-portal` | 3010 | ✅ | Đang chạy |
| `invest` | 3011 | ✅ | Đang chạy |
| `lkvip-store` | 3012 | ✅ | Đang chạy |
| `academy` | 3013 | ✅ | Đang chạy |

### 4.3 PM2: Cơ Chế Reload Chuẩn

PM2 là cơ chế quản lý process chuẩn cho tất cả ứng dụng trên VPS:

- **Reload:** `pm2 reload <tên-app> --update-env` (zero-downtime)
- **Start lần đầu:** `pm2 start config/pm2/ecosystem.config.js --env production --only <tên-app>`
- **Idempotent pattern** trong deploy.sh:

```bash
if pm2 describe <tên-app> > /dev/null 2>&1; then
  pm2 reload <tên-app> --update-env
else
  pm2 start config/pm2/ecosystem.config.js --env production --only <tên-app>
fi
```

| Process PM2 | App | Port | Chế Độ |
|------------|-----|------|--------|
| `lkvip-api` | backend | 5000 | cluster |
| `lkvip-portal` | lkvipgroup-portal | 3010 | fork |
| `lkvip-invest` | invest | 3011 | fork |
| `lkvip-store` | lkvip-store | 3012 | fork |
| `lkvip-academy` | academy | 3013 | fork |

### 4.4 Static Assets — Pattern Bắt Buộc

Sau mỗi `next build`, phải copy static assets vào thư mục standalone:

```bash
cp -r apps/<name>/.next/static  apps/<name>/.next/standalone/.next/static
cp -r apps/<name>/public        apps/<name>/.next/standalone/public
```

### 4.5 Prisma Migrations Trong Deploy

```bash
# Schema MySQL (backend)
pnpm run prisma:deploy

# Schema PostgreSQL (portal)
pnpm --filter @lkvip/portal run db:migrate
```

---

## 5. LỊCH SỬ CHUẨN HÓA VPS FULL-STACK

> Kết quả từ plan `.bob/plans/deploy-lkvip-vps.md`

### Sub-Task 1 — Academy: `next.config.ts` standalone output

**Status:** `[x] done` ✅

**Kết quả:**
- `apps/academy/next.config.ts` đã có `output: "standalone"` — nhất quán với invest, lkvip-store, lkvipgroup-portal

---

### Sub-Task 2 — Academy: `start-academy.sh` và PM2 entry

**Status:** `[x] done` ✅

**Kết quả:**
- `apps/academy/start-academy.sh` đã tạo với PORT=3013, HOSTNAME=127.0.0.1
- `config/pm2/ecosystem.config.js` đã có entry `lkvip-academy`
- `https://academy.tc-gaming.live` đã có trong CORS_ORIGINS

---

### Sub-Task 3 — Nginx: server block cho `academy.tc-gaming.live`

**Status:** `[x] done` ✅

**Kết quả:**
- `upstream lkvip_academy` (127.0.0.1:3013) trong `config/nginx/tc-gaming.conf`
- HTTPS server block với proxy headers đầy đủ
- SSL placeholder sẵn sàng cho certbot

---

### Sub-Task 4 — `deploy.sh`: chuẩn hóa đầy đủ tất cả Next.js apps

**Status:** `[x] done` ✅ (hoàn thành trong task 6)

**Kết quả trong `scripts/deploy.sh`:**
- Build + copy static assets cho portal (4b), invest (4c), store (4d), academy (4e)
- PM2 idempotent reload cho 5 processes (api, portal, invest, store, academy)
- Bổ sung bước 6b: portal Prisma migrate deploy
- Comment tiếng Việt cho tất cả khối logic

---

### Sub-Task 5 — `academy/.env.example`: bổ sung production vars

**Status:** `[x] done` ✅

---

## 6. CHUẨN HÓA MONGODB & SECURITY

> Kết quả từ plan `.bob/plans/standardize-no-mongodb.md`

### Kiến Trúc Database Đã Xác Nhận

| Scope | Database | ORM | Trạng Thái |
|-------|----------|-----|------------|
| Core platform (hub, game, trade, dating, sports, admin) | MySQL 8 | Prisma 5.15.0 (6 client factory) | ✅ Đúng |
| `lkvipgroup-portal` | PostgreSQL (Supabase cloud) | Prisma 6.3.0 | ✅ Exception được document |
| `apps/external/` (landing, anonymous-voice, graph-ai) | MongoDB | Mongoose / @nestjs/mongoose | ℹ️ Isolated — không kết nối core |

### Verified: Zero MongoDB Trong Core Platform

```bash
# Kết quả grep trong toàn bộ core apps:
# apps/hub, game, trading, dating, sports, banking, invest, lkvip-store,
# academy, admin-dashboard, lkvipgroup-portal, backend, mobile
# → No matches found ✅
```

### Security Fixes Applied

| Fix | File | Vấn đề |
|-----|------|--------|
| Xóa MONGODB_URI legacy | `apps/lkvipgroup-portal/.env.example` | Config nhầm nhổn MongoDB trong portal PostgreSQL |
| Xóa hardcoded Atlas credentials | `apps/external/anonymous-voice/server/src/server.ts` | Credentials visible trong source code |
| Fix MFA fallback encryption key | `apps/external/landing/server/src/utils/mfa.ts` | Default key `'default-long-secret-key-32-chars!!'` đã xóa |
| Xóa password logging | `apps/external/landing/server/src/config/db.ts` | Admin password bị in ra stdout/logs |
| Thêm ENCRYPTION_KEY vào env.example | `apps/external/landing/server/.env.example` | Key là REQUIRED, không có default |
| Thêm rotation warning | `apps/external/anonymous-voice/server/env.example` | Cảnh báo rotate credentials Atlas |

### ⚠️ Action Thủ Công Còn Lại

**Bắt buộc:** Rotate credentials `crmAdmin` trên MongoDB Atlas cluster `cluster0.a4iwm.mongodb.net`
Credentials đã xuất hiện trong git history của file `anonymous-voice/server/src/server.ts` (dù đã bị comment và xóa).
Cách rotate: Atlas UI → Database Access → Edit user `crmAdmin` → Edit Password.
