# Architecture & Coding Standards — LKVIP Group

## Tech Stack (Actual — 2025)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Language | TypeScript | ~6.0.2 (strict) |
| Backend framework | Express.js | ^4.22.2 |
| ORM | Prisma | ^5.15.0 |
| Database | MySQL | 8.x (6 schemas) |
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

> **Not in codebase**: Vant UI, Zod, @iconify/react, crypto-js, Video.js. Do not suggest these.

---

## Monorepo Layout

```
/var/LKVIP/
├── apps/
│   ├── backend/          ← lkvip-backend (Express + Prisma + BullMQ)
│   │   ├── src/
│   │   │   ├── config/          # DB factory, Redis, Socket.IO, Cron, i18n, Swagger, cookies
│   │   │   ├── core/            # Event bus, lottery strategies (lo/de/xien/dau-duoi)
│   │   │   ├── shared/          # Cross-cutting: Auth, Wallet, Payment, Notification, Queue, Socket
│   │   │   ├── modules/
│   │   │   │   ├── admin/       # Admin portal: users, finance, lottery, agents, risk, ops
│   │   │   │   ├── game/        # Game sub-project: sessions, lottery, VIP, rebate, gifts
│   │   │   │   ├── hub/         # Hub portal: CMS, news, banners
│   │   │   │   ├── trade/       # Trading sub-project: investments, price feed, orders
│   │   │   │   ├── dating/      # Dating sub-project: profiles, matches, chat
│   │   │   │   ├── sports/      # Sports sub-project: matches, scores, leagues
│   │   │   │   ├── lkvip/       # LKvip internal payment gateway
│   │   │   │   └── workers/     # 13 BullMQ workers
│   │   │   ├── risk/            # Risk engine: fraud, bot, DDoS, brute-force, compliance, AML
│   │   │   ├── automation/      # depositSyncWorker, businessEvents
│   │   │   └── third-parties/  # GSC, Goldgate, TCGaming, Binance, ApiFootball, GNews, TheSportsDB
│   │   ├── prisma/
│   │   │   ├── admin/schema.prisma
│   │   │   ├── game/schema.prisma
│   │   │   ├── hub/schema.prisma
│   │   │   ├── trade/schema.prisma
│   │   │   ├── dating/schema.prisma
│   │   │   └── sports/schema.prisma
│   │   └── package.json
│   ├── hub/               ← @lkvip/hub (Tailwind + Lucide, Capacitor)
│   ├── game/              ← @lkvip/game (Tailwind + Lucide + recharts + framer-motion, Capacitor)
│   ├── trading/           ← @lkvip/trade (Tailwind + Lucide, Capacitor)
│   ├── dating/            ← @lkvip/dating (Tailwind + Lucide + framer-motion, Capacitor)
│   ├── sports/            ← @lkvip/sports (Tailwind + Lucide + hls.js, Capacitor)
│   ├── admin-dashboard/   ← @lkvip/admin (Ant Design v6 + Tailwind, Desktop only, PWA)
│   └── mobile/            ← @lkvip/mobile (Capacitor wrapper)
├── packages/
│   ├── constants/   ← @lkvip/constants  (enums, banks, currencies, roles, errors, projects)
│   ├── types/       ← @lkvip/types      (shared TS interfaces)
│   ├── ui/          ← @lkvip/ui         (shared React components, hooks, stores, pwa)
│   └── utils/       ← @lkvip/utils      (crypto, date, format, money/decimal.js, otp, slugify)
├── config/
│   ├── nginx/       ← Nginx configs (tc-gaming.conf, group.conf, etc.)
│   ├── pm2/         ← ecosystem.config.js
│   └── monitoring/  ← prometheus.yml, grafana/
└── scripts/         ← deploy.sh, ssl-setup.sh, vps-setup.sh, prisma-run.ts
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

- `strict: true` in `tsconfig.json` — TypeScript 6.0.2.
- Never use `any`. Use `unknown` + type guard, or define a proper interface.
- All function parameters and return types must be explicitly typed.
- Use `readonly` on DTO interfaces that should not be mutated.

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
- **Routing**: React Router DOM v7.
- **Forms**: React Hook Form + Yup validation (Game, Dating, @lkvip/ui). No Zod.
- **Animation**: framer-motion (Game, Dating only).
- **Video/HLS**: hls.js (Sports only). No Video.js.
- **Mobile**: Capacitor v7 for Hub, Game, Trading, Dating, Sports.
- **PWA**: vite-plugin-pwa on all 6 SPAs.
- **Shared components**: import from `@lkvip/ui` — never duplicate across SPAs.
- **Shared types**: import from `@lkvip/types` — never redefine.
- **Linting**: OXLint (`oxlint src`) for all frontend SPAs; ESLint for Admin Dashboard and backend.
- **i18n**: i18next + react-i18next (Hub has full i18n/; others use react-hot-toast for user messages).

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
