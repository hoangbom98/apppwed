# Service Layer Patterns & Background Workers — LKVIP Group

## AuthService

```typescript
class AuthService {
  constructor(private prisma: PrismaAdminClient, private redis: RedisClient) {}

  async register(data: RegisterDTO): Promise<User>
  async login(username: string, password: string, ip: string, userAgent: string): Promise<TokenPair>
  async refreshToken(refreshToken: string): Promise<TokenPair>
  async logout(accessToken: string): Promise<void>
}
```

## WalletService

Balances are split into three sub-wallets per user: `main`, `bonus`, `commission`.

```typescript
class WalletService {
  async getBalance(userId: string): Promise<WalletBalance>
  async credit(userId: string, amount: number, walletType: WalletType, description: string): Promise<Ledger>
  async debit(userId: string, amount: number, walletType: WalletType, description: string): Promise<Ledger>
  async transfer(
    fromUserId: string, toUserId: string,
    amount: number, fromWallet: WalletType, toWallet: WalletType,
    description: string
  ): Promise<void>
}
```

All credit/debit calls write to `Ledger` (immutable) and update `Wallet` balance atomically inside a Prisma `$transaction`.
Use `decimal.js` (from `@lkvip/utils`) for all monetary arithmetic — never `Number` or `BigInt` for money.

## PaymentService

```typescript
class PaymentService {
  async createDeposit(userId: string, amount: number, gateway: GatewayType): Promise<PaymentOrder>
  async handleWebhook(gateway: GatewayType, payload: unknown, signature: string): Promise<void>
  async completeDeposit(orderId: string, confirmedAmount: number): Promise<void>
  async createWithdraw(userId: string, amount: number, method: WithdrawMethod, accountInfo: AccountInfo): Promise<WithdrawOrder>
  async approveWithdraw(withdrawId: string, adminId: string): Promise<void>
  async rejectWithdraw(withdrawId: string, adminId: string, reason: string): Promise<void>
}
```

## ReferralService

```typescript
class ReferralService {
  async linkReferral(referrerId: string, referredId: string): Promise<Referral>
  async distributeCommission(triggeredByUserId: string, amount: number, source: CommissionSource): Promise<void>
  async getReferralTree(userId: string, depth?: number): Promise<ReferralNode[]>
}
```

Commission distribution walks up the referral chain (configurable depth from `Config` table) and credits the appropriate `commission` sub-wallet.

## InvestmentService

```typescript
class InvestmentService {
  async getAvailablePackages(): Promise<InvestmentPackage[]>
  async subscribe(userId: string, packageId: string, amount: number): Promise<InvestmentOrder>
  async settle(orderId: string): Promise<void>          // called by cron/worker on maturity date
  async earlyRedeem(orderId: string): Promise<void>     // penalty applies per package config
}
```

## NotificationService

```typescript
class NotificationService {
  async send(userId: string, type: NotificationType, payload: NotificationPayload): Promise<void>
  async markRead(notificationId: string): Promise<void>
  async markAllRead(userId: string): Promise<void>
  async getUnread(userId: string): Promise<Notification[]>
}
```

Uses Socket.IO `emit` for realtime delivery; falls back to DB insert for offline users.
Push notifications via Firebase Admin SDK (`firebase-admin`).

## PaymentAdapter Interface

Every gateway implements this contract. Factory: `src/shared/payment/PaymentFactory.ts`.

```typescript
interface PaymentAdapter {
  createDeposit(orderId: string, amount: number, currency: string): Promise<DepositResult>;
  checkStatus(txId: string): Promise<{ status: 'pending' | 'completed' | 'failed'; amount: number }>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
  verifySignature(payload: unknown, signature: string): boolean;
}

// Registered adapter keys (6 adapters in src/shared/payment/adapters/):
type GatewayType = 'MoMo' | 'USDT' | 'OKPay' | 'Pay818' | 'GoPay' | 'LKvipInternal';
```

## Background Jobs (BullMQ)

All scheduled or heavy async work goes into a named queue — never inline with `setTimeout`.
Workers live in `src/modules/workers/`. Each file is a self-contained BullMQ worker.

| Worker file | Queue / Trigger | Responsibility |
|---|---|---|
| `deposit-auto.worker.ts` | Deposit webhook / cron | Auto-process pending deposits, credit wallet |
| `withdraw-auto.worker.ts` | Cron | Auto-approve/reject withdrawals below threshold |
| `lottery-settlement.worker.ts` | After draw closes | Settle bets, calculate payouts, credit winners |
| `agent-settlement.worker.ts` | Cron: daily/weekly | Calculate & pay agent commissions |
| `rebate.worker.ts` | Cron: daily | Calculate rebate per user, write claimable records |
| `robot-bet.worker.ts` | Cron: every 30s | Simulate robot bets (liquidity, when `ENABLE_ROBOT_BETS=true`) |
| `fraud-auto.worker.ts` | Risk event bus | Auto-flag / suspend fraudulent accounts |
| `interest-payout.worker.ts` | Cron: daily | Pay interest on savings vault holdings |
| `savingsVault-interest.worker.ts` | Cron | Compound interest for savings vault |
| `telegram-bot.worker.ts` | Queue / events | Send Telegram notifications and alert messages |
| `ticket-auto.worker.ts` | Ticket events | Auto-respond / route support tickets |
| `health-monitor.worker.ts` | Cron | Check DB/Redis/queue health, alert on failure |
| `lkvip-webhook-retry.worker.ts` | Failed webhook queue | Retry failed outbound webhook calls |
| `test.worker.ts` | Manual trigger | Development/testing only |

## Shared Services (`src/shared/services/`)

Key services available across all modules. File layout: top-level files + subdirs `aggregators/`, `ai/`, `analytics/`, `auth/`, `communication/`, `content/`, `core/`, `finance/`, `support/`, `user/`.

| Service file | Purpose |
|---|---|
| `authService.ts` | Registration, login, JWT, 2FA |
| `walletService.ts` | Balance CRUD, credit/debit, transfer |
| `paymentService.ts` | Deposit/withdraw orchestration |
| `ledgerService.ts` | Immutable transaction ledger |
| `transactionService.ts` | Transaction history, search |
| `settlementService.ts` | Game/lottery settlement |
| `rebateService.ts` | Rebate calculation and payout |
| `loyaltyService.ts` | Loyalty points management |
| `vipEngineService.ts` | VIP tier upgrades and benefits |
| `referralService.ts` | Referral chain, commission distribution |
| `notificationService.ts` | In-app, push, email, SMS notifications |
| `pushService.ts` | Firebase push notifications (VAPID) |
| `emailService.ts` | Transactional email (SMTP / Google) |
| `smsService.ts` | SMS delivery (Twilio or provider) |
| `telegramAlertService.ts` | Telegram alerts to admin channels |
| `cacheService.ts` | Redis cache abstraction |
| `configService.ts` | Dynamic system config from DB |
| `kycService.ts` | KYC verification flow |
| `twoFactorService.ts` | TOTP 2FA setup and verification |
| `uploadService.ts` | File upload (local or S3) via `storageAdapter` |
| `storageAdapter.ts` | Storage backend abstraction (local / S3 / Supabase Storage) |
| `aiService.ts` | DeepSeek / OpenAI / Groq AI tasks |
| `translationService.ts` | Google Translate / i18n text translation |
| `analyticsService.ts` | Business analytics and reporting |
| `auditService.ts` / `auditLogger.service.ts` | Admin action audit trail |
| `riskService.ts` / `riskCheck.service.ts` | Risk scoring, AML, compliance checks |
| `whiteLabelService.ts` | Multi-brand / white-label support |
| `supportService.ts` / `supportChatService.ts` | Live chat and ticket management |
| `ticketService.ts` | Support ticket CRUD |
| `cmsService.ts` | CMS articles, banners, announcements |
| `bannerService.ts` | Banner CRUD across projects |
| `avatarService.ts` | User avatar upload & resize (Dicebear fallback) |
| `sessionService.ts` | User session tracking |
| `currencyService.ts` | Currency conversion utilities |
| `emailGuardService.ts` | Disposable email detection (HIBP) |
| `ipGuardService.ts` | IP reputation / AbuseIPDB blocking |
| `contentModerationService.ts` | AI-assisted content moderation (Perspective API) |
| `exportService.ts` | CSV/Excel export of reports |
| `archiveService.ts` | Data archiving for old records (S3/R2) |
| `taskService.ts` | Internal task/job scheduling helpers |
| `socketService.ts` | Socket.IO room/event helpers |
| `queueService.ts` | BullMQ queue management helpers |
| `supabaseClient.ts` | Supabase admin client (for external app operations) |
