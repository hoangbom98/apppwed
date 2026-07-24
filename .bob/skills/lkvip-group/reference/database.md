# Database Reference — LKVIP Group

## Multi-Database Setup

Six MySQL databases, one per domain. Each has its own Prisma schema file.

| Database | Schema path | Used by |
|---|---|---|
| `admin_db` | `prisma/admin/schema.prisma` | Users, wallets, transactions, referrals |
| `game_db` | `prisma/game/schema.prisma` | Game sessions, bets, results |
| `hub_db` | `prisma/hub/schema.prisma` | Articles, banners, notifications |
| `trade_db` | `prisma/trade/schema.prisma` | Investment packages, orders, price data |
| `dating_db` | `prisma/dating/schema.prisma` | Profiles, matches, messages |
| `sports_db` | `prisma/sports/schema.prisma` | Events, odds, bet slips |

## Core Tables (admin_db)

```
User               — master user record
Wallet             — one per user (main + bonus + commission balances)
Ledger             — immutable double-entry ledger lines
Transaction        — summary of each balance movement
PaymentOrder       — deposit intents (gateway, amount, status)
WithdrawOrder      — withdrawal requests (method, accountInfo, status)
Referral           — referrer → referred relationship
CommissionLog      — earned commission events
InvestmentOrder    — active/closed investment positions
VIPConfig          — VIP tier thresholds and benefit rules
Config             — key/value global settings
Article            — CMS articles
ArticleCategory    — article taxonomy
Banner             — homepage banners
Notification       — per-user notification inbox
AuditLog           — admin action trail
```

## Key Relationships

```
User           1-1  Wallet
User           1-N  Ledger
User           1-N  Transaction
User           1-N  PaymentOrder
User           1-N  WithdrawOrder
User           1-N  Referral (as referrer AND as referred — two FK columns)
User           1-N  CommissionLog
User           1-N  InvestmentOrder
User           1-N  Notification
InvestmentPackage  1-N  InvestmentOrder
ArticleCategory    1-N  Article
```

## Required Indexes

Add these whenever creating or altering a table:

| Table | Indexed columns |
|---|---|
| `User` | `username`, `email`, `referralCode` |
| `Transaction` | `userId`, `type`, `status`, `createdAt` |
| `PaymentOrder` | `userId`, `status`, `orderId` |
| `WithdrawOrder` | `userId`, `status` |
| `Referral` | `referrerId`, `referredId` |
| `CommissionLog` | `userId`, `createdAt` |
| `InvestmentOrder` | `userId`, `status`, `packageId` |
| `Notification` | `userId`, `isRead` |

## Migration Rules

1. One migration per logical change — never batch unrelated changes.
2. Name migrations descriptively: `add_investment_referral`, `create_commission_log`.
3. Run per-schema:
   ```bash
   npx prisma migrate dev --name <description> --schema=prisma/<project>/schema.prisma
   ```
4. Never edit a committed migration file. If you need to fix a mistake, create a new migration.
5. Seeds must be **idempotent** — use `upsert`, never bare `create`.
6. Seed command per schema:
   ```bash
   npx ts-node prisma/seeds/<project>.seed.ts
   ```

## Prisma Client Factory

All code must obtain a client via the factory — never instantiate directly:

```typescript
import { getPrismaClient } from '@/config/databases';
const prisma = getPrismaClient('admin'); // or 'game', 'hub', 'trade', 'dating', 'sports'
```
