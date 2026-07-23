/**
 * @kjc/types — Shared TypeScript type definitions for KJC Multi-Project Platform
 *
 * Used by: backend (JSDoc), hub, game, trade, dating, sports, admin-dashboard
 *
 * Import pattern (after `npm run build` or via tsconfig paths):
 *   import type { IApp, IWallet } from '@kjc/types';
 */

// ====================================================================
// App / Catalog types  (used by Hub, Landing download page)
// ====================================================================

/** Represents one app entry in the KJC catalog */
export interface IApp {
  id:            number;
  app_id:        string;
  name:          string;
  developer:     string;
  category:      'game' | 'hub' | 'dating' | 'trade' | 'sports' | 'other';
  icon_url:      string;
  rating:        number;
  reviews_count: number;
  downloads:     string;
  android_link:  string | null;
  ios_link:      string | null;
  description:   string;
  is_published:  boolean;
  created_at?:   string | Date;
  updated_at?:   string | Date;
}

// ====================================================================
// Device / PWA types
// ====================================================================

export type DeviceType = 'Android' | 'iOS' | 'Desktop' | 'unknown';

export interface IDeviceInfo {
  type:     DeviceType;
  isMobile: boolean;
  /** True when running inside a Capacitor native WebView */
  isNative: boolean;
}

// ====================================================================
// Generic API response envelope
// ====================================================================

export interface IApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
  /** Present on paginated list responses */
  pagination?: IPagination;
}

export interface IPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

// ====================================================================
// Auth types
// ====================================================================

export type UserRole = 'user' | 'vip' | 'agent' | 'admin' | 'super_admin';

export interface IUser {
  id:         number;
  username:   string;
  email:      string;
  role:       UserRole;
  project:    string;
  avatar?:    string | null;
  is_active:  boolean;
  is_banned:  boolean;
  created_at: string | Date;
}

export interface IJwtPayload {
  id:      number;
  email:   string;
  role:    UserRole;
  project: string;
  iat:     number;
  exp:     number;
}

export interface IAuthTokens {
  access_token:  string;
  refresh_token: string;
  expires_in?:   number;
}

// ====================================================================
// Wallet / Financial types  (cross-cutting — used by game, hub, dating, trade, admin)
// ====================================================================

export type TransactionType = 'deposit' | 'withdraw' | 'bonus' | 'bet' | 'refund' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type CurrencyCode = 'VND' | 'USD' | 'COIN' | 'DIAMOND';

export interface ITransaction {
  id:          string;
  type:        TransactionType;
  amount:      number;
  currency:    CurrencyCode;
  status:      TransactionStatus;
  description?: string;
  ref_id?:     string;
  created_at:  string | Date;
  updated_at?: string | Date;
}

export interface IWallet {
  userId:       string;
  balance:      number;
  coins:        number;
  diamonds:     number;
  currency:     CurrencyCode;
  transactions: ITransaction[];
}

export interface IWalletBalance {
  balance:  number;
  coins:    number;
  diamonds: number;
  currency: CurrencyCode;
}

// ====================================================================
// Payment gateway types
// ====================================================================

export type PaymentGateway = 'momo' | 'zalopay' | 'vnpay' | 'vietqr' | 'bank_transfer';

export interface IPaymentGateway {
  id:         number;
  name:       string;
  code:       PaymentGateway;
  is_active:  boolean;
  min_amount: number;
  max_amount: number;
  fee_pct:    number;
  logo_url?:  string;
}

export interface IDepositRequest {
  amount:   number;
  gateway:  PaymentGateway;
  currency?: CurrencyCode;
}

export interface IDepositResponse {
  order_id:    string;
  pay_url:     string;
  qr_code_url?: string;
  expires_at:  string;
}

// ====================================================================
// Notification types
// ====================================================================

export type NotificationType = 'system' | 'promo' | 'transaction' | 'message' | 'alert';

export interface INotification {
  id:         string;
  type:       NotificationType;
  title:      string;
  body:       string;
  is_read:    boolean;
  created_at: string | Date;
  data?:      Record<string, unknown>;
}

// ====================================================================
// Config types  (used by ConfigProvider / useConfig)
// ====================================================================

export interface ISiteConfig {
  site_name:        string;
  logo_url:         string;
  primary_color:    string;
  secondary_color:  string;
  android_link:     string;
  ios_link:         string;
  support_url?:     string;
  maintenance_mode: boolean;
  features:         Record<string, boolean>;
}

// ====================================================================
// Socket events (shared between frontend + backend)
// ====================================================================

export interface ISocketBalanceUpdate {
  userId:  string | number;
  balance: number;
  coins?:  number;
}

export interface ISocketNotification {
  notification: INotification;
}
