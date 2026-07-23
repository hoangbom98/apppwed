/**
 * shared-types/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Types dùng chung giữa Frontend và Backend.
 * Import: import type { AppCatalogEntry, ApiResponse } from '@kjc/types'
 */

// ── API response wrapper ────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ── App Catalog ─────────────────────────────────────────────────────────────
export interface AppCatalogEntry {
  id: number;
  appId: string;          // 'game' | 'dating' | 'sports' | 'trade'
  name: string;
  developer?: string | null;
  category?: string | null;
  iconUrl?: string | null;
  primaryColor?: string | null;
  rating: number;
  reviewsCount?: string | null;
  downloads?: string | null;
  androidLink?: string | null;
  iosLink?: string | null;
  description?: string | null;
  features?: string[] | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ── Device OS ───────────────────────────────────────────────────────────────
export type DeviceOS = 'android' | 'ios' | 'desktop' | 'unknown';

// ── Auth ────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  id: number | string;
  email: string;
  role: string;
  project: string;
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// ── AutoComplete ─────────────────────────────────────────────────────────────
export interface AutoCompleteItem {
  id: string;
  label: string;
  value: unknown;
  category?: string;
  image?: string | null;
  score?: number;
}

export interface AutoCompleteResult {
  source: string;
  items: AutoCompleteItem[];
  total: number;
}

export interface AutoCompleteResponse {
  query: string;
  results: AutoCompleteResult[];
  total: number;
}

// ── User (minimal cross-project) ────────────────────────────────────────────
export interface UserBasic {
  id: string | number;
  username: string;
  email: string;
  avatar?: string | null;
  role: string;
}

// ── Notification ─────────────────────────────────────────────────────────────
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

// ── Project IDs (enum-like) ──────────────────────────────────────────────────
export type ProjectId = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin';

export const PROJECT_IDS: ProjectId[] = ['hub', 'game', 'trade', 'dating', 'sports', 'admin'];
