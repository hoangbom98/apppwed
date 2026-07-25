# Database Reference — LKVIP Group

## Multi-Database Setup

Six MySQL databases, one per domain. Each has its own Prisma schema file.

| Database | Schema path | Used by |
|---|---|---|
| `admin_db` | `prisma/admin/schema.prisma` | Users, wallets, transactions, referrals, VIP, rebate rules, cron jobs |
| `game_db`  | `prisma/game/schema.prisma`  | Game sessions, bets, lottery, agent/commission, savings vault, gift codes |
| `hub_db`   | `prisma/hub/schema.prisma`   | Articles, banners, notifications, CMS |
| `trade_db` | `prisma/trade/schema.prisma` | Investment packages, orders, price data |
| `dating_db`| `prisma/dating/schema.prisma`| Profiles, matches, messages |
| `sports_db`| `prisma/sports/schema.prisma`| Events, odds, bet slips |

---

## Core Tables — admin_db

```
User                  — master user record (identity + wallet FK)
Wallet                — one per user per currency (balance + frozen)
Transaction           — immutable ledger of every balance movement
DepositOrder          — deposit intents (gateway, amount, status)
WithdrawOrder         — withdrawal requests (method, accountInfo, status)
Referral              — referrer → referred relationship
Commission            — earned commission events (admin_db level)
VipConfig             — VIP tier thresholds & reward amounts (admin-managed)
VipHistory            — audit trail every time a user levels up
RebateRule            — admin-configured rebate rate per game type + period
RebateClaim           — per-user rebate claim per period (admin approval workflow)
SystemConfig          — key/value global system settings
ProjectConfig         — per-project UI/feature toggles
CronJob               — scheduled background jobs (displayed in admin panel)
AdminRole             — RBAC roles with JSON permissions
AuditLog              — admin action trail
SecurityLog           — login failures, IP blocks, 2FA events
IpBlacklist           — blocked IP addresses with optional expiry
RiskScore             — user risk level snapshots
RiskAlert             — triggered risk rule alerts
AmlAlert              — anti-money-laundering alerts
LoyaltyPoint          — cumulative loyalty points per user
Notification          — per-user notification inbox
CrossBanner           — cross-project marketing banners
SupportRoom           — chat room (private + group)
SupportMessage        — individual chat messages
SupportTicket         — support ticket with priority + status
NotificationTemplate  — Telegram/email notification templates
ThirdPartyCallLog     — outbound call audit to all game/payment providers
```

---

## Core Tables — game_db

```
User                  — game-module user with balance, frozen, vipLevel, agentId
Agent                 — agent profile (parentAgentId, commissionRate, level)
Commission            — agent commission record per period (pending → paid)
VipLevel              — game-specific VIP tier config (cashbackRate, interestRate)
UserVip               — current VIP assignment per user
LotteryType           — lottery product catalogue (PC28, KENO, K3 …)
LotteryDraw           — draw/round record (period code, result, status)
LotteryBet            — individual bet on a draw (betType, odds, payout)
OddsSetting           — admin-configurable odds per game type
GameAggregator        — aggregator config (GSC, Goldgate, TCGaming)
GameProduct           — vendor/product within an aggregator
Game                  — individual game in a product catalogue
GameSession           — user game session (bet, win, status)
GameTransaction       — seamless wallet transaction record
GameWager             — GSC wager status sync (pushbetdata)
BetStats              — daily aggregated bet/win stats per user per game type
Rebate                — per-user per-day rebate record (pending → claimable → claimed)
SavingsVaultProduct   — savings product config (flexible or fixed-term)
SavingsVaultHolding   — user's active savings position
MiningMachine         — admin-configured mining machine (daily income model)
MiningHolding         — user's purchased mining machine
GiftCode              — promotional redemption code (BoYue: caipiao_giftcode)
GiftCodeRedemption    — per-user redemption record (prevents duplicate)
Promotion             — promotion/campaign (BoYue: caipiao_activity)
PromotionClaim        — user's claimed promotion with wager tracking
LuckyWheelConfig      — spin wheel configuration (free spins, cost)
WheelPrize            — prize segments with probability weights
SpinHistory           — per-user spin results
CheckinConfig         — daily check-in reward configuration
UserCheckin           — per-user per-date check-in record
MissionTemplate       — daily/weekly mission definitions
UserMission           — per-user mission progress
```

---

## Key Relationships

```
User (game_db)  1-1  Agent
Agent           1-N  Commission
Agent           1-N  Agent (parentAgentId self-reference, max 3 levels)
User            1-N  LotteryBet
LotteryType     1-N  LotteryDraw
LotteryDraw     1-N  LotteryBet
User            1-N  Rebate
User            1-N  BetStats
User            1-N  SavingsVaultHolding
GiftCode        1-N  GiftCodeRedemption
User (admin_db) 1-N  RebateClaim
RebateRule      1-N  RebateClaim
VipConfig       1-N  VipHistory
```

---

## Required Indexes

Add these whenever creating or altering a table:

| Table | Indexed columns |
|---|---|
| `User` (admin)         | `email`, `status`, `role`, `referralCode`, `lockedUntil` |
| `User` (game)          | `email`, `status`, `vipLevel`, `agentId`, `createdAt` |
| `Transaction`          | `userId`, `type`, `status`, `createdAt`, `source` |
| `DepositOrder`         | `userId`, `status`, `createdAt` |
| `WithdrawOrder`        | `userId`, `status`, `createdAt` |
| `LotteryDraw`          | `typeId`, `status`, `drawTime` |
| `LotteryBet`           | `userId`, `drawId`, `status`, `createdAt` |
| `BetStats`             | `userId`, `date`, `gameType` |
| `Rebate`               | `userId`, `status`, `betDate` |
| `Agent`                | `parentAgentId`, `status` |
| `Commission`           | `agentId`, `status` |
| `GiftCode`             | `code`, `status`, `startDate`, `endDate` |
| `GiftCodeRedemption`   | `userId`, `giftCodeId` (unique) |
| `RebateClaim`          | `userId`, `status`, `project`, `period` |
| `VipHistory`           | `userId`, `createdAt`, `project` |

---

## Enum Constants (canonical source)

All string enum values are defined in `packages/constants/src/enums.ts`.
Never use raw string literals — always import from `@lkvip/constants`.

```typescript
import {
  TransactionType,  // deposit | withdraw | bet | win | rebate | commission | …
  DrawStatus,       // WAITING | DRAWN | SETTLED | CANCELLED
  BetStatus,        // PENDING | WIN | LOSE | CANCELLED
  RebateStatus,     // pending | claimable | claimed | expired
  GameTypeKey,      // live | slot | lottery | sports
  VipTier,          // member | v1 … v10
  AgentStatus,      // active | suspended | pending | rejected
  CommissionStatus, // pending | paid | cancelled
  SavingsStatus,    // active | completed | cancelled
  GiftCodeStatus,   // active | inactive | depleted | expired
  GiftCodeRewardType, // balance | bonus | free_spin | vip_exp
  PromotionStatus,  // active | inactive | expired
  ApprovalStatus,   // pending | approved | rejected
} from '@lkvip/constants';
```

---

## Terminology Mapping (BoYue → LKVIP)

| BoYue (legacy) | LKVIP (standard) | Notes |
|---|---|---|
| `caipiao_member` | `users` | Auth + identity |
| `caipiao_fuddetail` | `transactions` | Wallet ledger |
| `caipiao_fanshui` / `xima` | `rebates` | Hoàn trả |
| `caipiao_yeb` | `savings_vault_holdings` | Savings/Yuebao |
| `caipiao_kj` | `lottery_draws` | Kỳ quay / Draw |
| `caipiao_touzhu` | `lottery_bets` | Đặt cược |
| `caipiao_group` | `vip_levels` / `vip_configs` | VIP config |
| `caipiao_agent_relation` | `agents` | Đại lý tree |
| `caipiao_agent_commission_log` | `commissions` | Hoa hồng |
| `caipiao_huodong` / `caipiao_activity` | `promotions` | Khuyến mãi |
| `caipiao_giftcode` / `caipiao_cdkey` | `gift_codes` | Mã quà tặng |
| `caipiao_gonggao` | `announcements` | Thông báo |
| `caipiao_qiandao` | `user_checkins` | Check-in hàng ngày |
| `caipiao_cron_job` | `cron_jobs` | Lịch chạy cron |
| `addtime` (unix int) | `createdAt` (DateTime) | Timestamp chuẩn |
| `trano` | `referenceId` | Mã tham chiếu |
| `bili` | `rate` / `rebateRate` | Tỷ lệ |
| `beishu` | `multiplier` | Hệ số nhân |
| `shenhe` | `approvalStatus` | Trạng thái duyệt |

---

## Migration Rules

1. One migration per logical change — never batch unrelated changes.
2. Name migrations descriptively: `add_gift_code`, `add_rebate_vip_rates`.
3. Run per-schema:
   ```bash
   npx prisma migrate dev --name <description> --schema=prisma/<project>/schema.prisma
   ```
4. Never edit a committed migration file — create a new one to fix mistakes.
5. Seeds must be **idempotent** — use `upsert`, never bare `create`.
6. Seed command per schema:
   ```bash
   npx ts-node prisma/seeds/<project>.seed.ts
   ```

---

## Prisma Client Factory

All code must obtain a client via the factory — never instantiate directly:

```typescript
import { getPrismaClient } from '@/config/databases';
const prisma = getPrismaClient('admin'); // or 'game' | 'hub' | 'trade' | 'dating' | 'sports'
```
