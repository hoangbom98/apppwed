# Contributing to LKVIP Platform

Quy trình đóng góp cho monorepo LKVIP. Đọc `docs/ONBOARDING.md` và `docs/SETUP.md` trước khi bắt đầu.

## `apps/external/` — Projects tham khảo

Thư mục `apps/external/` chứa các project độc lập **không phải** phần của LKVIP platform.

**Quy tắc bắt buộc:**
- ❌ Không import code từ `apps/external/` vào bất kỳ LKVIP app hoặc package nào.
- ❌ Không thêm bất kỳ `apps/external/*` entry nào vào `pnpm-workspace.yaml`.
- ✅ Chỉ đọc để tham khảo kiến trúc và patterns.

---

## Môi trường phát triển

```bash
git clone <repo-url> /var/LKVIP
cd /var/LKVIP
pnpm install

cp apps/backend/.env.example apps/backend/.env
# Điền env local; không commit hoặc paste secret thật.

pnpm prisma:generate
pnpm prisma:migrate:all
pnpm --filter lkvip-backend run seed:all

pnpm dev:backend
pnpm dev:admin
```

---

## Branch và PR

| Tiền tố | Dùng cho | Ví dụ |
|---------|----------|-------|
| `feature/` | Tính năng mới | `feature/theme-live-preview` |
| `fix/` | Sửa lỗi | `fix/auth-token-expiry` |
| `docs/` | Tài liệu | `docs/onboarding-standardization` |
| `chore/` | CI/build/dependency | `chore/update-prisma` |
| `refactor/` | Refactor không đổi behavior | `refactor/shared-formatters` |
| `perf/` | Hiệu năng | `perf/reduce-bundle-size` |

`main` là branch deploy production. Không push trực tiếp vào `main`; mở PR và chờ CI/review.

---

## Commit

Dùng Conventional Commits:

```text
<type>(<scope>): <mô tả ngắn>
```

Ví dụ:

```text
feat(admin): thêm live preview cấu hình giao diện
fix(dating): thay icon không tồn tại
docs: chuẩn hóa onboarding LKVIP
chore(deps): update prisma to 5.16
```

---

## Code style

### Frontend SPAs (hub, game, trading, dating, sports, admin, banking, invest, store, academy)

- **Framework**: React 19 + TypeScript strict.
- **Styling**: Tailwind CSS v4 cho tất cả SPAs. Ant Design v6 chỉ dùng ở `admin-dashboard`.
- **Icons**: `lucide-react` — KHÔNG dùng `@iconify/react`, không dùng icon inline SVG.
- **State management**: Zustand (global) + TanStack Query (server state).
- **Routing**: React Router DOM v7.
- **Forms**: React Hook Form + **Yup** validation. **KHÔNG dùng Zod** trong SPA.
- **Lint**: **OXLint** (`oxlint src --config ../../oxlint.config.json`) — KHÔNG dùng ESLint cho SPAs.
- **Shared code**: import từ `@lkvip/ui`, `@lkvip/types`, `@lkvip/utils`, `@lkvip/constants`.

### Portal (apps/lkvipgroup-portal)

- **Framework**: Next.js 15 + TypeScript.
- Portal là standalone app — có Prisma/pg riêng, không dùng shared packages.
- Lint: `next lint` (ESLint).
- Zod được dùng ở portal (Next.js server-side validation).

### Backend (apps/backend)

- **Framework**: Express.js + TypeScript (CommonJS).
- **Prisma**: mỗi project có schema riêng (`prisma/<project>/schema.prisma`).
- **Validation**: **Joi** cho request body/query. **KHÔNG dùng Zod** trong backend.
- **Response**: wrap tất cả responses trong `ApiResponse` envelope `{ success, data, message }`.
- **Middleware thứ tự**: `authenticate` → `projectAccessGuard` → `rateLimiter`.
- **Business logic**: KHÔNG đặt trong controller — chỉ ở service layer.
- **Lint**: ESLint flat config (`ESLINT_USE_FLAT_CONFIG=true`).
- **Workers**: Long-running jobs → BullMQ queue, KHÔNG dùng `setTimeout`.

---

## Quy tắc tạo file

| Quy tắc | Mô tả |
|---------|-------|
| **F1** | Luôn sửa file hiện có trước khi tạo file mới. |
| **F2** | Tối đa 2 file mới mỗi feature. Nếu cần nhiều hơn, chia nhỏ feature. |
| **F3** | Mỗi module mới phải có `index.ts` export public surface. |
| **F4** | File naming: kebab-case (`wallet-service.ts`). Component/class: PascalCase. |
| **F5** | Kiểm tra file tương tự đã tồn tại trước khi tạo mới. |

---

## Thêm dependency mới

1. Kiểm tra xem `@lkvip/ui`, `@lkvip/utils`, hoặc package workspace có giải quyết được không.
2. Nếu dependency cần cho nhiều apps → thêm vào package workspace tương ứng.
3. Nếu dependency chỉ cho 1 app → thêm vào `devDependencies`/`dependencies` của app đó.
4. **Không thêm**: Vant UI, Zod (cho SPA/backend mới), `@iconify/react`, `crypto-js`, Video.js.

---

## Prisma & Database

- Mỗi project có schema riêng: `apps/backend/prisma/<project>/schema.prisma`.
- **KHÔNG trộn schema** giữa các project.
- Migration:
  ```bash
  npx prisma migrate dev --name <desc> --schema=prisma/<project>/schema.prisma
  ```
- Seeds phải idempotent — dùng `upsert`, không dùng bare `create`.
- Luôn thêm index cho: `userId`, `status`, `createdAt`, `orderId`, `referralCode`.
