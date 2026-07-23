/**
 * @kjc/types — Shared TypeScript type declarations for KJC Multi-Project Platform
 *
 * Merged from source/shared-types (source/shared-types/src/index.ts +
 * source/shared-types/index.ts). The external package is no longer needed —
 * import directly from this file in any .ts / .tsx file.
 *
 * Backend (JSDoc): /** @type {import('../shared/types').IUser} *\/
 * Frontend (TS):   import type { IUser } from '../../backend/src/shared/types';
 */

// ─────────────────────────────────────────────────────────────────────────────
// Project identifiers
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectId = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin';
export type FrontendApp = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin-dashboard';

export declare const ALL_PROJECTS: ProjectId[];
export declare const ALL_FRONTEND_APPS: FrontendApp[];

/** Map from app name → dev server port */
export declare const APP_PORTS: Record<string, number>;

// ─────────────────────────────────────────────────────────────────────────────
// Device / PWA
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceOS = 'android' | 'ios' | 'desktop' | 'unknown';
export type DeviceType = 'Android' | 'iOS' | 'Desktop' | 'unknown';

export interface IDeviceInfo {
  type:     DeviceType;
  isMobile: boolean;
  /** True when running inside a Capacitor native WebView */
  isNative: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic API response envelope
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/** Alias with `error` field variant (used in frontend fetch wrappers) */
export interface IApiResponse<T = unknown> {
  success:     boolean;
  data?:       T;
  error?:      string;
  message?:    string;
  pagination?: IPagination;
}

export interface IPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data:    T[];
  meta: {
    total: number;
    page:  number;
    limit: number;
    pages: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

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

/** Minimal cross-project user shape */
export interface UserBasic {
  id:       string | number;
  username: string;
  email:    string;
  avatar?:  string | null;
  role:     string;
}

export interface JwtPayload {
  id:      number | string;
  email:   string;
  role:    string;
  project: string;
  iat:     number;
  exp:     number;
}

/** Alias with strict types */
export interface IJwtPayload {
  id:      number;
  email:   string;
  role:    UserRole;
  project: string;
  iat:     number;
  exp:     number;
}

export interface LoginCredentials {
  email?:    string;
  username?: string;
  password:  string;
}

export interface AuthTokens {
  accessToken:   string;
  refreshToken?: string;
}

export interface IAuthTokens {
  access_token:  string;
  refresh_token: string;
  expires_in?:   number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet / Financial
// ─────────────────────────────────────────────────────────────────────────────

export type TransactionType   = 'deposit' | 'withdraw' | 'bonus' | 'bet' | 'refund' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type CurrencyCode      = 'VND' | 'USD' | 'COIN' | 'DIAMOND';

export interface ITransaction {
  id:           string;
  type:         TransactionType;
  amount:       number;
  currency:     CurrencyCode;
  status:       TransactionStatus;
  description?: string;
  ref_id?:      string;
  created_at:   string | Date;
  updated_at?:  string | Date;
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

// ─────────────────────────────────────────────────────────────────────────────
// Payment gateway
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentGatewayCode = 'momo' | 'zalopay' | 'vnpay' | 'vietqr' | 'bank_transfer' | 'lkvip' | 'usdt' | 'okpay';

export interface IPaymentGateway {
  id:          number;
  name:        string;
  code:        PaymentGatewayCode;
  is_active:   boolean;
  min_amount:  number;
  max_amount:  number;
  fee_pct:     number;
  logo_url?:   string;
}

export interface IDepositRequest {
  amount:    number;
  gateway:   PaymentGatewayCode;
  currency?: CurrencyCode;
}

export interface IDepositResponse {
  order_id:     string;
  pay_url:      string;
  qr_code_url?: string;
  expires_at:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────────────────────────────────────

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

export interface PushNotificationPayload {
  title:  string;
  body:   string;
  icon?:  string;
  tag?:   string;
  data?:  Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Site / UI config
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// App Catalog  (Hub download page / admin dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export interface AppCatalogEntry {
  id:            number;
  appId:         string;
  name:          string;
  developer?:    string | null;
  category?:     string | null;
  iconUrl?:      string | null;
  primaryColor?: string | null;
  rating:        number;
  reviewsCount?: string | null;
  downloads?:    string | null;
  androidLink?:  string | null;
  iosLink?:      string | null;
  description?:  string | null;
  features?:     string[] | null;
  isPublished:   boolean;
  sortOrder:     number;
  createdAt:     string | Date;
  updatedAt:     string | Date;
}

/** snake_case alias (used by legacy code) */
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

// ─────────────────────────────────────────────────────────────────────────────
// AutoComplete
// ─────────────────────────────────────────────────────────────────────────────

export interface AutoCompleteItem {
  id:        string;
  label:     string;
  value:     unknown;
  category?: string;
  image?:    string | null;
  score?:    number;
}

export interface AutoCompleteResult {
  source: string;
  items:  AutoCompleteItem[];
  total:  number;
}

export interface AutoCompleteResponse {
  query:   string;
  results: AutoCompleteResult[];
  total:   number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket events
// ─────────────────────────────────────────────────────────────────────────────

export interface ISocketBalanceUpdate {
  userId:  string | number;
  balance: number;
  coins?:  number;
}

export interface ISocketNotification {
  notification: INotification;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI internal types  (used by source/backend/src/scripts/)
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthCheck {
  name:      string;
  path:      string;
  optional?: boolean;
}

export interface HealthResult {
  name:     string;
  status:   'ok' | 'error' | 'warn';
  code?:    number;
  message:  string;
  optional: boolean;
}

export interface EnvCheckResult {
  key:     string;
  status:  'ok' | 'missing' | 'warn';
  message: string;
}

export interface BuildResult {
  app:     FrontendApp;
  status:  'ok' | 'failed' | 'skipped';
  size?:   string;
}
