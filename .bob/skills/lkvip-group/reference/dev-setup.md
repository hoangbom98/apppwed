# Windows Dev Environment Setup — LKVIP Group

## Required Tools

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) — add to PATH |
| MySQL | 8 | [mysql.com/downloads](https://dev.mysql.com/downloads/installer/) — Developer Default preset |
| Redis | 7 | [github.com/microsoftarchive/redis](https://github.com/microsoftarchive/redis/releases) — install .msi, enable service |
| Git | latest | [git-scm.com](https://git-scm.com) |
| pnpm | latest | `npm install -g pnpm` |
| VS Code | latest | Extensions: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense |

## Initial Setup Sequence

```bash
# 1. Clone or enter the repo
cd website-admin

# 2. Install all workspace dependencies
pnpm install

# 3. Create your local .env
copy backend\.env.example backend\.env
# Edit backend\.env — fill in all DATABASE_URL values (see below)

# 4. Create the 6 databases in MySQL
mysql -u root -p
```

```sql
CREATE DATABASE admin_db;
CREATE DATABASE game_db;
CREATE DATABASE hub_db;
CREATE DATABASE trade_db;
CREATE DATABASE dating_db;
CREATE DATABASE sports_db;
```

```bash
# 5. Run all Prisma migrations (repeat for each schema)
cd backend
npx prisma migrate dev --name init --schema=prisma/admin/schema.prisma
npx prisma migrate dev --name init --schema=prisma/game/schema.prisma
npx prisma migrate dev --name init --schema=prisma/hub/schema.prisma
npx prisma migrate dev --name init --schema=prisma/trade/schema.prisma
npx prisma migrate dev --name init --schema=prisma/dating/schema.prisma
npx prisma migrate dev --name init --schema=prisma/sports/schema.prisma
# Or use the project script if it exists:
pnpm run prisma:migrate:all

# 6. Seed sample data
pnpm run prisma:seed:all

# 7. Start development servers
pnpm run dev           # backend (tsx watch)
# In a separate terminal per frontend:
cd ../frontend/hub && pnpm run dev
cd ../frontend/admin-dashboard && pnpm run dev
# Or from root (if configured):
pnpm run dev:all
```

## .env Format

```dotenv
ADMIN_DATABASE_URL="mysql://root:<password>@127.0.0.1:3306/admin_db"
GAME_DATABASE_URL="mysql://root:<password>@127.0.0.1:3306/game_db"
HUB_DATABASE_URL="mysql://root:<password>@127.0.0.1:3306/hub_db"
TRADE_DATABASE_URL="mysql://root:<password>@127.0.0.1:3306/trade_db"
DATING_DATABASE_URL="mysql://root:<password>@127.0.0.1:3306/dating_db"
SPORTS_DATABASE_URL="mysql://root:<password>@127.0.0.1:3306/sports_db"

REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="<random 32+ char string>"
JWT_REFRESH_SECRET="<random 32+ char string>"
PORT=5000
NODE_ENV=development
```

## Common Windows Issues

| Symptom | Fix |
|---|---|
| `mysql` not found in terminal | Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to system PATH |
| Redis connection refused | Open Services → start `Redis` service |
| `prisma migrate` fails | Check DATABASE_URL — use `127.0.0.1`, not `localhost` on Windows |
| Port 5000 in use | `netstat -ano \| findstr :5000` then `taskkill /PID <pid> /F` |
| pnpm workspace resolution error | Delete `node_modules` at root and each package, then `pnpm install` again |
