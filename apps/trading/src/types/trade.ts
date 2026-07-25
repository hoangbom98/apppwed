/**
 * trade/src/types/trade.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all frontend-specific DTOs used across
 * pages, stores, hooks and components.
 *
 * Rules:
 *  - Never use `any`. Use `unknown` + type narrowing where shape is uncertain.
 *  - Backend model fields are snake_case in DB but the API controller normalises
 *    them to camelCase — use camelCase here.
 *  - Always re-export from src/types/index.ts after adding here.
 */

// ── Market / Pairs ─────────────────────────────────────────────────────────────
export interface TradePair {
  id:           number;
  symbol:       string;
  baseAsset:    string;
  quoteAsset:   string;
  lastPrice:    number;
  priceChange:  number;   // percentage, e.g. 2.35 = +2.35%
  volume24h:    number;
  high24h:      number;
  low24h:       number;
}

// WebSocket price-update payload (subset of TradePair)
export type PriceUpdatePayload = Pick<
  TradePair,
  'symbol' | 'lastPrice' | 'priceChange' | 'volume24h' | 'high24h' | 'low24h'
>;

// ── Orders ─────────────────────────────────────────────────────────────────────
export type OrderSide   = 'buy' | 'sell';
export type OrderType   = 'market' | 'limit' | 'stop';
export type OrderStatus =
  | 'pending'
  | 'partial'
  | 'filled'
  | 'cancelled'
  | 'expired'
  | 'rejected'
  | 'open'; // legacy fallback

export interface TradeOrder {
  id:        number | string;
  symbol:    string;
  side:      OrderSide;
  type:      OrderType | string;
  price:     number;
  quantity:  number;
  filled:    number;
  status:    OrderStatus;
  createdAt: string;
}

export interface CreateOrderPayload {
  symbol:    string;
  side:      OrderSide;
  type:      OrderType;
  price?:    number;
  quantity:  number;
}

// ── Wallet / Balance ───────────────────────────────────────────────────────────
export interface AssetBalance {
  asset:  string;
  free:   number;
  locked: number;
}

export interface WalletSummary {
  balance: number | string;
  frozen:  number | string;
}

export interface WalletTx {
  id:           string | number;
  type:         string;
  amount:       number | string;
  balanceAfter: number | string;
  note?:        string;
  createdAt:    string;
}

export interface WithdrawPayload {
  amount:    number;
  method:    string;
  bankInfo?: { raw: string };
}

export interface DepositPayload {
  amount:   number;
  method:   string;
  note?:    string;
  txHash?:  string;
}

export interface DepositRecord {
  id:        string | number;
  amount:    number | string;
  method:    string;
  status:    'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ── Positions ──────────────────────────────────────────────────────────────────
export type PositionSide = 'long' | 'short';

export interface TradePosition {
  id:           string;
  symbol:       string | { code: string; baseAsset?: string };
  side:         PositionSide;
  entryPrice:   number | string;
  currentPrice: number | string;
  quantity:     number | string;
  pnl:          number | string;
  pnlPercent:   number | string;
  leverage:     number;
  liquidation:  number | null;
  openedAt:     string;
}

export interface Portfolio {
  totalBalance:       number;
  availableBalance:   number;
  unrealizedPnl:      number;
  totalPositionValue: number;
  winRate:            number;
}

// ── Portfolio API response shape ───────────────────────────────────────────────
export interface PortfolioApiData {
  balance:       number | string;
  frozen:        number | string;
  unrealisedPnl: number | string;
  openOrders:    number;
  positions:     TradePosition[];
  orders:        TradeOrder[];
}

// ── Investment packages ────────────────────────────────────────────────────────
export interface InvestmentPackage {
  id:          string;
  name:        string;
  description: string;
  dailyProfit: number;
  duration:    number;
  minAmount:   number | string;
  maxAmount?:  number | string;
}

export interface MyInvestment {
  id:          string;
  packageId:   string;
  amount:      number | string;
  profitPaid:  number | string;
  status:      'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt:   string;
  endDate:     string;
  package?:    InvestmentPackage;
}

// ── Referral ───────────────────────────────────────────────────────────────────
export interface ReferralSummary {
  f1Count:          number;
  f2Count:          number;
  totalCommission:  number;
}

export interface ReferralMember {
  id:         string | number;
  referredId: string;
  createdAt:  string;
  user?: {
    fullName?:  string;
    email?:     string;
    kycStatus?: string;
  };
}

export interface ReferralCommission {
  id:        string | number;
  level:     number;
  amount:    number | string;
  status:    'PAID' | 'PENDING' | string;
  createdAt: string;
}

// ── Notifications ──────────────────────────────────────────────────────────────
export type NotificationEventType =
  | 'order_filled'
  | 'kyc_update'
  | 'deposit'
  | 'withdraw'
  | 'price_alert'
  | 'margin_call'
  | 'system';

export interface TradeNotification {
  id:        string | number;
  type:      NotificationEventType | string;
  title:     string;
  content:   string;
  isRead:    boolean;
  createdAt: string;
}

// ── KYC ───────────────────────────────────────────────────────────────────────
export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface KycRecord {
  reviewedAt?: string;
  note?:       string;
}

export interface KycSubmitPayload {
  fullName: string;
  idNumber: string;
  idType:   string;
  address:  string;
  idFront:  string;
  idBack:   string;
  selfie:   string;
}

// ── User profile ───────────────────────────────────────────────────────────────
export interface TradeUserProfile {
  id:         string;
  email:      string;
  fullName?:  string;
  phone?:     string;
  kycStatus?: KycStatus | 'verified' | 'none';
}

// ── Yuebao (Money Market) ──────────────────────────────────────────────────────
export interface YuebaoProduct {
  id:           string;
  title:        string;
  description?: string;
  interestRate: number | string; // total interest rate for the period
  days:         number;
  minAmount:    number | string;
  maxAmount:    number | string;
  stars:        number;
  sortOrder:    number;
  status:       string;
}

export interface YuebaoInvestment {
  id:          string;
  productId:   string;
  amount:      number | string;
  profitPaid:  number | string;
  status:      'active' | 'completed' | 'cancelled' | string;
  endDate:     string;
  settledAt?:  string;
  createdAt:   string;
  product?:    Pick<YuebaoProduct, 'title' | 'interestRate' | 'days'>;
}

// ── Mining Machines ────────────────────────────────────────────────────────────
export interface MiningMachine {
  id:           string;
  title:        string;
  description?: string;
  image?:       string;
  price:        number | string;
  dayIncome:    number | string;
  cost:         number | string;
  duration:     number;       // days, 0 = unlimited
  totalStock:   number;
  stock:        number;
  perUserLimit: number;
  sortOrder:    number;
  status:       string;
}

export interface MiningInvestment {
  id:        string;
  machineId: string;
  quantity:  number;
  deposit:   number | string;
  dayIncome: number | string;
  status:    'active' | 'completed' | 'cancelled' | string;
  endDate?:  string;
  createdAt: string;
  machine?:  Pick<MiningMachine, 'title' | 'dayIncome'>;
}

// ── Prize Draw ─────────────────────────────────────────────────────────────────
export interface PrizeConfig {
  id:          string;
  title:       string;
  description?: string;
  prizeAmount: number | string;
  costPoints:  number;
  stock:       number;       // -1 = unlimited
  sortOrder:   number;
  status:      string;
}

export interface PrizeRecord {
  id:          string;
  prizeId:     string;
  status:      string;
  createdAt:   string;
  prize?:      Pick<PrizeConfig, 'title' | 'prizeAmount'>;
}

// ── Shop (Points Exchange) ─────────────────────────────────────────────────────
export interface ShopItem {
  id:          string;
  title:       string;
  description?: string;
  image?:      string;
  pointsCost:  number;
  stock:       number;
  status:      string;
  sortOrder:   number;
}

export interface ShopOrder {
  id:        string;
  itemId:    string;
  quantity:  number;
  status:    string;
  createdAt: string;
  item?:     Pick<ShopItem, 'title' | 'pointsCost'>;
}

// ── Watchlist ──────────────────────────────────────────────────────────────────
export interface WatchlistItem {
  id:       string;
  name:     string;
  items:    WatchlistSymbol[];
}

export interface WatchlistSymbol {
  id:       string;
  symbolId: string;
  symbol?:  { code: string; name?: string };
}

// ── API envelope helper ────────────────────────────────────────────────────────
export interface ApiEnvelope<T = unknown> {
  success:  boolean;
  data:     T;
  message?: string;
  meta?: {
    total:    number;
    page:     number;
    pageSize: number;
  };
}
