# LKVIP GROUP — Multi-Service Entertainment Platform

Nền tảng giải trí đa dịch vụ gồm Hub, Game, Trading, Dating, Sports, Admin Dashboard và nhiều dịch vụ mở rộng, triển khai dạng **pnpm monorepo** với Turborepo, 10+ frontend SPA, 1 backend API, 1 mobile wrapper và 6 MySQL schemas.

## Cấu trúc nhanh

```text
/var/LKVIP/
├── apps/
│   ├── backend/              # lkvip-backend — API server (Express + Prisma + BullMQ)
│   ├── hub/                  # @lkvip/hub       — Hub portal (port 5173)
│   ├── game/                 # @lkvip/game      — Game SPA (port 5174)
│   ├── trading/              # @lkvip/trade     — Trading SPA (port 5175)
│   ├── dating/               # @lkvip/dating    — Dating SPA (port 5176)
│   ├── sports/               # @lkvip/sports    — Sports SPA (port 5177)
│   ├── admin-dashboard/      # @lkvip/admin     — Admin Dashboard (port 5180)
│   ├── academy/              # @lkvip/academy   — LMS frontend (port 5184)
│   ├── banking/              # @lkvip/banking   — Banking SPA (port 5181)
│   ├── invest/               # @lkvip/invest    — Investment SPA (port 5182)
│   ├── lkvip-store/          # @lkvip/store     — Store/Shop SPA (port 5185)
│   ├── lkvipgroup-portal/    # @lkvip/portal    — Group Portal Next.js (port 3010)
│   ├── mobile/               # @lkvip/mobile    — Capacitor wrapper
│   └── external/             # Projects tham khảo — KHÔNG phải LKVIP platform
├── packages/
│   ├── ui/                   # @lkvip/ui         — Shared React components + hooks + stores
│   ├── types/                # @lkvip/types      — Shared TypeScript interfaces
│   ├── utils/                # @lkvip/utils      — Shared utilities (date, crypto, format…)
│   ├── constants/            # @lkvip/constants  — Enums, banks, roles, error codes
│   ├── api-client/           # @lkvip/api-client — Axios auth client factory
│   ├── auth/                 # @lkvip/auth       — Shared auth hooks + TokenManager
│   ├── config/               # @lkvip/config     — Shared ESLint flat configs
│   └── paylock-sdk/          # @lkvip/paylock-sdk — License verification SDK
├── config/
│   ├── nginx/                # Nginx server blocks
│   ├── pm2/                  # ecosystem.config.js
│   ├── mysql/                # MySQL config
│   ├── redis/                # Redis config
│   ├── vercel/               # Vercel setup guide
│   └── monitoring/           # Prometheus + Grafana
├── docs/                     # Technical documentation
├── scripts/                  # DevOps/CLI scripts (deploy, vps-setup, backup…)
├── data/                     # Runtime data (uploads, logs — gitignored)
└── tests/                    # Integration/E2E tests
```

> **Lưu ý:** thư mục là `apps/trading`, nhưng package name và filter là `@lkvip/trade`.

## Stack chính

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | ≥ 20 LTS |
| Language | TypeScript | ~6.0.2 (strict) |
| Backend | Express.js + Prisma | ^4.22 / ^5.15 |
| Database | MySQL 8 | 6 schemas |
| Cache / Queue | Redis 7 + BullMQ | 14 workers |
| Real-time | Socket.IO | ^4.8 |
| Frontend | React + Vite | ^19.2 / ^8.1 |
| Styling | Tailwind CSS v4 | ^4.3 |
| Admin UI | Ant Design | ^6.5 |
| Icons | Lucide React | ^0.525 |
| State | Zustand + TanStack Query | — |
| Forms | React Hook Form + Yup | — |
| Mobile | Capacitor v7 | — |
| Frontend lint | **OXLint** | ^1.71 |
| Backend lint | ESLint (flat config) | ^8 |
| Process manager | PM2 | cluster, `lkvip-api` |

## Bắt đầu nhanh

```bash
# Cài đặt tất cả dependencies
pnpm install

# Generate Prisma clients và migrate databases
pnpm prisma:generate
pnpm prisma:migrate:all

# Seed dữ liệu (lần đầu)
pnpm --filter lkvip-backend run seed:all

# Khởi động dev servers
pnpm dev:backend       # http://localhost:5000
pnpm dev:hub           # http://localhost:5173
pnpm dev:admin         # http://localhost:5180
```

Backend local: `http://localhost:5000`  
Swagger API docs: `http://localhost:5000/api/docs`  
Health check: `http://localhost:5000/health`

## Scripts gốc

| Script | Mô tả |
|--------|-------|
| `pnpm dev:backend` | Chạy backend dev server |
| `pnpm dev:hub` | Chạy Hub SPA |
| `pnpm dev:game` | Chạy Game SPA |
| `pnpm dev:trade` | Chạy Trading SPA |
| `pnpm dev:dating` | Chạy Dating SPA |
| `pnpm dev:sports` | Chạy Sports SPA |
| `pnpm dev:admin` | Chạy Admin Dashboard |
| `pnpm dev:banking` | Chạy Banking SPA |
| `pnpm dev:invest` | Chạy Investment SPA |
| `pnpm dev:store` | Chạy Store SPA |
| `pnpm dev:academy` | Chạy Academy SPA |
| `pnpm dev:portal` | Chạy Group Portal (Next.js) |
| `pnpm dev:frontend` | Chạy 6 SPA cốt lõi song song |
| `pnpm build:packages` | Build shared packages |
| `pnpm build:frontends` | Build tất cả frontend SPAs |
| `pnpm build:all` | Build packages + frontends |
| `pnpm lint:all` | Lint toàn bộ workspace (Turbo) |
| `pnpm typecheck:all` | Typecheck toàn bộ workspace |
| `pnpm test` | Chạy backend tests (Vitest) |
| `pnpm prisma:generate` | Generate tất cả Prisma clients |
| `pnpm prisma:migrate:all` | Migrate tất cả databases |
| `pnpm prisma:deploy` | Deploy migrations (production) |

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
Mỗi project có schema riêng biệt — **không trộn lẫn schema**.

## Public deploy

- Production: `tc-gaming.live`, `hub.tc-gaming.live`, `trade.tc-gaming.live`, `sports.tc-gaming.live`, `admin.tc-gaming.live`, `api.tc-gaming.live`
- Portal: `lkvip.tc-gaming.live` (Next.js standalone, PM2 process `lkvip-portal`)
- Health check hợp lệ khi `/health` trả JSON `status: "healthy"`

## Tài liệu chính

| File | Nội dung |
|------|----------|
| [`docs/ONBOARDING.md`](docs/ONBOARDING.md) | Hướng dẫn làm quen cho người mới |
| [`docs/SETUP.md`](docs/SETUP.md) | Setup local/dev environment |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Kiến trúc hệ thống chi tiết |
| [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md) | API contract |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Hướng dẫn deploy VPS |
| [`docs/CODEBASE_SCAN.md`](docs/CODEBASE_SCAN.md) | Codebase health scan |
| [`docs/MIGRATION_GUIDE.md`](docs/MIGRATION_GUIDE.md) | Prisma migration guide |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md) | Runbook vận hành |
| [`config/vercel/SETUP.md`](config/vercel/SETUP.md) | Vercel frontend deployment |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Quy trình đóng góp |

## Quy tắc an toàn

- ❌ Không commit `.env`, credential, API key, private secret
- ❌ Không in giá trị secret; chỉ nêu tên biến hoặc độ dài
- ❌ Không thêm thư viện mới nếu dependency hiện có giải quyết được
- ❌ Không đổi DB schema/migration nếu chưa review
- ✅ Khi đổi app/package/script/API/deploy, cập nhật tài liệu liên quan cùng PR
