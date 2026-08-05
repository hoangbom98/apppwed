# Architecture & Coding Standards — LKVIP Group

## Tech Stack (Actual — 2025)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Language | TypeScript | ~6.0.2 |
| Backend framework | Express.js | ^4.22.2 |
| ORM | Prisma | ^5.15.0 |
| Database (core) | MySQL | 8.x (6 schemas) |
| Database (external apps) | Supabase / PostgreSQL | latest |
| Cache / Queue broker | Redis | 7.x |
| Job queue | BullMQ (+ Bull legacy) | ^5.80.10 / ^4.16.5 |
| WebSocket | Socket.IO | ^4.8.3 |
| Backend validation | **Joi** | ^17.13.4 |
| Frontend validation | **Yup** + React Hook Form | ^1.x / ^7.x |
| Frontend framework | React | ^19.2.7 |
| Build tool | Vite | ^8.1.1 |
| Frontend styling | **Tailwind CSS v4** + Lucide React | ^4.3.3 / ^0.525.0 |
| Admin / Trade UI | **Ant Design** | ^6.5.1 |
| Frontend linting | **OXLint** | ^1.71.0 |
| Backend linting | ESLint | ^8.x |
| Error tracking | Sentry (@sentry/node + @sentry/react) | ^8.x |
| Logging | Winston | ^3.x |
| Process manager | PM2 (cluster, name: `lkvip-api`) | — |
| Portal | Next.js 15 + pg (standalone, PM2 `lkvip-portal`) | ^15.5 |
| Invest app | Next.js 15 (standalone, deployed on Vercel) | ^15.x |

> **Not in codebase**: Vant UI, Zod (backend/SPA), @iconify/react, crypto-js, Video.js.
> **Exception**: `apps/lkvipgroup-portal` and `apps/invest` use Zod for server-side / Next.js validation only.
> **Backend `tsconfig.json`**: `strict: false` is intentional — the backend uses CommonJS + legacy patterns. Do **not** change to `true` without a dedicated migration PR.

---

## Monorepo Layout

```
/var/LKVIP/
├── apps/
│   ├── backend/          ← lkvip-backend (Express + Prisma + BullMQ)
│   │   ├── src/
│   │   │   ├── config/          # databases.ts, redis.ts, socket.ts, cron/, i18n.ts, swagger.ts, cookie.config.ts, prismaReplica.ts
│   │   │   ├── core/            # events/, strategies/ (lo/de/xien/dau-duoi), gamification/, marketing/, rewards/, social/
│   │   │   ├── shared/          # services/ (44+), middlewares/ (core/, auth/, audit/, security/, validation/), payment/, queue/, socket/
│   │   │   ├── modules/
│   │   │   │   ├── admin/       # Admin portal: users, finance, lottery, agents, risk, workspace, ops
│   │   │   │   ├── auth/        # Standalone auth module (JWT, 2FA, session)
│   │   │   │   ├── game/        # Game sub-project: sessions, lottery, VIP, rebate, gifts
│   │   │   │   ├── hub/         # Hub portal: CMS, news, banners, academy content
│   │   │   │   ├── trade/       # Trading sub-project: investments, price feed, orders
│   │   │   │   ├── dating/      # Dating sub-project: profiles, matches, chat
│   │   │   │   ├── sports/      # Sports sub-project: matches, scores, leagues
│   │   │   │   ├── lkvip/       # LKvip internal payment gateway
│   │   │   │   ├── store/       # LKVIP Store: products, orders, cart
│   │   │   │   └── workers/     # 14 BullMQ workers
│   │   │   ├── risk/            # Risk engine (15 detectors): fraud, bot, DDoS, brute-force, AML, compliance, geolocation, device-fingerprint, transactionMonitor, securityMonitor
│   │   │   ├── automation/      # depositSyncWorker.ts, businessEvents.ts
│   │   │   └── third-parties/  # core/, managers/, providers/, sports/ — GSC, Goldgate, TCGaming, Binance, ApiFootball, GNews, TheSportsDB, Sportmonks
│   │   ├── prisma/
│   │   │   ├── schema.prisma          ← Root schema (PostgreSQL, Admin Portal workspace)
│   │   │   ├── admin/schema.prisma
│   │   │   ├── game/schema.prisma
│   │   │   ├── hub/schema.prisma
│   │   │   ├── trade/schema.prisma
│   │   │   ├── dating/schema.prisma
│   │   │   ├── sports/schema.prisma
│   │   │   └── supabase/             ← RLS policies for external apps (rls-policies.sql)
│   │   └── package.json
│   ├── hub/               ← @lkvip/hub (Tailwind + Lucide, Capacitor, port 5173)
│   ├── game/              ← @lkvip/game (Tailwind + Lucide + recharts + framer-motion, Capacitor, port 5174)
│   ├── trading/           ← @lkvip/trade (Tailwind + Lucide + recharts, Capacitor, port 5175)
│   ├── dating/            ← @lkvip/dating (Tailwind + Lucide + framer-motion, Capacitor, port 5176)
│   ├── sports/            ← @lkvip/sports (Tailwind + Lucide + hls.js, Capacitor, port 5177)
│   ├── admin-dashboard/   ← @lkvip/admin (Ant Design v6 + Tailwind, Desktop PWA, port 5180)
│   ├── banking/           ← @lkvip/banking (Tailwind + Lucide + Yup, port 5181, Vercel)
│   ├── invest/            ← @lkvip/invest (Next.js 15 + Tailwind, port 5182, Vercel)
│   ├── lkvip-store/       ← @lkvip/store (Tailwind + Lucide + RHF + Yup, port 5185, Vercel)
│   ├── academy/           ← @lkvip/academy (Tailwind + Lucide, port 5184, Vercel)
│   ├── lkvipgroup-portal/ ← @lkvip/portal (Next.js 15, standalone, port 3010, Vercel)
│   ├── mobile/            ← @lkvip/mobile (Capacitor wrapper for admin-dashboard PWA)
│   ├── mobile-native/     ← Native mobile shell
│   └── mobile-native-enterprise/ ← Enterprise native shell
├── packages/
│   ├── constants/    ← @lkvip/constants   (enums, banks, currencies, roles, errors, projects)
│   ├── types/        ← @lkvip/types       (shared TS interfaces — common, api, portal, store)
│   ├── ui/           ← @lkvip/ui          (shared React components, hooks, stores, pwa, formatters)
│   ├── utils/        ← @lkvip/utils       (crypto, date, format, money/decimal.js, otp, slugify)
│   ├── api-client/   ← @lkvip/api-client  (Axios auth client factory with auto-refresh)
│   ├── auth/         ← @lkvip/auth        (shared auth hooks, TokenManager)
│   ├── config/       ← @lkvip/config      (shared ESLint flat configs: browser + node)
│   ├── paylock-sdk/  ← @lkvip/paylock-sdk (license verification SDK, UMD/ESM/CJS)
│   ├── ai-skills/    ← @lkvip/ai-skills   (AI-driven health check & auto-fix tooling)
│   ├── scripts-utils/← @lkvip/scripts-utils (shared CLI/build utilities)
│   └── tsconfig/     ← @lkvip/tsconfig    (shared tsconfig bases for all packages)
├── config/
│   ├── nginx/        ← Nginx configs (group.conf, tc-gaming.conf, lkvip-http.conf)
│   ├── pm2/          ← ecosystem.config.js (lkvip-api cluster + lkvip-portal fork)
│   ├── mysql/        ← MySQL configuration
│   ├── redis/        ← Redis configuration
│   ├── database/     ← DB-level configs and init scripts
│   ├── env/          ← Environment variable templates
│   ├── eslint/       ← Shared ESLint configs
│   ├── firebase/     ← Firebase Admin SDK config
│   ├── monitoring/   ← prometheus.yml, grafana/
│   ├── oxlint.json   ← OXLint root config
│   ├── prettier/     ← Prettier config
│   ├── storage/      ← Storage (S3/local) config
│   ├── typescript/   ← Root tsconfig bases
│   ├── vercel/       ← Vercel deployment guide (SETUP.md)
│   └── vitest/       ← Vitest config
└── scripts/          ← deploy.sh, vps-setup.sh, backup.sh, pre-prod-check.sh, setup-permissions.sh
```

---

## Per-Module Structure (Backend)

```
src/modules/<module>/
  controllers/   ← HTTP handlers only: validate → delegate → respond
  services/      ← All business logic
  routes/        ← Express Router with middleware declarations
  validators/    ← Joi schemas for request bodies / query params
  dto/           ← TypeScript interfaces for request/response shapes
  index.ts       ← Exports public surface of the module
```

---

## API Contract

- RESTful: `GET /api/<resource>`, `POST /api/<resource>`, `PUT /api/<resource>/:id`, `DELETE /api/<resource>/:id`
- All responses use the `ApiResponse` envelope:
  ```typescript
  // success
  { success: true, data: T, message?: string }
  // error
  { success: false, error: { code: string, message: string } }
  ```
- Required middleware on every protected route: `authenticate` → `projectAccessGuard` → `rateLimiter`
- Validate all inputs with **Joi** before calling a service. Controllers must not contain business logic.

---

## TypeScript Rules

- **Backend** (`apps/backend`): `strict: false`, `module: CommonJS` — intentional legacy setup. No new `any` unless forced by third-party types; prefer `unknown` + type guard.
- **Frontend packages** (`packages/types`, `packages/utils`, etc.): `strict: true`.
- All function parameters and return types should be explicitly typed wherever feasible.
- Use `readonly` on DTO interfaces that should not be mutated.
- Backend path aliases (defined in `apps/backend/tsconfig.json`):
  ```json
  "@lkvip/types":     ["../packages/types/src/index.ts"]
  "@lkvip/constants": ["../packages/constants/src/index.ts"]
  "@lkvip/utils":     ["../packages/utils/src/index.ts"]
  ```

---

## Service Layer Rules

- Services receive their dependencies via constructor (Dependency Injection).
- Never call `new PrismaClient()` inside a service — use the factory in `apps/backend/src/config/databases.ts`.
- Services are pure business logic: no `req`/`res` objects, no HTTP status codes.
- Long-running or async background work goes to a BullMQ queue (see `src/modules/workers/`), not `setTimeout`.

---

## Adapter Pattern (Payment)

Each payment gateway implements `PaymentAdapter` (defined in `src/shared/payment/BasePaymentAdapter.ts`):

```typescript
interface PaymentAdapter {
  createDeposit(orderId: string, amount: number, currency: string): Promise<DepositResult>;
  checkStatus(txId: string): Promise<{ status: string; amount: number }>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
  verifySignature(payload: unknown, signature: string): boolean;
}
```

Registered adapters (6): `MoMo`, `USDT`, `OKPay`, `Pay818`, `GoPay`, `LKvipInternal`.
Factory: `src/shared/payment/PaymentFactory.ts`.

---

## Frontend Standards

- **Styling**: Tailwind CSS v4 for all SPAs. Ant Design v6 for Admin Dashboard. No Vant UI.
- **Icons**: Lucide React (`lucide-react`). No @iconify/react.
- **State management**: Zustand (global client state), TanStack Query (server state).
- **Routing**: React Router DOM v7 (SPAs); Next.js App Router (Portal, Invest).
- **Forms**: React Hook Form + Yup validation. No Zod (except in Portal / Invest server components).
- **Animation**: framer-motion (Game, Dating only).
- **Video/HLS**: hls.js (Sports only). No Video.js.
- **Mobile**: Capacitor v7 for Hub, Game, Trading, Dating, Sports.
- **PWA**: vite-plugin-pwa on all Vite SPAs (Hub, Game, Trade, Dating, Sports, Admin, Banking, Store, Academy).
- **Shared components**: import from `@lkvip/ui` — never duplicate across SPAs.
- **Shared types**: import from `@lkvip/types` — never redefine.
- **Linting**: OXLint (`oxlint src`) for all Vite SPAs; ESLint for Admin Dashboard and backend.
- **i18n**: i18next + react-i18next (Hub has full i18n/; others use react-hot-toast for user messages).

### Vercel-deployed apps
The following apps have `vercel.json` and are deployed on Vercel (not VPS Nginx):
- `apps/banking` (`@lkvip/banking`)
- `apps/invest` (`@lkvip/invest`) — Next.js 15
- `apps/lkvip-store` (`@lkvip/store`)
- `apps/academy` (`@lkvip/academy`)
- `apps/lkvipgroup-portal` (`@lkvip/portal`) — Next.js 15
- `apps/admin-dashboard` (`@lkvip/admin`)
- `apps/game`, `apps/hub`, `apps/dating`, `apps/sports`, `apps/trading` — also have `vercel.json`

---

## Naming Conventions

| Artifact | Convention |
|---|---|
| Files | kebab-case (`wallet-service.ts`) |
| Classes / React components | PascalCase (`WalletService`, `DepositCard`) |
| Variables / functions | camelCase |
| Constants | SCREAMING_SNAKE_CASE |
| Prisma models | PascalCase |
| Database columns | camelCase (Prisma maps to snake_case in DB) |

---

## Image Standards

All image types, dimensions, aspect ratios, shared components, file naming, and upload validation
rules are documented in [`reference/image-standards.md`](image-standards.md).
