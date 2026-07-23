/**
 * shared-types/src/index.ts
 * ──────────────────────────
 * Shared TypeScript type definitions used across all 6 frontend SPAs.
 * Import via: import type { User, Project, ... } from '@lkvip/types'
 */

// ── Projects ──────────────────────────────────────────────────────────────────
export type Project = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin';

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id:           number;
  username:     string;
  email:        string;
  full_name?:   string | null;
  avatar?:      string | null;
  phone?:       string | null;
  role:         'user' | 'admin' | 'super_admin' | 'moderator';
  is_active:    boolean;
  is_banned:    boolean;
  is_verified?: boolean;
  project:      Project;
  created_at:   string;
  updated_at?:  string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  user:           User;
  access_token:   string;
  refresh_token?: string;
  token?:         string; // legacy alias
}

export interface LoginCredentials {
  email?:    string;
  username?: string;
  password:  string;
}

export interface RegisterPayload {
  username:       string;
  email:          string;
  password:       string;
  full_name?:     string;
  phone?:         string;
  referral_code?: string;
}

// ── Wallet ────────────────────────────────────────────────────────────────────
export interface WalletBalance {
  balance:   number;
  coins:     number;
  diamonds:  number;
  currency:  string;
}

// ── Payment Gateway ───────────────────────────────────────────────────────────
export interface PaymentGateway {
  code:     string;
  name:     string;
  type:     'bank' | 'crypto' | 'ewallet' | 'card';
  is_active: boolean;
  limits?: {
    min?: number;
    max?: number;
  };
  fee_rate?: number;
}

// ── Transaction ───────────────────────────────────────────────────────────────
export type TransactionType   = 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus' | 'cashback' | 'transfer';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id:           number | string;
  type:         TransactionType;
  status:       TransactionStatus;
  amount:       number;
  fee?:         number;
  currency:     string;
  description?: string;
  created_at:   string;
  updated_at?:  string;
}

// ── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success:  boolean;
  message?: string;
  data:     T;
  meta?: {
    page?:       number;
    limit?:      number;
    total?:      number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  items:       T[];
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
}

// ── Notification ──────────────────────────────────────────────────────────────
export interface Notification {
  id:          number | string;
  type:        string;
  title:       string;
  body:        string;
  is_read:     boolean;
  created_at:  string;
  data?:       Record<string, unknown>;
}

// ── Site Config ───────────────────────────────────────────────────────────────
export interface SiteConfig {
  site_name?:        string;
  site_logo?:        string;
  primary_color?:    string;
  secondary_color?:  string;
  accent_color?:     string;
  maintenance_mode?: boolean;
  contact_email?:    string;
  [key: string]:     unknown;
}

// ── VIP ──────────────────────────────────────────────────────────────────────
export interface VipPlan {
  id:         number;
  name:       string;
  price:      number;
  duration:   number; // days
  benefits:   string[];
  is_active:  boolean;
}

// ── Promotion ─────────────────────────────────────────────────────────────────
export interface Promotion {
  id:           number;
  title:        string;
  description?: string;
  image?:       string;
  type:         string;
  is_active:    boolean;
  starts_at?:   string;
  ends_at?:     string;
}
