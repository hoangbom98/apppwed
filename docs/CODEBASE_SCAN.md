# Báo Cáo Rà Soát Codebase LKVIP Platform

> **Cập nhật lần cuối:** 30/07/2026 (v4 — Cập nhật đầy đủ toàn bộ apps + packages + deploy pipeline)
> **Phạm vi:** 18 apps trong `apps/` + 13 packages trong `packages/`
> **Trạng thái TypeScript:** ✅ 0 lỗi — backend (`tsc --noEmit`) và portal (`tsc --noEmit`) đã xác nhận
> **Trạng thái tổng thể:** ✅ Phân tích hoàn tất — đồng bộ sau task 1–8 và cập nhật đầy đủ

---

## MỤC LỤC

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Phân Tích Chi Tiết Từng Ứng Dụng](#2-phân-tích-chi-tiết-từng-ứng-dụng)
3. [Phân Tích Shared Packages](#3-phân-tích-shared-packages)
4. [Đánh Giá Mức Độ Chuẩn Hóa](#4-đánh-giá-mức-độ-chuẩn-hóa)
5. [Các Điểm Yếu & Vấn Đề Phát Hiện](#5-các-điểm-yếu--vấn-đề-phát-hiện)
6. [Đề Xuất Chuẩn Hóa](#6-đề-xuất-chuẩn-hóa)
7. [Lộ Trình Refactor Theo Ưu Tiên](#7-lộ-trình-refactor-theo-ưu-tiên)
8. [Thay Đổi Sau Task 1–8](#8-thay-đổi-sau-task-18)
9. [Database Schema Summary](#9-database-schema-summary)
10. [Dependency Management](#10-dependency-management)
11. [Scripts Quan Trọng](#11-scripts-quan-trọng)
12. [Checklist Trạng Thái](#12-checklist-trạng-thái)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1 Cấu Trúc Monorepo

```
/var/LKVIP/
├── apps/                                  ← 18 ứng dụng
│   ├── academy/                           Next.js 15.5.20 — LMS khóa học (port 3013)
│   ├── admin-dashboard/                   Vite + React 19 — Admin UI (port 5180)
│   ├── backend/                           Express.js — API Hub (port 5000)
│   ├── banking/                           Vite + React — Ngân hàng số (port 5181)
│   ├── dating/                            Vite + React — Dating platform (port 5176)
│   ├── game/                              Vite + React — Game/Casino (port 5174)
│   ├── hub/                               Vite + React — Cổng chính (port 5173)
│   ├── invest/                            Next.js 15 standalone — Đầu tư (port 3011)
│   ├── landing/                           Static landing page
│   ├── lkvip-store/                       Next.js 15 standalone — Cửa hàng (port 3012)
│   ├── lkvipgroup-portal/                 Next.js 15.5.20 — Portal doanh nghiệp (port 3010)
│   ├── lkvipgroup-portal-vite/            Phiên bản Vite của portal (dự phòng)
│   ├── mobile/                            Capacitor 7 Wrapper → admin-dashboard
│   ├── mobile-native/                     Kotlin + Jetpack Compose (Android starter)
│   ├── mobile-native-enterprise/          Kotlin + Jetpack Compose (Android Enterprise)
│   ├── sports/                            Vite + React — Thể thao (port 5177)
│   ├── trading/                           Vite + React — Crypto/Chứng khoán (port 5175)
│   └── external/                          ISOLATED — xem docs/external/INVENTORY.md
│
├── packages/                              ← 13 shared packages
│   ├── ai-skills/                         @lkvip/ai-skills — AI health check & auto-fix
│   ├── api-client/                        @lkvip/api-client — Axios auth client factory
│   ├── auth/                              @lkvip/auth — Shared auth hooks + TokenManager
│   ├── config/                            @lkvip/config — ESLint flat configs chung
│   ├── constants/                         @lkvip/constants — PROJECT_IDs, enums, shared values
│   ├── mobile-core/                       @lkvip/mobile-core — Mobile core utilities
│   ├── paylock-sdk/                       @lkvip/paylock-sdk — License verification SDK
│   ├── scripts-utils/                     @lkvip/scripts-utils — CLI/build utilities
│   ├── shared/                            @lkvip/shared — Shared utilities
│   ├── tsconfig/                          @lkvip/tsconfig — Base tsconfig (frontend, node, nextjs)
│   ├── types/                             @lkvip/types — Shared TypeScript interfaces
│   ├── ui/                                @lkvip/ui — React components, hooks, PWA utils, auth stores
│   └── utils/                             @lkvip/utils — Shared utilities / helpers
│
├── docs/                                  ← Tài liệu kỹ thuật
│   ├── CODEBASE_SCAN.md                   ← File này
│   ├── DEPLOY_CHECKLIST.md
│   ├── DEPLOYMENT.md
│   ├── ECOSYSTEM.md
│   ├── INCIDENT_RESPONSE.md
│   ├── MIGRATION_GUIDE.md
│   ├── STANDARDIZATION.md
│   ├── architecture.md
│   ├── apps.md
│   └── packages.md
│
├── scripts/
│   ├── deploy.sh                          ← Entry point duy nhất cho mọi deployment
│   ├── vps-setup.sh                       ← First-time VPS setup
│   └── backup.sh                          ← Database backup
│
├── config/
│   ├── pm2/ecosystem.config.js            ← PM2 process manager config
│   ├── nginx/                             ← Nginx reverse proxy configs
│   ├── monitoring/                        ← Prometheus + Grafana
│   └── env/                               ← Environment variable templates
│
├── pnpm-workspace.yaml                    Workspace definition (external/ ISOLATED)
├── turbo.json                             Build orchestration
└── package.json                           Root (pnpm 9.0.0, Node ≥20)
```

### 1.2 Phân Loại Apps Theo Kiểu Kiến Trúc

| Nhóm | Apps | Đặc Điểm Chung | Trạng Thái |
|------|------|----------------|------------|
| **Frontend SPA — chuẩn** | dating, game, hub, sports, trading | Vite+React 19, Capacitor, dùng @lkvip/ui auth | ✅ Ổn định |
| **Frontend SPA — lệch chuẩn** | banking | Vite+React, tự implement auth store | ⚠️ Cần refactor |
| **Fullstack Next.js (standalone)** | academy, invest, lkvip-store, lkvipgroup-portal | Next.js App Router, output: standalone, PM2 managed | ✅ Đã chuẩn hóa |
| **Admin UI** | admin-dashboard | Vite+React+AntDesign, PWA, Workbox | ✅ Ổn định |
| **Backend API** | backend | Express.js, 6 MySQL DBs, Socket.IO, BullMQ | ✅ 0 lỗi TS |
| **Mobile Hybrid** | mobile | Capacitor 7 wrapper của admin-dashboard | ✅ Ổn định |
| **Mobile Native** | mobile-native, mobile-native-enterprise | Android Kotlin + Jetpack Compose | ✅ Ổn định |
| **External (Isolated)** | external/* | Không thuộc monorepo, không dùng @lkvip/ui | ⚠️ Isolated |

---

## 2. PHÂN TÍCH CHI TIẾT TỪNG ỨNG DỤNG

### 2.1 `backend` — Express.js Core API

| Thông số | Giá Trị |
|----------|---------|
| Framework | Express.js 4.22.2 |
| TypeScript | ~6.0.2 — **strict: false** (intentional legacy) |
| Databases | 6× MySQL 8 qua Prisma 5.15.0 (hub, game, trade, dating, sports, admin) |
| Cache | Redis 7+ (ioredis) |
| Job Queue | BullMQ 5.80.10 + Bull 4.16.5 (14 workers) |
| Real-time | Socket.IO 4.8.3 |
| Auth | JWT (2h access + 30d refresh) + Redis session binding |
| Validation | Joi 17.13.4 |
| Port | **5000** |
| PM2 Name | `lkvip-api` (cluster, max instances) |
| Deploy | VPS Ubuntu 22.04 — `api.tc-gaming.live` |
| **TypeScript** | **✅ 0 lỗi (`tsc --noEmit` clean)** |

**Kiến trúc modules:** `config` → `modules/{admin,auth,game,hub,trade,dating,sports,lkvip,store,workers}` → `shared` → `core` → `risk` → `third-parties`

**Điểm mạnh:** 44+ shared services (auth, session, wallet, payment, email, SMS, KYC, VIP engine, audit...), RBAC, AES-256-GCM request encryption, rate limiting với Redis, 15 risk detectors.

**Vấn đề còn tồn tại:**
- `strict: false` trong TypeScript (intentional — documented, KHÔNG đổi mà không có PR riêng)
- Không có Dockerfile (onboarding khó)
- Socket.IO chưa có `@socket.io/redis-adapter` — không scale horizontal
- 2 test runners: Jest + Vitest (hybrid không nhất quán)

---

### 2.2 `academy` — Next.js 15 LMS

| Thông số | Giá Trị |
|----------|---------|
| Framework | Next.js **15.5.20** + Turbopack |
| Package Name | `@lkvip/academy` |
| Output | `standalone` — port **3013** |
| Auth | Axios interceptors custom, lưu `hub_access_token` |
| PM2 Name | `lkvip-academy` |
| Deploy | Vercel (có `vercel.json`) |
| Shared | @lkvip/types, @lkvip/ui |
| **Dependency** | **✅ Tất cả deps đã được ghim phiên bản chính xác (18 entries)** |

---

### 2.3 `admin-dashboard` — Vite + React 19 Admin

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/admin` |
| Framework | React 19 + Vite |
| UI | Ant Design 6.5+ + Pro Components |
| Auth | localStorage `admin_token` + Cookie fallback, debounced refresh queue |
| Port | **5180** |
| PWA | vite-plugin-pwa + Workbox (offline, auto-update) |
| Linting | oxlint (Rust-based) + ESLint flat config |
| Deploy | Vercel — `admin.tc-gaming.live` |

---

### 2.4 `banking` — Vite + React Ngân Hàng Số

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/banking` |
| Framework | React 18 + Vite |
| Auth | **Custom auth store** (không dùng @lkvip/ui), project = `"trade"` |
| Port | **5181** |
| Deploy | Vercel |
| Capacitor | **Không có** |

**Vấn đề:** Auth store tự implement thay vì dùng @lkvip/ui. Không có Capacitor (inconsistent với dating/game/hub).

---

### 2.5 `dating` — Vite + React Dating Platform

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/dating` |
| Framework | React 18 + Vite |
| Auth | Shared từ @lkvip/ui ✅ |
| Real-time | Socket.IO (WebRTC + Chat + Live stream) |
| Capacitor | com.lkvip.dating (Camera, Geolocation, LocalNotifications) |
| Port | **5176** |
| API Modules | 17 modules |
| Shared | @lkvip/ui, @lkvip/types, @lkvip/config |
| Deploy | Vercel — `dating.tc-gaming.live` |

---

### 2.6 `game` — Vite + React Game/Casino

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/game` |
| Framework | React 18 + Vite |
| Auth | Shared từ @lkvip/ui ✅ |
| Real-time | Socket.IO (wallet updates, spin results) |
| Capacitor | com.lkvip.game |
| Port | **5174** |
| API Modules | **34 files** |
| Deploy | Vercel — `game.tc-gaming.live` |

**Vấn đề nghiêm trọng:**
- 34 API files với naming hỗn hợp: `apiViTien.ts`, `apiNganHang.ts`, `apiXacThuc.ts`
- Store: `storeDangNhap.ts` (tiếng Việt — không maintainable)
- Legacy endpoints song song: `walletLegacy.ts`, `bankLegacy.ts`

---

### 2.7 `hub` — Vite + React Cổng Chính

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/hub` |
| Framework | React 18 + Vite |
| Auth | Shared từ @lkvip/ui, OAuth-first ✅ |
| i18n | React-i18next (chỉ hub có) |
| Capacitor | com.lkvip.hub |
| Port | **5173** |
| Deploy | Vercel — `hub.tc-gaming.live` + `tc-gaming.live` |

---

### 2.8 `invest` — Next.js 15 Standalone Đầu Tư

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/invest` |
| Framework | Next.js **15.5.20** standalone |
| Auth | Custom auth store, project = `"trade"` |
| PM2 Name | `lkvip-invest` |
| Port | **3011** |
| Deploy | Vercel |

---

### 2.9 `landing` — Static Landing Page

| Thông số | Giá Trị |
|----------|---------|
| Framework | Static HTML/CSS/JS |
| Mục đích | Marketing landing page |
| Deploy | Static file serving |

---

### 2.10 `lkvip-store` — Next.js 15 Standalone Cửa Hàng

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/store` |
| Framework | Next.js **15.5.20** standalone |
| Auth | Custom auth store, project = `"hub"` |
| PWA | InjectManifest (custom SW tại src/sw.ts) |
| PM2 Name | `lkvip-store` |
| Port | **3012** |
| Deploy | Vercel |

---

### 2.11 `lkvipgroup-portal` — Next.js 15 Portal Doanh Nghiệp

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/portal` |
| Framework | Next.js **15.5.20** + App Router + Turbopack |
| Database | PostgreSQL (Supabase cloud) qua Prisma **6.19.3** |
| Auth | Cookie session (không phải JWT) |
| Storage | Cloudinary |
| Email | Nodemailer |
| PM2 Name | `lkvip-portal` |
| Port | **3010** |
| API Routes | 34 route handlers |
| Deploy | Vercel — `portal.tc-gaming.live` |
| **TypeScript** | **✅ 0 lỗi (`tsc --noEmit` clean)** |
| **Shared** | **KHÔNG DÙNG** @lkvip/ui, @lkvip/types ← cô lập hoàn toàn |

**Prisma models (PostgreSQL):** Admin, Blog, Enquiry, Page, Settings, Upload, WorkspaceSprint, WorkspaceTask, WorkspaceComment

---

### 2.12 `lkvipgroup-portal-vite` — Vite Version Portal (Dự phòng)

| Thông số | Giá Trị |
|----------|---------|
| Framework | Vite + React |
| Mục đích | Phiên bản Vite dự phòng của portal doanh nghiệp |
| Trạng thái | Dự phòng — portal chính là Next.js version |

---

### 2.13 `mobile` — Capacitor 7 Wrapper

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/mobile` |
| Type | Capacitor 7 wrapper cho admin-dashboard |
| App ID | com.lkvip.admin |
| Web Dir | `../admin-dashboard/dist` |
| Platform | iOS + Android |

---

### 2.14 `mobile-native` — Android Kotlin Starter

| Thông số | Giá Trị |
|----------|---------|
| Type | Native Android, Kotlin + Jetpack Compose |
| Architecture | MVVM + Repository + Hilt DI |
| Network | Retrofit2 + Moshi + OkHttp + auto-refresh Authenticator |
| Target SDK | 34 (Android 14) |
| Docs | ARCHITECTURE.md, API.md, CHANGELOG.md ✅ |

---

### 2.15 `mobile-native-enterprise` — Android Enterprise

| Thông số | Giá Trị |
|----------|---------|
| Type | Enterprise Android, Kotlin + Jetpack Compose |
| Architecture | MVVM + Clean Architecture + Repository |
| Database | Room 2.6+ (offline-first) |
| Preferences | Jetpack DataStore |
| Cloud | Firebase + Supabase + Cloudflare |
| AI | Google Gemini API |
| Features | Academy, Invest, Market, Banking, PayLock, Dashboard |

---

### 2.16 `sports` — Vite + React Thể Thao

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/sports` |
| Framework | React 18 + Vite |
| Auth | Shared từ @lkvip/ui ✅ |
| Real-time | Socket.IO (live scores, stream chat) |
| Video | hls.js 1.6.16 (HLS streaming) |
| Capacitor | Scripts có, `capacitor.config.ts` CHƯA CÓ |
| Port | **5177** |
| Deploy | Vercel — `sports.tc-gaming.live` |

---

### 2.17 `trading` — Vite + React Crypto/Chứng Khoán

| Thông số | Giá Trị |
|----------|---------|
| Package Name | `@lkvip/trade` |
| Framework | React 18 + Vite |
| Auth | Shared từ @lkvip/ui ✅ |
| Port | **5175** |
| Trạng thái | Giai đoạn xây dựng sớm |
| Deploy | Vercel — `trade.tc-gaming.live` |

---

### 2.18 `external/*` — Isolated Apps

| App | Framework | Database | Mục Đích | Trạng Thái |
|-----|-----------|----------|----------|------------|
| anonymous-voice | Next.js 15 + Node.js | MongoDB | Voice platform + WebRTC | reference-only |
| graph-ai | Next.js 15.1 + NestJS 11 | MongoDB | Web3 graph + AI | reference-only |
| landing | Vite + Express 5 | MongoDB | Bất động sản Dubai | reference-only |
| prodevs | CLI (TypeScript) | N/A | AI project scaffolder | reference-only |
| social | React Native 0.64 (Legacy) | AsyncStorage | Mạng xã hội | unsupported-toolchain |

> **Lưu ý:** Tất cả external apps KHÔNG kết nối vào LKVIP backend chính và KHÔNG dùng @lkvip/ui.

---

## 3. PHÂN TÍCH SHARED PACKAGES

### 3.1 Tổng Quan 13 Packages

| Package | Tên NPM | Mô Tả |
|---------|---------|-------|
| types | `@lkvip/types` | Shared TypeScript interfaces (common, api, portal, store) |
| constants | `@lkvip/constants` | Enums, currencies, roles, error codes, project IDs |
| utils | `@lkvip/utils` | Crypto, date, money (decimal.js), OTP, slugify |
| ui | `@lkvip/ui` | Shared React components, hooks, Zustand stores, PWA utils |
| api-client | `@lkvip/api-client` | Axios auth client factory với auto token-refresh |
| auth | `@lkvip/auth` | Shared auth hooks, TokenManager |
| config | `@lkvip/config` | Shared ESLint flat configs (browser + node) |
| tsconfig | `@lkvip/tsconfig` | Shared TypeScript config bases |
| paylock-sdk | `@lkvip/paylock-sdk` | License verification SDK (UMD/ESM/CJS) |
| ai-skills | `@lkvip/ai-skills` | AI-driven health-check & auto-fix tooling |
| scripts-utils | `@lkvip/scripts-utils` | Shared CLI/build utilities |
| mobile-core | `@lkvip/mobile-core` | Mobile core utilities |
| shared | `@lkvip/shared` | Shared general utilities |

### 3.2 Matrix Sử Dụng Packages

| Package | academy | admin | backend | banking | dating | game | hub | invest | store | sports | trading | portal |
|---------|:-------:|:-----:|:-------:|:-------:|:------:|:----:|:---:|:------:|:-----:|:------:|:-------:|:------:|
| @lkvip/ui | ✅ | ✅ | — | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ❌ |
| @lkvip/types | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| @lkvip/constants | — | — | ✅ | — | — | ✅ | — | — | — | ✅ | ✅ | — |
| @lkvip/auth | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| @lkvip/api-client | — | — | ✅ | — | — | — | — | — | — | — | — | — |
| @lkvip/config | — | ✅ | — | — | ✅ | — | — | — | — | — | — | — |
| @lkvip/utils | — | — | ✅ | — | — | — | — | — | — | — | — | — |

**Chú thích:** ✅ Dùng đầy đủ | ⚠️ Dùng nhưng không dùng auth store | ❌ Không dùng dù tồn tại | — Không áp dụng

### 3.3 Vấn Đề @lkvip/auth

Package `packages/auth/` **tồn tại nhưng KHÔNG app nào import**. Auth logic bị duplicate ít nhất 4 lần (banking, invest, lkvip-store, academy tự implement auth store gần giống nhau).

---

## 4. ĐÁNH GIÁ MỨC ĐỘ CHUẨN HÓA

### 4.1 Điểm Số Tổng Thể (30/07/2026)

| Tiêu Chí | Điểm (10) | Ghi Chú |
|----------|:---------:|---------|
| Build & Deploy Config | **8** | deploy.sh 8 bước hoàn chỉnh, PM2 coverage 5 apps |
| Environment Variables | 5 | Thiếu .env.example một số app |
| Xác thực & Phân quyền | 4 | 5+ cách implement khác nhau |
| Xử lý lỗi & Logging | 4 | Mỗi app xử lý riêng |
| API Communication | 5 | ~60% apps dùng shared client |
| Shared Components | 6 | @lkvip/ui tốt nhưng áp dụng không đồng đều |
| Code Conventions | 5 | TypeScript OK, naming mixed EN/VI trong game |
| Testing | 3 | Minimal, 2 test runners, không có E2E |
| Documentation | **8** | Tài liệu đã được cập nhật đồng bộ (30/07/2026) |
| Dependency Management | **9** | Academy đã ghim phiên bản, nguyên tắc áp dụng toàn monorepo |
| TypeScript Quality | **9** | 0 lỗi backend + portal, không còn @ts-nocheck |
| DB Layer (Portal) | **9** | Prisma async hoàn chỉnh, 3 model mới, 0 lỗi type |

### 4.2 So Sánh Auth Patterns

| App | Pattern | Token Key | Refresh |
|-----|---------|-----------|---------|
| dating, game, hub, sports, trading | Shared @lkvip/ui ✅ | `token` | Queue-based (safe) |
| admin-dashboard | Custom + Cookie fallback ✅ | `admin_token` | Debounced queue |
| banking | Custom, project="trade" ⚠️ | `trade_access_token` | Manual retry |
| invest | Custom, project="trade" ⚠️ | `trade_access_token` | Manual retry |
| lkvip-store | Custom, project="hub" ⚠️ | `hub_access_token` | Manual retry |
| academy | Inline client.ts ⚠️ | `hub_access_token` | Manual retry |
| lkvipgroup-portal | Cookie session ⚠️ | `admin_email` cookie | N/A |

---

## 5. CÁC ĐIỂM YẾU & VẤN ĐỀ PHÁT HIỆN

### 5.1 Critical (P0) — Còn Tồn Tại

| ID | Vấn Đề | App | Rủi Ro |
|----|--------|-----|--------|
| C1 | 34 API files trong game, naming tiếng Việt (`apiViTien.ts`, `storeDangNhap.ts`) | game | Không maintainable, onboarding khó |
| C2 | Auth store duplicate 4 lần, @lkvip/auth bỏ trống | banking, invest, store, academy | Bug fix không lan được |

### 5.2 Critical (P0) — Đã Giải Quyết

| ID | Vấn Đề | Giải Pháp | Status |
|----|--------|-----------|--------|
| C3 | vercel.json khai báo sai framework | Xóa vercel.json sai, chuyển về VPS deploy | ✅ Done |
| C4 | Wildcard deps `"*"` trong academy | Ghim 18 entries phiên bản chính xác | ✅ Done |
| C5 | deploy.sh thiếu standalone build + PM2 reload | Bổ sung 4c/4d/4e + PM2 idempotent | ✅ Done |
| C6 | TypeScript lỗi trong portal (27 lỗi) | Prisma generate + WorkspaceStats type | ✅ Done |
| C7 | @ts-nocheck trong workspace-db.ts | Xóa directive, fix bằng type đúng | ✅ Done |

### 5.3 Important (P1)

| ID | Vấn Đề | App | Rủi Ro |
|----|--------|-----|--------|
| I1 | Socket.IO không có Redis adapter — không scale horizontal | backend | Realtime disconnect khi scale |
| I2 | lkvipgroup-portal tách biệt khỏi @lkvip/ui, @lkvip/types | portal | Code duplication, UI inconsistency |
| I3 | external/social: React Native 0.64 (2021) legacy | social | Security vulnerabilities |
| I4 | i18n không nhất quán — hub có nhưng game naming VI trong code | hub, game | Khó expand thị trường |

### 5.4 Medium (P2)

| ID | Vấn Đề | App | Rủi Ro |
|----|--------|-----|--------|
| M1 | Capacitor scripts có nhưng `capacitor.config.ts` thiếu | sports | Mobile build fail |
| M2 | Testing coverage thấp, Jest+Vitest hybrid | backend | Regression khó phát hiện |
| M3 | Redis refresh token không có TTL rõ ràng | backend | Token tồn tại vĩnh viễn |
| M4 | Hai rate limiting libraries cùng lúc | backend | Double-counting, maintenance |
| M5 | Thiếu .env.example ở banking, sports, trading | 3 apps | Developer onboarding khó |

---

## 6. ĐỀ XUẤT CHUẨN HÓA

### 6.1 Củng Cố @lkvip/auth (Factory Pattern)

```typescript
// packages/auth/src/createAuthStore.ts
export function createAuthStore(config: { project: string }) {
  const TOKEN_KEY = `${config.project}_access_token`;
  return create<AuthState>()(persist((set, get) => ({
    // ... shared logic
  }), { name: `${config.project}-auth-store` }));
}
```

### 6.2 Chuẩn Hóa Tech Stack

| Mục | Hiện Tại | Đề Xuất |
|-----|----------|---------|
| TypeScript (backend) | ~6.0.2 (beta) | ~5.8.x (stable) |
| React (Vite apps) | 18 / 19 mixed | ^18.3.x thống nhất |
| Backend testing | Jest + Vitest | Consolidate về Vitest |
| Socket transport | Mixed | `['polling', 'websocket']` thống nhất |

---

## 7. LỘ TRÌNH REFACTOR THEO ƯU TIÊN

### Phase 1 — Đã Hoàn Thành

| Task | Status |
|------|--------|
| Fix wildcard deps trong academy | ✅ Done |
| Bổ sung standalone build + PM2 reload trong deploy.sh | ✅ Done |
| Sửa 27 lỗi TypeScript trong portal | ✅ Done |
| Tái tạo Prisma Client sau khi thêm model mới | ✅ Done |

### Phase 2 — Core Standardization (Ưu tiên tiếp theo)

| Task | Effort | Ghi Chú |
|------|--------|---------|
| Implement @lkvip/auth factory | 2 ngày | packages/auth/ |
| Migrate banking, invest, store, academy → @lkvip/auth | 4 ngày | 4 apps |
| Rename game API files VI → EN | 3 ngày | apps/game/src/api/ |
| Consolidate backend testing → Vitest | 2 ngày | apps/backend/ |
| Thêm capacitor.config.ts cho sports | nhanh | apps/sports/ |
| Thêm Redis TTL cho refresh tokens | nhanh | apps/backend/ |

### Phase 3 — Architecture Improvement

| Task | Effort |
|------|--------|
| Upgrade TypeScript backend → ~5.8.x stable | 2 tuần |
| Tích hợp lkvipgroup-portal vào @lkvip/ui | 2 tuần |
| Dockerfile + docker-compose cho backend | 1 tuần |

### Phase 4 — Long-term

| Task |
|------|
| E2E tests với Playwright (login, deposit, game play flows) |
| Type-safe API Client từ OpenAPI spec |
| Backend TypeScript strict: true (incremental, từng module) |
| Database backup/restore strategy — 6 MySQL DBs |

---

## 8. THAY ĐỔI SAU TASK 1–8

### 8.1 Tổng Hợp Thay Đổi

| Task | Mô Tả | Files Thay Đổi |
|------|-------|----------------|
| Task 1 | Tạo Prisma migration lock cho portal | `apps/lkvipgroup-portal/prisma/migrations/` |
| Task 2 | Viết lại `workspace-db.ts` theo kiến trúc async Prisma | `apps/lkvipgroup-portal/src/lib/workspace-db.ts` |
| Task 3 | Cập nhật 6 route handler với `await` cho Prisma async | `apps/lkvipgroup-portal/src/app/api/admin/workspace/*/route.ts` |
| Task 4 | Tạo Prisma migration và deploy schema | `apps/lkvipgroup-portal/prisma/schema.prisma` |
| **Task 5** | Ghim phiên bản 18 dependency trong academy | `apps/academy/package.json` |
| **Task 6** | Bổ sung standalone build 4c/4d/4e + PM2 idempotent reload | `scripts/deploy.sh` |
| **Task 7** | Sửa 27 lỗi TypeScript trong portal | `apps/lkvipgroup-portal/src/types/global.d.ts`, `tsconfig.json` |
| **Task 8** | Cập nhật tài liệu kỹ thuật đồng bộ | `docs/*.md` |

### 8.2 Workspace Prisma Models Mới (Portal)

```
WorkspaceSprint    ← Sprint quản lý dự án
WorkspaceTask      ← Task với priority, status, assignee, dueDate
WorkspaceComment   ← Comment trên task
```

---

## 9. DATABASE SCHEMA SUMMARY

### 9.1 Tổng Quan Database

| Database | Engine | ORM | Schema Path | Mục Đích |
|----------|--------|-----|-------------|----------|
| `admin_db` | MySQL 8 | Prisma 5.15 | `prisma/admin/schema.prisma` | Users, wallets, transactions, RBAC, VIP |
| `game_db` | MySQL 8 | Prisma 5.15 | `prisma/game/schema.prisma` | Game sessions, lottery, agents, rebate |
| `hub_db` | MySQL 8 | Prisma 5.15 | `prisma/hub/schema.prisma` | CMS, banners, notifications |
| `trade_db` | MySQL 8 | Prisma 5.15 | `prisma/trade/schema.prisma` | Investment packages, orders, price data |
| `dating_db` | MySQL 8 | Prisma 5.15 | `prisma/dating/schema.prisma` | Profiles, matches, messages |
| `sports_db` | MySQL 8 | Prisma 5.15 | `prisma/sports/schema.prisma` | Events, odds, bet slips |
| Portal DB | PostgreSQL | Prisma 6.19 | `apps/lkvipgroup-portal/prisma/schema.prisma` | Workspace, Blog, Admin portal |

### 9.2 Financial Data Standards (BẮT BUỘC)

| Concern | Standard | Lý Do |
|---------|----------|-------|
| Số tiền & số dư | `DECIMAL(19,4)` | Tránh lỗi làm tròn floating-point |
| Crypto/high-precision | `DECIMAL(19,8)` | trade_db Order/Position fields |
| Timestamps | `DateTime @default(now())` → `@db.Timestamp(6)` | Microsecond precision |
| Wallet Optimistic Lock | `version Int @default(0)` | Tránh race condition concurrent writes |
| Transaction Idempotency | `referenceId @unique` | Ngăn double-charge từ network retry |
| String enums | Import từ `@lkvip/constants` | Không dùng raw literals |

### 9.3 Prisma Client Factory

```typescript
// LUÔN dùng factory — không bao giờ new PrismaClient() trực tiếp
import { getPrismaClient } from '@/config/databases';
const prisma = getPrismaClient('admin'); // 'admin'|'game'|'hub'|'trade'|'dating'|'sports'
```

---

## 10. DEPENDENCY MANAGEMENT

### 10.1 Trạng Thái Theo Workspace

| Workspace | Trạng Thái | Ghi Chú |
|-----------|-----------|---------|
| `apps/academy` | ✅ Tất cả ghim chính xác | 18 entries, đồng bộ với portal |
| `apps/lkvipgroup-portal` | ✅ Đã ghim (^prefix với version cụ thể) | eslint-config-next = 15.5.20 |
| `apps/backend` | ✅ Hầu hết đã ghim | TypeScript ~6.0.2 (beta — cần upgrade) |
| `apps/invest` | ⚠️ Còn wildcard `"*"` | Cần xử lý phase tiếp theo |
| `apps/lkvip-store` | ⚠️ Còn wildcard `"*"` | Cần xử lý phase tiếp theo |

### 10.2 Root Package Manager Overrides

```json
// package.json root — kiểm soát versions toàn monorepo
"pnpm": {
  "overrides": {
    "typescript": "~6.0.2",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

---

## 11. SCRIPTS QUAN TRỌNG

### 11.1 Root-level Scripts

| Script | Mô Tả |
|--------|-------|
| `pnpm build` | Build toàn bộ monorepo qua Turbo |
| `pnpm build:packages` | Build riêng 4 shared packages (types, utils, constants, api-client) |
| `pnpm build:frontends` | Build 10 frontend SPAs |
| `pnpm dev` | Chạy dev mode tất cả |
| `pnpm dev:backend` | Dev backend riêng lẻ |
| `pnpm typecheck` | Kiểm tra TypeScript toàn monorepo |
| `pnpm lint` | Lint toàn monorepo qua Turbo |
| `pnpm prisma:generate` | Generate tất cả 6 Prisma clients |
| `pnpm prisma:migrate:all` | Migrate tất cả 6 MySQL schemas |
| `pnpm prisma:deploy` | Deploy migrations lên production |

### 11.2 Deploy Script (`scripts/deploy.sh`)

```
[1/8] git pull
[2/8] pnpm install --frozen-lockfile
[3/8] Build shared packages
[4/8] Build frontend SPAs
  [4b] portal  (Next.js standalone :3010)
  [4c] invest  (Next.js standalone :3011)
  [4d] store   (Next.js standalone :3012)
  [4e] academy (Next.js standalone :3013)
[5/8] Backend TypeScript build (tsc)
[6/8] Prisma deploy (6 MySQL + portal PostgreSQL)
[7/8] PM2 reload: lkvip-api, lkvip-portal, lkvip-invest, lkvip-store, lkvip-academy
[8/8] nginx -t && reload
```

---

## 12. CHECKLIST TRẠNG THÁI

### 12.1 Trạng Thái Tổng Thể

| Hạng Mục | Trạng Thái |
|----------|-----------|
| Backend TypeScript | ✅ 0 lỗi |
| Portal TypeScript | ✅ 0 lỗi |
| Deploy Script (8 bước) | ✅ Hoàn chỉnh |
| PM2 Coverage (5 apps) | ✅ Đầy đủ |
| Prisma Models Portal | ✅ 3 model mới: Sprint, Task, Comment |
| Academy Dependencies | ✅ 18 entries đã ghim |
| MongoDB Security Fix | ✅ Xóa credentials hardcode |
| @lkvip/auth implementation | ❌ Chưa có — auth duplicate 4 nơi |
| Game API naming VI→EN | ❌ Chưa làm — 34 files cần rename |
| Sports capacitor.config.ts | ❌ Thiếu file |
| E2E Testing | ❌ Chưa có |
| Dockerfile backend | ❌ Chưa có |

### 12.2 Port Map Tất Cả Apps

| App | Port | Subdomain |
|-----|------|-----------|
| Backend API | 5000 | api.tc-gaming.live |
| Hub | 5173 | hub.tc-gaming.live + tc-gaming.live |
| Game | 5174 | game.tc-gaming.live |
| Trading | 5175 | trade.tc-gaming.live |
| Dating | 5176 | dating.tc-gaming.live |
| Sports | 5177 | sports.tc-gaming.live |
| Admin Dashboard | 5180 | admin.tc-gaming.live |
| Banking | 5181 | Vercel |
| Invest | 3011 (PM2) / 5182 (dev) | Vercel |
| Academy | 3013 (PM2) / 5184 (dev) | Vercel |
| Store | 3012 (PM2) / 5185 (dev) | Vercel |
| Portal | 3010 | portal.tc-gaming.live |

---

*File này được tạo tự động dựa trên phân tích thực tế codebase tại `/var/LKVIP`. Cập nhật cuối: 30/07/2026.*
