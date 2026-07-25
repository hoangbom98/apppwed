# LKVIP GROUP — Multi-Service Entertainment Platform

Nền tảng giải trí đa dịch vụ gồm Hub, Game, Trading, Dating, Sports và Admin Dashboard, triển khai dạng pnpm monorepo với 6 frontend SPA, 1 backend API, 1 mobile wrapper và 6 MySQL schemas.

## Cấu trúc nhanh

```text
/var/LKVIP/
├── apps/
│   ├── backend/              # API server: Node.js + Express + Prisma
│   ├── hub/                  # @lkvip/hub
│   ├── game/                 # @lkvip/game
│   ├── trading/              # @lkvip/trade
│   ├── dating/               # @lkvip/dating
│   ├── sports/               # @lkvip/sports
│   ├── admin-dashboard/      # @lkvip/admin
│   └── mobile/               # @lkvip/mobile
├── packages/
│   ├── ui/                   # @lkvip/ui
│   ├── types/                # @lkvip/types
│   ├── utils/                # @lkvip/utils
│   └── constants/            # @lkvip/constants
├── config/                   # Nginx, DB, monitoring, env templates
├── docs/                     # Tài liệu kỹ thuật
├── scripts/                  # DevOps/CLI scripts
├── data/                     # Runtime data
└── logs/                     # PM2/backend logs
```

Lưu ý: thư mục là `apps/trading`, package/filter là `@lkvip/trade`.

## Stack chính

- Node.js >=20, pnpm >=9, TypeScript ~6.0.2.
- React ^19.2.7, Vite ^8.1.1, Tailwind CSS ^4.3.3, Ant Design ^6.5.1.
- Zustand, TanStack React Query, Yup frontend, Joi backend.
- Express, Prisma, MySQL 8, Redis, BullMQ, Socket.IO.
- Lucide React ưu tiên cho icon mới; `@ant-design/icons` vẫn tồn tại trong app/admin.

## Bắt đầu nhanh

```bash
pnpm install

pnpm prisma:generate
pnpm --filter lkvip-backend run prisma:migrate:all
pnpm --filter lkvip-backend run seed:all

pnpm dev:backend
pnpm dev:hub
pnpm dev:admin
```

Backend local: `http://localhost:5000`; Swagger: `http://localhost:5000/api/docs`; health: `http://localhost:5000/health`.

## Scripts gốc

| Script | Mô tả |
|--------|-------|
| `pnpm dev:backend` | Chạy backend dev server |
| `pnpm dev:hub` / `dev:game` / `dev:dating` / `dev:trade` / `dev:sports` / `dev:admin` | Chạy từng SPA |
| `pnpm dev:frontend` | Chạy toàn bộ frontend |
| `pnpm build:packages` | Build packages dùng chung |
| `pnpm build:frontends` | Build 6 SPA |
| `pnpm build:all` | Build packages + frontends |
| `pnpm lint:all` | Lint toàn bộ workspace |
| `pnpm typecheck:all` | Typecheck toàn bộ workspace |
| `pnpm test` | Chạy backend tests |

## Databases

| Project | DB/schema | Env var |
|---------|-----------|---------|
| hub | `hub_db` | `HUB_DATABASE_URL` |
| game | `game_db` | `GAME_DATABASE_URL` |
| trade | `trade_db` | `TRADE_DATABASE_URL` |
| dating | `dating_db` | `DATING_DATABASE_URL` |
| sports | `sports_db` | `SPORTS_DATABASE_URL` |
| admin | `admin_db` | `ADMIN_DATABASE_URL` |

Schema: `apps/backend/prisma/<project>/schema.prisma`.

## Public deploy hiện tại

- Public: `tc-gaming.live`, `hub.tc-gaming.live`, `trade.tc-gaming.live`, `sports.tc-gaming.live`, `admin.tc-gaming.live`, `api.tc-gaming.live`.
- `game` và `dating` có build output nhưng chưa public DNS/Nginx trong cấu hình hiện tại.
- Health deploy hợp lệ khi `/health` trả JSON `status: "healthy"`.

## Tài liệu chính

| File | Nội dung |
|------|----------|
| [`docs/ONBOARDING.md`](docs/ONBOARDING.md) | Hướng dẫn làm quen cho người mới |
| [`docs/SETUP.md`](docs/SETUP.md) | Setup local/dev |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Kiến trúc hệ thống |
| [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md) | API canonical |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deploy canonical |
| [`docs/CODEBASE_SCAN.md`](docs/CODEBASE_SCAN.md) | Scan trùng lặp/tối ưu codebase |
| [`docs/MIGRATION_GUIDE.md`](docs/MIGRATION_GUIDE.md) | Prisma migrations |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md) | Runbook vận hành |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Quy trình đóng góp |

## Quy tắc an toàn

- Không commit `.env`, credential, API key, private secret.
- Không in giá trị secret khi audit; chỉ nêu tên biến hoặc độ dài.
- Không thêm thư viện mới nếu dependency hiện có giải quyết được.
- Không đổi DB schema/migration nếu chưa review.
- Khi đổi app/package/script/API/deploy, cập nhật tài liệu liên quan cùng PR.
