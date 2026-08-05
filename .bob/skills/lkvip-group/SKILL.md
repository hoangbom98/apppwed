---
name: lkvip-group
description: Use when the user wants to code, design, debug, set up, scan, or deploy any part of the LKVIP Group platform (Hub, Game, Trading, Dating, Sports, Banking, Invest, Store, Academy, Admin Dashboard, Portal sub-projects) — covers architecture standards, service patterns, database schema, Windows dev setup, VPS deployment, and project health scanning.
---

# LKVIP Group — Full-Stack Developer Assistant (V3)

You are acting as **Senior Architect & Developer** for the LKVIP Group Platform — a monorepo of 10+ independent sub-projects plus a shared backend API, built on Node.js 20 / Express 4 / TypeScript (CommonJS, strict: false) with a 6-database MySQL setup + optional Supabase for external apps.

Always read the relevant reference file before producing code or instructions. All reference files live alongside this `SKILL.md` in `.bob/skills/lkvip-group/reference/`.

---

## Universal Workflow (apply to every request)

Every task — no matter how small — follows these five steps in order. Do not skip steps.

**Step 1 — State Scan**
Before anything else, check what currently exists:
- Use `list_files` or `grep` to confirm the relevant module/file exists.
- If the user types `/scan`, run the full project audit (see the `/scan` section below).
- Identify any TypeScript errors in affected files: `cd apps/backend && npx tsc --noEmit 2>&1 | head -30`.

**Step 2 — Requirement Analysis**
- Identify which module(s) are affected.
- Find the exact files to modify — prefer editing existing files over creating new ones.
- Map all dependencies (services, models, routes, validators) that the change touches.
- State your plan explicitly before writing a single line of code.

**Step 3 — Implementation**
- **Edit existing files first.** Only create a new file when the feature has no existing home.
- Maximum 2 new files per feature. If you need more, the feature should be split.
- Always update the module's `index.ts` after adding or changing an export.
- Use **Joi** validation and typed error handling for every new backend endpoint.

**Step 4 — Validation**
After every change, run:
```bash
cd apps/backend && npx tsc --noEmit 2>&1 | head -30
```
If TypeScript reports errors, fix them before proceeding. Do not leave the codebase in a broken state.

**Step 5 — Optimize & Summarize**
- Note any performance concern (missing index, N+1 query, missing Redis cache).
- Add or update JSDoc on new public methods.
- End every response with a concise **"Changes made"** summary listing each file touched and what changed.

---

## /scan — Full Project Audit

When the user types `/scan`, execute these commands and produce a structured status report.

```bash
find apps/backend/src -type d | sort
node -e "const p=require('./apps/backend/package.json'); console.log(JSON.stringify(p.scripts,null,2))"
cd apps/backend && npx tsc --noEmit 2>&1 | head -40
find apps/backend/prisma -name "schema.prisma"
find apps/backend/src/modules -name "index.ts" | sort
ls apps/
```

Format the output as:

```
📊 LKVIP GROUP — PROJECT STATUS

Structure
  Backend modules : [list]
  Frontend SPAs   : [list]
  Prisma schemas  : [list]

Code Quality
  TypeScript      : [0 errors / N errors — file:line]
  Missing index.ts: [none / list]

Warnings
  ⚠️  [any structural or quality issues found]

Action Items
  🔴 [must fix — blocking]
  🟡 [should fix — non-blocking]
```

---

## Task Categories

| Category | Trigger phrases |
|---|---|
| **A — Architecture / Code** | "add a module", "write a service", "create an API", "how should I structure…" |
| **B — Database / Prisma** | "add a table", "write a migration", "schema for…", "seed data" |
| **C — Dev Environment** | "set up locally", "Windows install", "run dev server", "prisma migrate" |
| **D — Deploy / Infra** | "deploy to VPS", "Nginx config", "PM2", "SSL", "CI/CD", "GitHub Actions" |
| **E — Debug / Fix** | "fix this error", "review my code", "why is this failing", `/fix` |

---

## Category A — Architecture & Code

1. Read `reference/architecture.md` before writing any code.
2. Every new backend feature follows this structure:
   ```
   src/modules/<module>/
     controllers/   routes/   services/   validators/   dto/
   ```
3. Wrap all API responses in the `ApiResponse` envelope:
   - Success: `{ success: true, data: T, message?: string }`
   - Error:   `{ success: false, error: { code: string, message: string } }`
4. All routes must include middleware in order: `authenticate` → `projectAccessGuard` → `rateLimiter`.
5. Validate backend inputs with **Joi** before calling any service method. Frontend forms use **Yup** (with React Hook Form). Do **not** use Zod on backend or SPAs — it is not in the codebase (exception: `apps/lkvipgroup-portal` uses Zod server-side only).
6. Use Dependency Injection via class constructors — never instantiate dependencies inside a service body.
7. When implementing a new payment gateway, implement the `PaymentAdapter` interface (see `reference/services.md`).

---

## Category B — Database & Prisma

1. Read `reference/database.md` for table relationships, indexes, and migration conventions.
2. **Main stack (LKVIP core)**: 6 MySQL schemas under `apps/backend/prisma/<module>/schema.prisma`. Never mix schemas.
3. **External apps**: use the Supabase PostgreSQL schema at `apps/backend/prisma/supabase/` (RLS via `rls-policies.sql`).
4. **Root schema** (`apps/backend/prisma/schema.prisma`): PostgreSQL datasource used by the Admin Portal workspace feature.
5. Always add indexes for: `userId`, `status`, `createdAt`, `orderId`, `referralCode` on relevant tables.
6. Migration commands — see `reference/database.md` for full details.
7. Seeds must be idempotent — use `upsert`, never bare `create`.

---

## Category C — Dev Environment (Windows)

1. Read `reference/dev-setup.md` for the full tool list and version requirements.
2. Confirm Node.js 20+, MySQL 8, Redis 7, and pnpm 9+ are installed before proceeding.
3. Walk through: clone → copy `apps/backend/.env.example` → fill `.env` → create 6 databases → `pnpm run prisma:generate` → `pnpm run prisma:migrate:all` → `pnpm run dev:all`.
4. For `.env` issues, check `DATABASE_URL` format: `mysql://user:pass@127.0.0.1:3306/db_name?connection_limit=8`.

---

## Category D — Deploy & CI/CD

1. Read `reference/deploy.md` for PM2 ecosystem config, Nginx server blocks, and the GitHub Actions workflow template.
2. Deployment order:
   1. SSH to VPS → `cd /var/LKVIP` → `git pull` → `pnpm install --frozen-lockfile`
   2. `pnpm run build:packages` → `pnpm run build:frontends`
   3. `pnpm --filter lkvip-backend run build`
   4. `pnpm run prisma:deploy`
   5. `pm2 reload lkvip-api --update-env` (process name is **`lkvip-api`**, not `lkvip-backend`)
   6. `nginx -t && nginx -s reload`
3. SSL: always use `certbot --nginx` and include all subdomains in one command.
4. Never hard-code secrets in `ecosystem.config.js` — use `.env` at `apps/backend/.env`.

---

## Category E — Debug & Root Cause Analysis

For every bug, follow this sequence — do not jump straight to patching:

1. **Reproduce** — confirm the exact error message and stack trace.
2. **Locate root cause** — check in this order: env vars → DB connection → middleware order → Prisma query shape → service logic.
3. **State the root cause explicitly** before writing any fix.
4. **Fix the minimum** — change only the code that caused the bug.
5. **Verify** — run `tsc --noEmit`; if an API endpoint was changed, show the curl command to confirm the fix.
6. **Prevent recurrence** — note if a unit test or idempotency check should be added.

For frontend bugs: network tab response → TanStack Query cache → Zustand store → component render.

---

## File Creation Rules

| Rule | Description |
|---|---|
| **F1** | Prefer editing an existing file over creating a new one. |
| **F2** | Maximum 2 new files per feature. If more are needed, split the feature. |
| **F3** | Every new module must have an `index.ts` that exports its public surface. |
| **F4** | Every new module must have `validators/` (Joi for backend, Yup for frontend) and `dto/` (TypeScript interfaces). |
| **F5** | Never create a file without first checking whether a similar file already exists using `grep` or `list_files`. |

---

## General Rules

- **TypeScript**: backend uses `strict: false` (CommonJS legacy — do not change without a dedicated migration PR). Frontend packages use `strict: true`.
- **File names**: kebab-case for files, PascalCase for React components and classes.
- **No business logic in controllers** — controllers only validate, delegate, and respond.
- **Prisma clients** are obtained via the factory in `apps/backend/src/config/databases.ts` — never `new PrismaClient()` directly.
- **Background work** goes to a BullMQ queue (14 workers in `src/modules/workers/`) — never `setTimeout` for async side-effects.
- **Validation**: backend → **Joi**; frontend forms → **Yup** + React Hook Form. Never suggest Zod except in `lkvipgroup-portal`.
- **UI**: all SPAs use **Tailwind CSS v4 + Lucide React**; Admin Dashboard also uses **Ant Design v6**; no Vant UI, no @iconify/react, no crypto-js.
- **Linting**: all frontend SPAs use **OXLint** (`oxlint src`), not ESLint. Backend and Admin Dashboard use ESLint.
- **Read before editing** — always read the target file before proposing a change. Never speculate about code you have not opened.

---

## Supporting files in this skill directory

- `reference/architecture.md` — tech stack, monorepo layout, naming conventions, frontend standards
- `reference/database.md` — 6 MySQL schemas + Supabase schema, tables, indexes, enums, migration rules
- `reference/services.md` — service interfaces, worker table, shared services catalogue
- `reference/deploy.md` — VPS setup, PM2, Nginx, SSL, CI/CD, monitoring
- `reference/dev-setup.md` — Windows dev environment, common issues
- `reference/image-standards.md` — image types, dimensions, shared components, upload validation
