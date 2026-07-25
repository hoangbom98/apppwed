# Hướng dẫn làm quen dự án LKVIP

Mục tiêu: giúp dev mới, PO, QC, khách hàng nắm nhanh cấu trúc, công nghệ, quy trình mà không hiểu sai repo.

## 1. Tổng quan

**LKVIP** là nền tảng giải trí đa dịch vụ gồm Game, Sports, Trading, Dating, Hub, Admin Dashboard; triển khai dưới dạng pnpm monorepo với 6 frontend SPA, 1 backend API, 1 Capacitor mobile wrapper, 6 MySQL schemas riêng và Redis cho cache/queue/realtime.

## 2. Cấu trúc thư mục chính

```text
/var/LKVIP/
├── apps/
│   ├── backend/              # API server: Node.js + Express + Prisma
│   ├── hub/                  # Hub portal — @lkvip/hub
│   ├── game/                 # Game center — @lkvip/game
│   ├── trading/              # Trading platform — @lkvip/trade
│   ├── dating/               # Dating app — @lkvip/dating
│   ├── sports/               # Sports live — @lkvip/sports
│   ├── admin-dashboard/      # Admin portal — @lkvip/admin
│   └── mobile/               # Capacitor wrapper — @lkvip/mobile
├── packages/
│   ├── ui/                   # @lkvip/ui: shared React UI/hooks
│   ├── types/                # @lkvip/types: shared TypeScript types
│   ├── utils/                # @lkvip/utils: shared helpers
│   └── constants/            # @lkvip/constants: shared constants
├── config/                   # Nginx, DB, monitoring, env templates
├── data/                     # Runtime data: uploads/cache
├── docs/                     # Tài liệu kỹ thuật
├── logs/                     # PM2/backend logs
├── scripts/                  # DevOps/CLI scripts
├── tests/                    # Integration/load tests
├── package.json              # Root scripts
├── pnpm-workspace.yaml       # Workspace + catalog versions
└── tsconfig.base.json        # Shared TypeScript config
```

Lưu ý tên: thư mục là `apps/trading`, package/filter là `@lkvip/trade`.

## 3. Công nghệ chuẩn hiện tại

| Tầng | Công nghệ | Ghi chú |
|------|-----------|---------|
| Runtime | Node.js >=20, pnpm >=9 | Chạy từ monorepo root |
| Ngôn ngữ | TypeScript ~6.0.2 | FE/BE/packages |
| Frontend | React ^19.2.7, Vite ^8.1.1 | 6 SPA |
| Styling | Tailwind CSS ^4.3.3, Ant Design ^6.5.1 | Admin/trade dùng Ant Design nhiều hơn |
| Icons | Lucide React + @ant-design/icons | Ưu tiên Lucide cho icon mới; Ant icons vẫn đang tồn tại |
| State/API | Zustand, TanStack React Query | Client/server state |
| Validation | Yup phía frontend, Joi phía backend | Không dùng Zod cho phần mới |
| Backend | Express, Prisma, MySQL 8 | 6 schema DB |
| Queue/cache | Redis, BullMQ | Background jobs/cache |
| Realtime | Socket.IO | Chat, notification, live events |
| Mobile | Capacitor 7 | Wrapper cho mobile |
| Lint/build | OXLint, ESLint backend, Turbo, Vite | Dùng scripts root |

## 4. Scripts thường dùng

```bash
pnpm install

# Development
pnpm dev:backend
pnpm dev:hub
pnpm dev:game
pnpm dev:admin
pnpm dev:dating
pnpm dev:trade
pnpm dev:sports
pnpm dev:frontend
pnpm dev:all

# Build
pnpm build:packages
pnpm build:frontends
pnpm build:all

# Check
pnpm lint:all
pnpm typecheck:all
pnpm test

# Prisma
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:status
```

Backend local: `http://localhost:5000`; Swagger: `http://localhost:5000/api/docs`; health: `http://localhost:5000/health`.

## 5. Cơ sở dữ liệu

| Project | DB/schema | Env var |
|---------|-----------|---------|
| hub | `hub_db` | `HUB_DATABASE_URL` |
| game | `game_db` | `GAME_DATABASE_URL` |
| trade | `trade_db` | `TRADE_DATABASE_URL` |
| dating | `dating_db` | `DATING_DATABASE_URL` |
| sports | `sports_db` | `SPORTS_DATABASE_URL` |
| admin | `admin_db` | `ADMIN_DATABASE_URL` |

Schema nằm trong `apps/backend/prisma/<project>/schema.prisma`. Không đổi schema/migration nếu chưa review.

## 6. Admin theme live preview

Admin chỉnh giao diện tại `/config/general`.

Luồng hiện tại:

1. Admin chọn project.
2. Form tải config qua `/admin/ui-config`.
3. Preview inline cập nhật theo state local trước khi lưu.
4. Bấm `Lưu cấu hình` mới ghi dữ liệu.
5. Public app đọc config qua `/api/shared/config?project=<project>&group=<group>`.

Endpoint public mẫu:

```text
/api/shared/config?project=hub&group=colors
/api/shared/config?project=hub&group=brand
```

Endpoint public chỉ trả config non-secret.

## 7. Public deploy hiện tại

Public Nginx/DNS đang dùng:

| Host | Vai trò |
|------|---------|
| `tc-gaming.live` | root hub |
| `hub.tc-gaming.live` | hub |
| `trade.tc-gaming.live` | trading |
| `sports.tc-gaming.live` | sports |
| `admin.tc-gaming.live` | admin dashboard |
| `api.tc-gaming.live` | backend API proxy |

`game` và `dating` có build output nhưng chưa public DNS/Nginx trong cấu hình hiện tại.

Deploy chuẩn kiểm tra backend bằng JSON `/health` với `status == healthy`, không chỉ HTTP 200.

## 8. Quy ước làm việc

- Thư mục: `kebab-case`.
- Component React: `PascalCase.tsx`.
- Logic/helper: `camelCase.ts`.
- Ưu tiên Tailwind classes; CSS riêng chỉ khi cần override.
- Không thêm thư viện mới nếu dependency hiện có giải quyết được.
- Không dùng Vant UI, Iconify, Zod cho phần mới.
- Không in secret `.env`; khi audit chỉ nêu tên biến hoặc độ dài.
- Không hardcode credential, API key, private URL.
- Khi đổi app/package/script/API/deploy, cập nhật tài liệu liên quan trong cùng PR.

## 9. Lộ trình làm quen

| Giai đoạn | Nội dung |
|-----------|----------|
| Ngày 1 | Đọc `README.md`, file này, chạy `pnpm install`, xem scripts root |
| Tuần 1 | Chạy backend + một SPA local, đọc `docs/SETUP.md` |
| Tuần 2 | Đọc `docs/ARCHITECTURE.md`, module wallet/config trong backend |
| Tuần 3 | Tìm hiểu Prisma schemas, Redis/BullMQ/Socket.IO |
| Tuần 4 | Làm bug/feature nhỏ, chạy lint/typecheck/build theo checklist |

## 10. Tài liệu liên quan

- `README.md` — landing page repo.
- `docs/SETUP.md` — setup local.
- `docs/ARCHITECTURE.md` — kiến trúc hệ thống.
- `docs/API_ENDPOINTS.md` — API canonical.
- `docs/DEPLOYMENT.md` — deploy canonical.
- `CONTRIBUTING.md` — quy trình đóng góp.
