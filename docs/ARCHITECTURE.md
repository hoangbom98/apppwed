# LKVIP Architecture Reference

> Stack hiện tại: Node.js 20 · Express · Prisma · MySQL 8 · Redis · BullMQ · Socket.IO · React 19 · Vite 8 · TypeScript 6 · Tailwind CSS 4 · Ant Design 6 · pnpm workspace.

## 1. System overview

```text
Internet HTTPS
    │
[Nginx]
    ├── tc-gaming.live              → apps/hub/dist
    ├── hub.tc-gaming.live          → apps/hub/dist
    ├── trade.tc-gaming.live        → apps/trading/dist
    ├── sports.tc-gaming.live       → apps/sports/dist
    ├── admin.tc-gaming.live        → apps/admin-dashboard/dist
    └── api.tc-gaming.live          → proxy 127.0.0.1:5000

[PM2: lkvip-api]
    │
[apps/backend: Express API + Socket.IO]
    ├── Redis: cache, queue, socket adapter
    └── MySQL 8: hub_db, game_db, trade_db, dating_db, sports_db, admin_db
```

`game` và `dating` có build output nhưng chưa có public DNS/Nginx trong cấu hình hiện tại.

## 2. Monorepo topology

```text
/var/LKVIP/
├── apps/
│   ├── backend/              # lkvip-backend
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
├── config/
├── docs/
├── scripts/
├── data/
└── logs/
```

Workspace được định nghĩa trong `pnpm-workspace.yaml`. Dùng root scripts trong `package.json`; không chạy `npm install` lẻ từng app.

## 3. Frontend architecture

Có 6 SPA độc lập:

| App | Path | Package | Dev port | Vai trò |
|-----|------|---------|----------|--------|
| Hub | `apps/hub` | `@lkvip/hub` | 5173 | Cổng tổng hợp |
| Game | `apps/game` | `@lkvip/game` | 5174 | Sảnh game |
| Dating | `apps/dating` | `@lkvip/dating` | 5176 | Hẹn hò/livestream/chat |
| Trading | `apps/trading` | `@lkvip/trade` | 5177 | Trading/wallet/KYC |
| Sports | `apps/sports` | `@lkvip/sports` | 5178 | Sports/news/live |
| Admin | `apps/admin-dashboard` | `@lkvip/admin` | 5180 | Quản trị |

Shared packages:

- `@lkvip/ui`: shared UI/hooks, gồm `useAppConfig` cho runtime config.
- `@lkvip/types`: shared TypeScript types.
- `@lkvip/utils`: shared helpers.
- `@lkvip/constants`: project IDs/constants.

Styling dùng Tailwind CSS 4 và Ant Design 6. Admin/trading dùng Ant Design nhiều hơn; app H5 dùng Tailwind nhiều hơn. Icon mới nên ưu tiên `lucide-react`; `@ant-design/icons` vẫn là dependency hiện hữu.

## 4. Backend architecture

Backend nằm tại `apps/backend` và chạy package `lkvip-backend`.

```text
apps/backend/
├── server.ts
├── ecosystem.config.js
├── src/
│   ├── config/               # databases, cache, cron, swagger, socket
│   ├── modules/              # hub, game, trade, dating, sports, admin, lkvip
│   ├── shared/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   └── utils/
│   └── third-parties/
└── prisma/
    ├── hub/schema.prisma
    ├── game/schema.prisma
    ├── trade/schema.prisma
    ├── dating/schema.prisma
    ├── sports/schema.prisma
    └── admin/schema.prisma
```

Middleware flow chính trong `apps/backend/server.ts`:

1. CORS/compression/security headers/body parsing.
2. Rate limiting và risk guards.
3. Static uploads.
4. `projectResolver` xác định project từ path/host/header.
5. `configResolver` gắn `req.configService`.
6. Shared routes: `/api/auth`, `/api/shared`.
7. Module routes: `/api/hub`, `/api/game`, `/api/trade`, `/api/dating`, `/api/sports`, `/api/admin`, `/api/lkvip`.
8. Alias game launch: `/api/v1/game`.
9. Health/metrics/error handler/Socket.IO/cron/workers.

## 5. Database architecture

6 schemas tách biệt; không dựa vào cross-DB foreign key.

| Project | DB/schema | Prisma schema | Env var |
|---------|-----------|---------------|---------|
| hub | `hub_db` | `apps/backend/prisma/hub/schema.prisma` | `HUB_DATABASE_URL` |
| game | `game_db` | `apps/backend/prisma/game/schema.prisma` | `GAME_DATABASE_URL` |
| trade | `trade_db` | `apps/backend/prisma/trade/schema.prisma` | `TRADE_DATABASE_URL` |
| dating | `dating_db` | `apps/backend/prisma/dating/schema.prisma` | `DATING_DATABASE_URL` |
| sports | `sports_db` | `apps/backend/prisma/sports/schema.prisma` | `SPORTS_DATABASE_URL` |
| admin | `admin_db` | `apps/backend/prisma/admin/schema.prisma` | `ADMIN_DATABASE_URL` |

Prisma clients được tạo qua:

```bash
pnpm prisma:generate
pnpm --filter lkvip-backend run prisma:migrate:all
pnpm prisma:deploy
```

## 6. Runtime config và Theme Live Preview

Admin cấu hình giao diện tại `/config/general` trong `apps/admin-dashboard`.

Luồng:

1. Admin chọn project.
2. Trang gọi `/admin/ui-config?project=<project>`.
3. Local `changes` cập nhật preview inline trước khi save.
4. Save dùng `PUT /admin/ui-config`.
5. Public app gọi `/api/shared/config?project=<project>&group=<group>`.
6. `packages/ui/src/hooks/useAppConfig.ts` normalize config và áp CSS vars qua `applyColorConfig`.

Public groups hiện được phép gồm `brand`, `colors`, `social`, `feature`, `media`, `popups`. Endpoint public chỉ trả config non-secret.

## 7. Realtime, cache, queue

- Redis dùng cho cache, queue, và Socket.IO Redis adapter nếu adapter khả dụng.
- Socket.IO phục vụ chat, notification, live/sports events.
- BullMQ workers nằm trong backend/shared queue logic; Redis là dependency bắt buộc cho production.

## 8. Health, metrics, deploy

Backend chạy nội bộ tại `127.0.0.1:5000`; Nginx proxy public API.

Health endpoint:

```text
GET /health
```

Deploy chỉ được xem là OK khi JSON trả `status: "healthy"`. HTTP 200 đơn thuần không đủ.

Metrics:

```text
GET /metrics
```

Có thể bảo vệ bằng `METRICS_API_KEY`.

Deploy canonical:

- Local script: `scripts/deploy.sh`.
- GitHub Actions: `.github/workflows/deploy.yml`.
- Docs: `docs/DEPLOYMENT.md`.

## 9. Security boundaries

- Không trả secret qua public config API.
- Không commit `.env` hoặc credential.
- Không in giá trị secret trong log/tài liệu/chat.
- Production cần `CORS_ORIGINS`.
- `JWT_SECRET` và `ENCRYPTION_KEY` tối thiểu 32 ký tự.
- DB schema/migration cần review vì ảnh hưởng 6 schemas và luồng tài chính.

## 10. Tài liệu liên quan

- `docs/ONBOARDING.md` — cho người mới.
- `docs/SETUP.md` — setup local.
- `docs/API_ENDPOINTS.md` — API canonical.
- `docs/DEPLOYMENT.md` — deploy canonical.
- `docs/MIGRATION_GUIDE.md` — Prisma migration.
- `CONTRIBUTING.md` — quy trình đóng góp.
