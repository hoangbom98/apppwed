# Architecture & Coding Standards — LKVIP Group

## Monorepo Layout

```
apps/
├── backend/
│   ├── src/
│   │   ├── config/          # DB factory, Redis, Socket.IO, Cron, i18n, Swagger
│   │   ├── core/            # Event bus, lottery strategies, distributed lock
│   │   ├── shared/          # Cross-cutting: Auth, Wallet, Rebate, Notification, Settlement
│   │   ├── modules/
│   │   │   ├── admin/       # Admin portal: users, finance, lottery, agents, risk, ops
│   │   │   ├── game/        # Game sub-project: sessions, lottery, VIP, rebate, gifts
│   │   │   ├── hub/         # Hub portal: CMS, news, banners
│   │   │   ├── trade/       # Trading sub-project: investments, yuebao
│   │   │   ├── dating/      # Dating sub-project
│   │   │   ├── sports/      # Sports betting sub-project
│   │   │   ├── lkvip/       # LKvip payment gateway (internal)
│   │   │   └── workers/     # BullMQ workers (rebate, agent-settlement, lottery, etc.)
│   │   ├── risk/            # Risk detection & AML engine
│   │   ├── automation/      # Deposit sync, business events
│   │   ├── third-parties/   # GSC, Goldgate, TCGaming adapters
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/              # One schema per sub-project
│   │   ├── admin/schema.prisma
│   │   ├── game/schema.prisma
│   │   ├── hub/schema.prisma
│   │   ├── trade/schema.prisma
│   │   ├── dating/schema.prisma
│   │   └── sports/schema.prisma
│   └── package.json
├── hub/           game/          trading/
├── dating/        sports/        admin-dashboard/   mobile/
packages/
├── constants/     # Shared enums, error codes, project IDs, roles
├── types/         # Shared TypeScript interfaces (User, Transaction, Lottery, Agent…)
├── ui/            # Shared React components
└── utils/         # Shared utility functions
```

## Per-Module Structure

```
src/modules/<module>/
  controllers/   ← HTTP handlers only: validate → delegate → respond
  services/      ← All business logic
  routes/        ← Express Router with middleware declarations
  validators/    ← Zod schemas for request bodies / query params
  dto/           ← TypeScript interfaces for request/response shapes
```

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
- Validate all inputs with Zod **before** calling a service. Controllers must not contain `if/else` business logic.

## TypeScript Rules

- `strict: true` in `tsconfig.json` — no exceptions.
- Never use `any`. Use `unknown` + type guard, or define a proper interface.
- All function parameters and return types must be explicitly typed.
- Use `readonly` on DTO interfaces that should not be mutated.

## Service Layer Rules

- Services receive their dependencies via constructor (Dependency Injection).
- Never call `new PrismaClient()` inside a service — use the factory in `src/config/databases.ts`.
- Services are pure business logic: no `req`/`res` objects, no HTTP status codes.
- Long-running or async background work goes to a BullMQ queue, not a `setTimeout`.

## Adapter Pattern (Payment)

Each payment gateway implements `PaymentAdapter`:
```typescript
interface PaymentAdapter {
  createDeposit(orderId: string, amount: number, currency: string): Promise<DepositResult>;
  checkStatus(txId: string): Promise<{ status: string; amount: number }>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
  verifySignature(payload: unknown, signature: string): boolean;
}
```
Registered gateways: `USDT`, `Bank`, `Momo`, `LKvip`, `VNPay`.

## Frontend Standards

- State management: Zustand (global), TanStack Query (server state).
- Routing: React Router v6.
- Shared components live in `frontend/shared-ui/` — never duplicate across SPAs.
- Shared TypeScript types live in `frontend/shared-types/` — import from there, never redefine.
- Support dark mode via CSS variables; support i18n via `react-i18next`.
- Integrate PWA via `vite-plugin-pwa`.

## Naming Conventions

| Artifact | Convention |
|---|---|
| Files | kebab-case (`wallet-service.ts`) |
| Classes / React components | PascalCase (`WalletService`, `DepositCard`) |
| Variables / functions | camelCase |
| Constants | SCREAMING_SNAKE_CASE |
| Prisma models | PascalCase |
| Database columns | camelCase (Prisma maps to snake_case in DB) |
