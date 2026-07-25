# Windows Dev Environment Setup — LKVIP Group

## Required Tools

| Tool | Version | Install |
|---|---|---|
| Node.js | **20 LTS** | [nodejs.org](https://nodejs.org) — add to PATH |
| MySQL | **8.x** | [mysql.com/downloads](https://dev.mysql.com/downloads/installer/) — Developer Default preset |
| Redis | **7.x** | [github.com/microsoftarchive/redis](https://github.com/microsoftarchive/redis/releases) — install .msi, enable service |
| Git | latest | [git-scm.com](https://git-scm.com) |
| pnpm | **≥ 9.0.0** | `npm install -g pnpm` |
| VS Code | latest | Extensions: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense, OXLint |

## Initial Setup Sequence

```bash
# 1. Clone and enter the repo
git clone <repo-url> /var/LKVIP
cd /var/LKVIP

# 2. Install all workspace dependencies (pnpm v9+ required)
pnpm install

# 3. Create your local .env
copy apps\backend\.env.example apps\backend\.env
# Edit apps\backend\.env — fill in all DATABASE_URL values and secrets (see below)

# 4. Create the 6 databases in MySQL
mysql -u root -p
```

```sql
CREATE DATABASE admin_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE game_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE hub_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE trade_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE dating_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE sports_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'lkvip_db'@'127.0.0.1' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON admin_db.*  TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON game_db.*   TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON hub_db.*    TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON trade_db.*  TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON dating_db.* TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON sports_db.* TO 'lkvip_db'@'127.0.0.1';
FLUSH PRIVILEGES;
```

```bash
# 5. Generate Prisma clients for all 6 schemas
pnpm run prisma:generate

# 6. Run all Prisma migrations
pnpm run prisma:migrate:all
# Or individually (from apps/backend/):
#   npx tsx scripts/prisma-run.ts migrate admin
#   npx tsx scripts/prisma-run.ts migrate game
#   ... etc.

# 7. Seed sample data
pnpm --filter lkvip-backend run seed:all

# 8. Build shared packages first
pnpm run build:packages   # types → constants → utils

# 9. Start development servers (all in one — uses concurrently)
pnpm run dev:all
# Or individually:
pnpm run dev:backend
pnpm run dev:hub
pnpm run dev:game
pnpm run dev:admin
# etc.
```

## .env Format (`apps/backend/.env`)

```dotenv
# Database URLs — connection_limit=8 per schema on 8-core VPS
HUB_DATABASE_URL="mysql://lkvip_db:<password>@127.0.0.1:3306/hub_db?connection_limit=8"
GAME_DATABASE_URL="mysql://lkvip_db:<password>@127.0.0.1:3306/game_db?connection_limit=8"
TRADE_DATABASE_URL="mysql://lkvip_db:<password>@127.0.0.1:3306/trade_db?connection_limit=8"
DATING_DATABASE_URL="mysql://lkvip_db:<password>@127.0.0.1:3306/dating_db?connection_limit=8"
SPORTS_DATABASE_URL="mysql://lkvip_db:<password>@127.0.0.1:3306/sports_db?connection_limit=8"
ADMIN_DATABASE_URL="mysql://lkvip_db:<password>@127.0.0.1:3306/admin_db?connection_limit=8"

REDIS_URL="redis://127.0.0.1:6379"

JWT_SECRET="<random 48+ char hex>"
JWT_REFRESH_SECRET="<random 48+ char hex, different from above>"
JWT_EXPIRES_IN="2h"
JWT_REFRESH_EXPIRES_IN="30d"

ENCRYPTION_KEY="<random 64 hex chars>"

PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5000
```

## Common Windows Issues

| Symptom | Fix |
|---|---|
| `mysql` not found in terminal | Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to system PATH |
| Redis connection refused | Open Services → start `Redis` service |
| `prisma migrate` fails on Windows | Use `127.0.0.1`, not `localhost` in DATABASE_URL |
| Port 5000 in use | `netstat -ano \| findstr :5000` then `taskkill /PID <pid> /F` |
| pnpm workspace resolution error | Delete root `node_modules` and each package's `node_modules`, then `pnpm install` again |
| `tsx` not found | Run `pnpm install` from repo root first; tsx is a devDependency of lkvip-backend |
| TypeScript errors after install | `pnpm run build:packages` before starting backend — shared packages must be built first |
| `catalog:` resolution error | Ensure pnpm version ≥ 9.0.0 (`pnpm --version`) |
