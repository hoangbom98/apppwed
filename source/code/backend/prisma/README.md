# Prisma — LKVIP GROUP

6 completely isolated MySQL databases. Each project owns its own Prisma schema,
generated client, and migration history. There are **no cross-DB foreign keys**.

---

## Directory Layout

```
prisma/
├── admin/          admin_db   — users, wallets, KYC, ops, config, support
├── hub/            hub_db     — portal, CMS, news, games catalog, events
├── game/           game_db    — game aggregators, sessions, lottery, lkvip, VIP
├── trade/          trade_db   — markets, orders, positions, wallets, KYC
├── dating/         dating_db  — profiles, match, chat, livestream, gifts
├── sports/         sports_db  — leagues, matches, betting, highlights, community
└── seeds/          seed scripts (admin → hub → game → lkvip → trade → dating → sports)
```

Each sub-directory contains:
```
<project>/
├── schema.prisma          — Prisma schema (generator + datasource + models)
└── migrations/
    ├── migration_lock.toml
    └── <timestamp>_<name>/
        └── migration.sql
```

---

## Generated Clients

Clients are output to `node_modules/.prisma/<project>-client` and loaded at runtime
by `src/config/databases.ts` via `getPrismaClient(project)`.

| Project | Env Var               | Client Path                          |
|---------|-----------------------|--------------------------------------|
| admin   | `ADMIN_DATABASE_URL`  | `.prisma/admin-client`               |
| hub     | `HUB_DATABASE_URL`    | `.prisma/hub-client`                 |
| game    | `GAME_DATABASE_URL`   | `.prisma/game-client`                |
| trade   | `TRADE_DATABASE_URL`  | `.prisma/trade-client`               |
| dating  | `DATING_DATABASE_URL` | `.prisma/dating-client`              |
| sports  | `SPORTS_DATABASE_URL` | `.prisma/sports-client`              |

---

## Common Commands

```bash
# Generate all 6 clients (after schema change)
npm run prisma:generate

# Generate one client only
npx prisma generate --schema=prisma/game/schema.prisma

# Run all migrations (development)
npm run prisma:migrate:all

# Apply all migrations (production — no prompt)
npm run prisma:deploy:all

# Check migration status
npm run prisma:status:all

# Seed all databases
npm run seed:all

# Seed a specific database only
SEED_ONLY=game node prisma/seeds/index.ts
```

---

## Migration Naming Convention

```
<YYYYMMDDHHMMSS>_<snake_case_description>/migration.sql

Examples:
  20250101000000_init_admin/
  20260722035058_add_app_catalog/
  20260801000000_normalize_user/
  20260802000000_add_lkvip_models/
```

Use `IF NOT EXISTS` / `IF EXISTS` guards in SQL so migrations are idempotent on
re-application (e.g. after a partial failure during first deploy).

---

## Architecture Rules

- **One DB per project** — no cross-DB JOINs or foreign keys.
- **Admin can read any DB** for aggregated stats via `getPrismaClient(project)`.
- **All other modules** access only `req.prisma` (their own DB singleton).
- **CUID** primary keys for all user-facing tables (`@default(cuid())`).
- **autoincrement** only for internal/ops tables (OpsTask, OpsAlert, etc.).
- `@@map("snake_case")` on every model — Prisma model names are PascalCase, DB tables are snake_case.
