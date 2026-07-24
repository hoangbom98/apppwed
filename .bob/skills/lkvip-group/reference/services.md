# Service Layer Patterns — LKVIP Group

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

Uses socket.io `emit` for realtime delivery; falls back to DB insert for offline users.

## PaymentAdapter Interface

Every gateway implements this contract. Register via `AdapterRegistry.register(gateway, adapter)`.

```typescript
interface PaymentAdapter {
  createDeposit(orderId: string, amount: number, currency: string): Promise<DepositResult>;
  checkStatus(txId: string): Promise<{ status: 'pending' | 'completed' | 'failed'; amount: number }>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
  verifySignature(payload: unknown, signature: string): boolean;
}

type GatewayType = 'USDT' | 'Bank' | 'Momo' | 'LKvip' | 'VNPay';
```

## Background Jobs (BullMQ)

All scheduled or heavy async work goes into a named queue — never inline with `setTimeout`.

| Queue name | Trigger | Worker responsibility |
|---|---|---|
| `payment.webhook` | Gateway POST webhook | Verify sig → complete deposit → credit wallet → trigger commission |
| `investment.settle` | Cron: daily | Find matured orders → settle → credit wallet |
| `notification.send` | Event bus | Deliver notification via socket / email / SMS |
| `referral.commission` | After deposit confirmed | Walk referral chain → credit commissions |

Workers live in `src/jobs/`. Each worker file exports a single `registerWorker(queue: Queue)` function.
