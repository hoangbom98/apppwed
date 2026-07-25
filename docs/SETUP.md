# Setup Guide — LKVIP

Hướng dẫn setup local cho monorepo `/var/LKVIP`.

## 1. Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | >=20 | `node --version` |
| pnpm | >=9 | `pnpm --version` |
| MySQL | 8.0 | `mysql --version` |
| Redis | 7.x | `redis-cli ping` |
| Git | 2.x+ | `git --version` |
| PM2 | production only | `pm2 --version` |

## 2. Clone và install

```bash
git clone <repo-url> /var/LKVIP
cd /var/LKVIP
pnpm install
```

## 3. Environment

Backend đọc env từ `apps/backend/.env`.

```bash
cp config/env/.env.example apps/backend/.env
```

Nếu template nằm ở vị trí khác trong nhánh hiện tại, copy từ template `.env.example` đang có trong repo sang `apps/backend/.env`.

Biến bắt buộc tối thiểu:

```env
NODE_ENV=development
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://localhost:5180

JWT_SECRET=<random-string-at-least-32-chars>
ENCRYPTION_KEY=<random-string-at-least-32-chars>

HUB_DATABASE_URL=mysql://user:password@127.0.0.1:3306/hub_db
GAME_DATABASE_URL=mysql://user:password@127.0.0.1:3306/game_db
TRADE_DATABASE_URL=mysql://user:password@127.0.0.1:3306/trade_db
DATING_DATABASE_URL=mysql://user:password@127.0.0.1:3306/dating_db
SPORTS_DATABASE_URL=mysql://user:password@127.0.0.1:3306/sports_db
ADMIN_DATABASE_URL=mysql://user:password@127.0.0.1:3306/admin_db

REDIS_URL=redis://127.0.0.1:6379
```

Không commit hoặc paste giá trị secret thật vào issue/chat/docs.

## 4. Database local

Tạo 6 databases:

```sql
CREATE DATABASE IF NOT EXISTS hub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS game_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS trade_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS dating_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sports_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS admin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Generate Prisma clients, migrate, seed:

```bash
pnpm prisma:generate
pnpm --filter lkvip-backend run prisma:migrate:all
pnpm --filter lkvip-backend run seed:all
```

Seed admin mặc định nếu seed script có bật dữ liệu mẫu:

```text
Email: admin@admin.com
Password: Admin@123456
```

Đổi mật khẩu trước production.

## 5. Chạy development

Chạy từng service từ root:

```bash
pnpm dev:backend   # API :5000
pnpm dev:hub       # :5173
pnpm dev:game      # :5174
pnpm dev:dating    # :5176
pnpm dev:trade     # :5177
pnpm dev:sports    # :5178
pnpm dev:admin     # :5180
```

Hoặc chạy nhóm:

```bash
pnpm dev:frontend
pnpm dev:all
```

Kiểm tra backend:

```bash
curl http://localhost:5000/health
open http://localhost:5000/api/docs
```

## 6. Build và kiểm tra

```bash
pnpm lint:all
pnpm typecheck:all
pnpm test

pnpm build:packages
pnpm build:frontends
pnpm build:all
```

Build từng app:

```bash
pnpm build:hub
pnpm build:game
pnpm build:dating
pnpm build:trade
pnpm build:sports
pnpm build:admin
pnpm --filter lkvip-backend run build
```

## 7. Public config và Live Preview

Admin theme settings nằm tại `/config/general` trong admin dashboard.

Public app đọc config non-secret qua:

```text
/api/shared/config?project=hub&group=brand
/api/shared/config?project=hub&group=colors
```

Khi kiểm tra local, backend phải chạy trước. Nếu endpoint lỗi 500, kiểm tra `apps/backend/.env`, Redis, DB, Prisma clients.

## 8. Không dùng Docker

Docker không phải workflow chuẩn của LKVIP. Ưu tiên setup trực tiếp bằng MySQL/Redis local và pnpm workspace scripts ở trên.

## 9. Lỗi phổ biến

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|------------|
| `Missing required environment variables` | Thiếu biến trong `apps/backend/.env` | Bổ sung các biến bắt buộc |
| `Secrets too short` | `JWT_SECRET` hoặc `ENCRYPTION_KEY` dưới 32 ký tự | Dùng chuỗi đủ dài |
| `Can't connect to MySQL` | DB chưa chạy/sai URL | Kiểm tra 6 `*_DATABASE_URL` |
| `Prisma client not generated` | Chưa generate client | `pnpm prisma:generate` |
| `Redis connection refused` | Redis chưa chạy/sai `REDIS_URL` | Start Redis, kiểm tra URL |
| `EADDRINUSE :5000` | Port backend bị dùng | Dừng process đang chiếm port hoặc đổi `PORT` đồng bộ |
| Frontend gọi config 404 | Backend chưa mount/chưa chạy | Kiểm tra backend và `/api/shared/config` |

## 10. Bước tiếp theo

- Đọc `docs/ONBOARDING.md` để nắm tổng quan.
- Đọc `docs/ARCHITECTURE.md` để hiểu kiến trúc.
- Đọc `CONTRIBUTING.md` trước khi mở PR.
