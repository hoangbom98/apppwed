/**
 * @lkvip/types — src/api.types.ts
 *
 * HTTP API envelope types shared by backend controllers and all 6 frontend
 * API clients. Import via:
 *   import type { ApiResponse, PaginatedResponse } from '@lkvip/types';
 */

// ── Core response envelope ──────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success:    boolean;
  message?:   string;
  data?:      T;
  timestamp?: number;
}

/** Same as ApiResponse but `data` is guaranteed present on success */
export interface ApiOkResponse<T = unknown> {
  success:    true;
  data:       T;
  message?:   string;
  timestamp?: number;
}

export interface ApiErrorResponse {
  success:    false;
  message:    string;
  code?:      string;          // machine-readable error code, e.g. "INVALID_TOKEN"
  errors?:    FieldError[];
  timestamp?: number;
  stack?:     string;          // development only
}

export interface FieldError {
  field:   string;
  message: string;
  value?:  unknown;
}

// ── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface PaginatedResponse<T = unknown> {
  success:    boolean;
  data:       T[];
  meta:       PaginationMeta;
  timestamp?: number;
}

export interface PaginationQuery {
  page?:    number | string;
  limit?:   number | string;
  sortBy?:  string;
  sortDir?: 'asc' | 'desc';
  search?:  string;
}

// ── Auth endpoints ──────────────────────────────────────────────────────────

export interface LoginRequest {
  email?:    string;
  username?: string;
  password:  string;
  otp?:      string;   // for 2FA
}

export interface LoginResponse {
  access_token:  string;
  refresh_token: string;
  expires_in?:   number;
  user: {
    id:       number | string;
    username: string;
    email:    string;
    role:     string;
    project:  string;
    avatar?:  string | null;
  };
}

export interface RefreshTokenRequest  { refresh_token: string; }
export interface RefreshTokenResponse { access_token: string; refresh_token?: string; }

// ── Health & metrics ────────────────────────────────────────────────────────

export interface HealthResponse {
  status:   'healthy' | 'degraded' | 'unhealthy';
  version:  string;
  ts:       string;
  uptime:   string;
  memory: {
    rss:  string;
    heap: string;
  };
  requests: number;
  errors:   number;
  redis:    'connected' | 'unavailable';
  modules:  string[];
}

// ── Autocomplete ────────────────────────────────────────────────────────────

export interface AutoCompleteItem {
  id:        string | number;
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

// ── Notification types ──────────────────────────────────────────────────────

export type NotificationType =
  | 'system'
  | 'deposit'
  | 'withdraw'
  | 'win'
  | 'bet'
  | 'bonus'
  | 'vip'
  | 'kyc'
  | 'match'
  | 'message'
  | 'announcement'
  | 'alert';

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
  url?:   string;
  data?:  Record<string, unknown>;
}

// ── Socket.IO event payloads ────────────────────────────────────────────────

export interface ISocketBalanceUpdate {
  userId:   string | number;
  balance:  number;
  coins?:   number;
  diamonds?: number;
}

export interface ISocketNotificationEvent {
  notification: INotification;
}

export interface ISocketLiveScore {
  matchId:   string | number;
  homeScore: number;
  awayScore: number;
  minute:    number;
  status:    'live' | 'finished' | 'postponed';
}

export interface ISocketPriceUpdate {
  symbol:    string;
  price:     number;
  change24h: number;
  timestamp: number;
}

export interface ISocketTypingEvent {
  userId:     string | number;
  roomId:     string;
  isTyping:   boolean;
}

// ── Site config (public config returned by /api/shared/config) ──────────────

export interface ISiteConfig {
  site_name:        string;
  logo_url:         string;
  primary_color:    string;
  secondary_color:  string;
  android_link:     string;
  ios_link:         string;
  support_url?:     string | null;
  maintenance_mode: boolean;
  features:         Record<string, boolean>;
  contact?: {
    email?:   string;
    phone?:   string;
    zalo?:    string;
    telegram?: string;
  } | null;
}
