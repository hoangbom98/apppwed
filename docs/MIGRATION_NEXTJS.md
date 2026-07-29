# LKVIP Platform — Next.js Migration & Standardization Plan

## Top-Level Overview

**Goal:** Thực hiện song song hai việc:
1. **Phase 1 — Standardize** toàn bộ monorepo (`turbo.json`, `vercel.json` x4, GitHub Actions) — không thay đổi framework, an toàn, không breaking.
2. **Phase 2 — Migrate 3 apps sang Next.js 15** (`academy`, `invest`, `lkvip-store`) — apps không có Capacitor, ít routes, cần SEO.

**Scope rõ ràng:**
- `hub`, `game`, `dating`, `trading` → **KHÔNG migrate** (có Capacitor native mobile — sẽ break iOS/Android build)
- `admin-dashboard`, `banking`, `sports` → Phase 1 only
- `lkvipgroup-portal` → đã là Next.js, không chạm

**Key constraints:**
- Next.js apps mới dùng **App Router** (Next.js 15)
- `@lkvip/ui` giữ source-direct — thêm `transpilePackages` trong next.config
- `react-router-dom` xóa khỏi 3 apps migrate
- `VITE_API_URL` → `NEXT_PUBLIC_API_URL`
- API proxy: Next.js `rewrites` → `http://localhost:5000`

---

## Sub-Task 1 — Chuẩn hóa turbo.json

**Status:** `[ ] pending`

**Intent:** Thêm `NEXT_PUBLIC_*` env vars vào turbo.json để Turborepo cache invalidate đúng cho Next.js apps. Không xóa `VITE_*` vars (vẫn cần cho 7 Vite apps).

**Expected Outcomes:**
- `tasks.build.env` và `globalEnv` có thêm: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Todo List:**
1. Mở `turbo.json`
2. Thêm 5 biến `NEXT_PUBLIC_*` vào `tasks.build.env` array
3. Thêm 5 biến đó vào `globalEnv` array

**Relevant Context:**
- `turbo.json` — hiện có `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_VERSION`, `VITE_SENTRY_DSN`, `CAPACITOR_BUILD`

---

## Sub-Task 2 — Thêm vercel.json cho 4 Vite apps còn thiếu

**Status:** `[ ] pending`

**Intent:** `banking`, `invest`, `lkvip-store`, `academy` chưa có `vercel.json` nên không thể deploy lên Vercel qua GitHub Actions.

**Package names từ package.json:**
- `apps/banking` → `@lkvip/banking`
- `apps/invest` → `@lkvip/invest`
- `apps/lkvip-store` → `@lkvip/store`
- `apps/academy` → `@lkvip/academy`

**Expected Outcomes:** 4 files mới với Vite pattern (SPA rewrite `/(.*) → /index.html`, security headers, PWA headers)

**Todo List:**
1. Tạo `apps/banking/vercel.json` — `--filter=@lkvip/banking`
2. Tạo `apps/invest/vercel.json` — `--filter=@lkvip/invest`
3. Tạo `apps/lkvip-store/vercel.json` — `--filter=@lkvip/store`
4. Tạo `apps/academy/vercel.json` — `--filter=@lkvip/academy` (tạm Vite, thay ở Sub-Task 8)

**Pattern mẫu:** `apps/hub/vercel.json` (framework vite, installCommand pnpm, buildCommand turbo, outputDirectory dist)

---

## Sub-Task 3 — Cập nhật GitHub Actions deploy workflow

**Status:** `[ ] pending`

**Intent:** Thêm 4 jobs deploy mới vào `.github/workflows/deploy-vercel.yml`.

**Secrets cần thêm vào GitHub repo → Settings → Secrets → Actions:**
- `VERCEL_PROJECT_ID_BANKING`
- `VERCEL_PROJECT_ID_INVEST`
- `VERCEL_PROJECT_ID_STORE`
- `VERCEL_PROJECT_ID_ACADEMY`

**Expected Outcomes:** 4 jobs deploy, 4 paths filter, `notify` job updated, `workflow_dispatch` options updated

**Todo List:**
1. Thêm 4 secret comments vào header
2. Thêm 4 entries vào `on.push.paths`
3. Thêm 4 options vào `workflow_dispatch.inputs.app.options`
4. Thêm 4 outputs vào `changes` job
5. Thêm 4 entries vào `dorny/paths-filter`
6. Tạo 4 deploy jobs (`deploy-banking`, `deploy-invest`, `deploy-store`, `deploy-academy`) — Vite pattern như `deploy-hub`
7. Cập nhật `notify` job: thêm `needs` + summary rows

**Relevant Context:**
- `.github/workflows/deploy-vercel.yml` — template từ job `deploy-hub`

---

## Sub-Task 7 — Chuẩn hóa `@lkvip/ui` cho Next.js compat

**Status:** `[ ] pending`

**Intent:** Thêm `"use client"` directive vào browser-only components của `@lkvip/ui` để Next.js Server Components không crash khi import package.

**Expected Outcomes:**
- `packages/ui/src/pwa/install.tsx`: `"use client"` ở dòng 1
- `packages/ui/src/pwa/update.tsx`: `"use client"` ở dòng 1 (nếu dùng hooks/browser APIs)
- `packages/ui/package.json`: `"sideEffects": false`

**Todo List:**
1. Đọc `packages/ui/src/pwa/install.tsx` — thêm `"use client"` trước `@ts-nocheck`
2. Đọc `packages/ui/src/pwa/update.tsx` — thêm `"use client"` nếu dùng useState/useEffect
3. Thêm `"sideEffects": false` vào `packages/ui/package.json`

**Relevant Context:**
- `packages/ui/src/pwa/install.tsx` — dùng `window.addEventListener` (browser-only)
- Không có `import.meta.env` trong packages/ui (verified clean — không cần thay đổi thêm)

---

## Sub-Task 4 — Migrate `academy` → Next.js 15 App Router

**Status:** `[ ] pending`

**Intent:** Academy (5 routes, không Capacitor, không custom SW) là app đơn giản nhất. Validate migration pattern trước khi làm `invest` và `store`.

**Route mapping:**
| React Router | Next.js App Router | Note |
|---|---|---|
| `/login` | `app/login/page.tsx` | public |
| `/` (index, Guard protected) | `app/page.tsx` | redirect → /courses |
| `/courses` | `app/courses/page.tsx` | protected |
| `/courses/:slug` | `app/courses/[slug]/page.tsx` | protected |
| `/my` | `app/my/page.tsx` | protected |

**Expected Outcomes:**
- `app/` directory đầy đủ: `layout.tsx`, `page.tsx`, `login/page.tsx`, `courses/page.tsx`, `courses/[slug]/page.tsx`, `my/page.tsx`
- `next.config.ts` với `transpilePackages: ['@lkvip/ui', '@lkvip/types', '@lkvip/utils', '@lkvip/constants']` và `rewrites` `/api/:path* → ${NEXT_PUBLIC_API_URL}/api/:path*`
- `tsconfig.json` chuẩn Next.js: `plugins: [{ name: 'next' }]`, xóa `virtual:pwa-register` path
- `middleware.ts` bảo vệ tất cả routes trừ `/login`
- Components từ `src/` reuse nguyên vẹn — chỉ wrap trong `"use client"` page files
- **Xóa:** `vite.config.ts`, `src/App.tsx`, `src/main.tsx`, `index.html`, `src/vite-env.d.ts`, `tsconfig.node.json`
- **package.json:** thêm `next@^15.3.0`, xóa `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-plugin-pwa`, `react-router-dom`

**Todo List:**
1. Đọc `apps/academy/src/pages/LoginPage.tsx`, `CoursesPage.tsx`, `CourseDetailPage.tsx`, `MyCoursesPage.tsx`
2. Cập nhật `apps/academy/package.json`
3. Tạo `apps/academy/next.config.ts`
4. Cập nhật `apps/academy/tsconfig.json`
5. Tạo `apps/academy/app/globals.css` (copy từ `src/index.css`, giữ CSS vars `--ac-*`, thêm Tailwind v4 directives)
6. Tạo `apps/academy/app/layout.tsx` (`"use client"` providers: QueryClientProvider, Toaster)
7. Tạo `apps/academy/app/page.tsx` (redirect → `/courses`)
8. Tạo `apps/academy/app/login/page.tsx` (`"use client"` + render LoginPage)
9. Tạo `apps/academy/app/courses/page.tsx` (`"use client"` + render CoursesPage)
10. Tạo `apps/academy/app/courses/[slug]/page.tsx` (`"use client"` + render CourseDetailPage)
11. Tạo `apps/academy/app/my/page.tsx` (`"use client"` + render MyCoursesPage)
12. Tạo `apps/academy/middleware.ts` (bảo vệ tất cả trừ `/login`)
13. Xóa Vite artifacts (6 files)

**Relevant Context:**
- `apps/academy/src/App.tsx`, `apps/academy/src/layouts/AcademyLayout.tsx`
- CSS vars: `--ac-bg`, `--ac-primary`, `--ac-border`
- Tham khảo: `apps/lkvipgroup-portal/next.config.ts`, `apps/lkvipgroup-portal/middleware.ts`
- `useAuthStore` từ `../store/authStore` — giữ nguyên file, dùng trong `"use client"` wrappers

---

## Sub-Task 5 — Migrate `invest` → Next.js 15 App Router

**Status:** `[ ] pending`

**Intent:** Invest (6 routes, không Capacitor) — pattern tương tự academy. Làm song song với Sub-Task 4.

**Route mapping:**
| React Router | Next.js App Router |
|---|---|
| `/login` | `app/login/page.tsx` |
| `/register` | `app/register/page.tsx` |
| `/` (index, Guard protected) | `app/page.tsx` |
| `/packages` | `app/packages/page.tsx` |
| `/packages/:id` | `app/packages/[id]/page.tsx` |
| `/portfolio` | `app/portfolio/page.tsx` |

**Expected Outcomes:** Tương tự Sub-Task 4, Vite artifacts xóa.

**Todo List:**
1. Đọc `apps/invest/src/pages/` (Home, Packages, PackageDetail, Portfolio, Login, Register)
2. Cập nhật `apps/invest/package.json`
3. Tạo `apps/invest/next.config.ts`
4. Cập nhật `apps/invest/tsconfig.json`
5. Tạo `apps/invest/app/globals.css` (CSS vars `--inv-bg`, `--inv-primary`)
6. Tạo `apps/invest/app/layout.tsx`
7. Tạo `apps/invest/app/page.tsx`
8. Tạo `apps/invest/app/packages/page.tsx`, `app/packages/[id]/page.tsx`
9. Tạo `apps/invest/app/portfolio/page.tsx`
10. Tạo `apps/invest/app/login/page.tsx`, `app/register/page.tsx`
11. Tạo `apps/invest/middleware.ts`
12. Xóa Vite artifacts

**Relevant Context:**
- `apps/invest/src/App.tsx`, `apps/invest/src/layouts/InvestLayout.tsx`
- CSS vars: `--inv-bg`, `--inv-primary`

---

## Sub-Task 6 — Migrate `lkvip-store` → Next.js 15 App Router

**Status:** `[ ] pending`

**Intent:** Store là app SEO-critical — product pages cần `generateMetadata` và `generateStaticParams`. Phức tạp hơn academy/invest vì 2 layout groups và 11 routes.

**Route mapping với Render mode:**
| React Router | Next.js App Router | Render mode |
|---|---|---|
| `/` | `app/page.tsx` | SSG + generateMetadata |
| `/products` | `app/products/page.tsx` | SSG |
| `/products/:slug` | `app/products/[slug]/page.tsx` | SSG + generateStaticParams + generateMetadata |
| `/cart` | `app/cart/page.tsx` | CSR (`"use client"`) |
| `/checkout` | `app/checkout/page.tsx` | CSR |
| `/login` | `app/(auth)/login/page.tsx` | CSR |
| `/register` | `app/(auth)/register/page.tsx` | CSR |
| `/customer` | `app/customer/page.tsx` | CSR protected |
| `/customer/orders` | `app/customer/orders/page.tsx` | CSR protected |
| `/customer/api-keys` | `app/customer/api-keys/page.tsx` | CSR protected |
| `/customer/subscriptions` | `app/customer/subscriptions/page.tsx` | CSR protected |

**Expected Outcomes:**
- Public pages có `<head>` SEO đầy đủ (title, description, OG)
- `app/customer/layout.tsx` xử lý auth guard cho `/customer/*`
- `src/sw.ts` Vite injectManifest xóa
- `generateStaticParams` cho `/products/[slug]`

**Todo List:**
1. Đọc `apps/lkvip-store/src/pages/` và `apps/lkvip-store/src/hooks/useStore.ts`
2. Cập nhật `apps/lkvip-store/package.json`
3. Tạo `apps/lkvip-store/next.config.ts` (rewrites `/api/*` và `/uploads/*`)
4. Cập nhật `apps/lkvip-store/tsconfig.json`
5. Tạo `apps/lkvip-store/app/globals.css`
6. Tạo `apps/lkvip-store/app/layout.tsx` (public layout providers)
7. Tạo `apps/lkvip-store/app/page.tsx` với `generateMetadata`
8. Tạo `apps/lkvip-store/app/products/page.tsx`
9. Tạo `apps/lkvip-store/app/products/[slug]/page.tsx` với `generateStaticParams` + `generateMetadata`
10. Tạo `apps/lkvip-store/app/cart/page.tsx`, `app/checkout/page.tsx` (CSR)
11. Tạo `apps/lkvip-store/app/(auth)/login/page.tsx`, `register/page.tsx`
12. Tạo `apps/lkvip-store/app/customer/layout.tsx` (auth guard)
13. Tạo 4 customer pages
14. Tạo `apps/lkvip-store/middleware.ts` (bảo vệ `/customer/*`)
15. Xóa `src/sw.ts`, Vite artifacts

**Relevant Context:**
- `apps/lkvip-store/src/App.tsx`
- `useAuthStore`, `useCartStore` — đều `"use client"`
- `apps/lkvip-store/src/hooks/useStore.ts` — API hooks giữ nguyên, dùng trong CSR pages

---

## Sub-Task 8 — Cập nhật vercel.json + GitHub Actions cho 3 apps đã migrate

**Status:** `[ ] pending`

**Intent:** Sau khi Sub-Tasks 4/5/6 complete và verified, chuyển vercel.json và GitHub Actions jobs sang Next.js pattern.

**Expected Outcomes:**
- 3 vercel.json: `framework: nextjs`, `installCommand: npm install`, xóa `outputDirectory: dist`, xóa SPA `rewrites`
- 3 GitHub Actions jobs: `npm install` + `vercel deploy` trực tiếp (như `deploy-portal`)

**Todo List:**
1. Cập nhật `apps/academy/vercel.json` → Next.js pattern
2. Cập nhật `apps/invest/vercel.json` → Next.js pattern
3. Cập nhật `apps/lkvip-store/vercel.json` → Next.js pattern
4. Cập nhật 3 jobs trong `.github/workflows/deploy-vercel.yml` → npm install pattern

**Relevant Context:**
- Pattern: `apps/lkvipgroup-portal/vercel.json`
- GitHub Actions pattern: `deploy-portal` job trong `.github/workflows/deploy-vercel.yml`

---

## Execution Order

```
Sub-Task 1 + 2 + 7  ← song song, không phụ thuộc nhau
Sub-Task 3          ← sau Sub-Task 2
Sub-Task 4 + 5      ← song song, sau Sub-Task 7
Sub-Task 6          ← sau Sub-Task 4 và 5 verified
Sub-Task 8          ← sau Sub-Task 4, 5, 6 hoàn thành
```

## Files NOT touched

| App/Package | Lý do |
|---|---|
| `apps/hub`, `apps/game`, `apps/dating`, `apps/trading` | Có Capacitor — sẽ break iOS/Android |
| `apps/banking`, `apps/sports`, `apps/admin-dashboard` | Phase 1 only (vercel.json) |
| `apps/lkvipgroup-portal` | Đã là Next.js |
| `apps/backend` | Express API — không liên quan |
| `packages/types`, `packages/utils`, `packages/constants` | Pure TS — không cần thay đổi |
