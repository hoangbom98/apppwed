/**
 * @lkvip/types — src/common.types.ts
 *
 * Generic utility types reused throughout all projects.
 * Includes: sorting, filtering, pagination, status types, device types,
 * health/build checks, game types, and infrastructure types.
 */

// ── Project constants ────────────────────────────────────────────────────────

export type ProjectId = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin';

// ── Sorting & Filtering ──────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export type FilterOperator =
  | 'eq' | 'ne'
  | 'gt' | 'gte'
  | 'lt' | 'lte'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'in' | 'notIn';

export interface IFilter {
  field:    string;
  operator: FilterOperator;
  value:    unknown;
}

export interface ISort {
  field: string;
  order: SortOrder;
}

export interface IPaginationInput {
  page:     number;
  limit:    number;
  sortBy?:  string;
  sortDir?: SortOrder;
}

export interface IPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

// ── Generic type helpers ─────────────────────────────────────────────────────

/** Makes all keys of T optional and potentially null */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/** Omit multiple keys */
export type OmitMultiple<T, K extends keyof T> = Omit<T, K>;

/** Require at least one of the keys */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

/** Deep partial — makes all nested properties optional */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/** Readonly deep */
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

/** Extract keys of T whose values extend V */
export type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];

// ── Status types ─────────────────────────────────────────────────────────────

export type ActiveStatus = 'active' | 'inactive';
export type FullStatus   = 'active' | 'inactive' | 'suspended' | 'banned' | 'deleted';

// ── Date / time helpers ──────────────────────────────────────────────────────

export type DateLike = string | Date | number;

/** ISO 8601 timestamp string (for documentation purposes) */
export type ISODateString = string;

// ── Record helpers ───────────────────────────────────────────────────────────

export type StringRecord = Record<string, string>;
export type AnyRecord    = Record<string, unknown>;
export type NumberRecord = Record<string, number>;

// ── ID types ─────────────────────────────────────────────────────────────────

export type StringId = string;
export type NumberId = number;
export type AnyId    = string | number;

// ── Device & PWA ─────────────────────────────────────────────────────────────

export type DeviceOS   = 'android' | 'ios' | 'desktop' | 'unknown';
export type DeviceType = 'Android' | 'iOS' | 'Desktop' | 'unknown';

export interface IDeviceInfo {
  type:     DeviceType;
  os:       DeviceOS;
  isMobile: boolean;
  isNative: boolean;
  version?: string;
}

// ── Health checks (used by check-env.sh + first-deploy.sh) ──────────────────

export interface HealthCheck {
  name:          string;
  url:           string;
  status:        'ok' | 'error' | 'timeout';
  statusCode?:   number;
  responseTime?: number;
  error?:        string;
}

export interface HealthResult {
  passed: number;
  failed: number;
  checks: HealthCheck[];
}

export interface EnvCheckResult {
  missing:  string[];
  invalid:  string[];
  warnings: string[];
  passed:   boolean;
}

export interface BuildResult {
  app:       string;
  success:   boolean;
  duration:  number;
  distSize?: string;
  error?:    string;
}

// ── Game types ───────────────────────────────────────────────────────────────

export type GameProviderCode = 'gsc' | 'goldgate' | 'tc_gaming';
export type GameWalletType   = 'seamless' | 'transfer';
export type GameCategory     = 'slots' | 'casino' | 'live' | 'table' | 'lottery' | 'sports';

export interface IGameProvider {
  id:         number;
  code:       GameProviderCode;
  name:       string;
  wallet_type: GameWalletType;
  is_active:  boolean;
  logo_url?:  string | null;
  lobby_url?: string | null;
}

export interface IGameSession {
  session_id:  string;
  user_id:     number;
  provider:    GameProviderCode;
  game_id:     string;
  game_name?:  string;
  lobby_url:   string;
  started_at:  string | Date;
  ended_at?:   string | Date | null;
}

export interface IGameRound {
  id:        string;
  userId:    number;
  provider:  GameProviderCode;
  gameId:    string;
  gameName?: string;
  betAmount: number;
  winAmount: number;
  status:    'completed' | 'cancelled' | 'void';
  createdAt: string | Date;
}

// ── Sports betting types ─────────────────────────────────────────────────────

export type BetStatus   = 'pending' | 'won' | 'lost' | 'void' | 'settled' | 'cancelled';
export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';

export interface ILeague {
  id:       number;
  name:     string;
  slug:     string;
  country?: string;
  logo?:    string | null;
  season?:  string;
}

export interface ITeam {
  id:       number;
  name:     string;
  slug:     string;
  logo?:    string | null;
  country?: string;
}

export interface IMatch {
  id:          number;
  homeTeam:    ITeam;
  awayTeam:    ITeam;
  league?:     ILeague;
  homeScore?:  number | null;
  awayScore?:  number | null;
  status:      MatchStatus;
  matchDate:   string | Date;
}

export interface IBet {
  id:          string;
  userId:      number;
  matchId:     number;
  betType:     string;
  selection:   string;
  odds:        number;
  amount:      number;
  potentialWin: number;
  status:      BetStatus;
  createdAt:   string | Date;
  settledAt?:  string | Date | null;
}

// ── Trade / market types ─────────────────────────────────────────────────────

export type OrderSide   = 'buy' | 'sell';
export type OrderType   = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'open' | 'filled' | 'partial' | 'cancelled' | 'rejected';
export type PositionSide = 'long' | 'short';

export interface ITradePair {
  symbol:      string;
  baseAsset:   string;
  quoteAsset:  string;
  lastPrice:   number;
  change24h:   number;
  volume24h:   number;
  high24h:     number;
  low24h:      number;
}

export interface IOrder {
  id:        number | string;
  symbol:    string;
  side:      OrderSide;
  type:      OrderType;
  price:     number;
  quantity:  number;
  filled:    number;
  status:    OrderStatus;
  createdAt: string | Date;
}

export interface IPosition {
  id:           string;
  symbol:       string;
  side:         PositionSide;
  entryPrice:   number;
  currentPrice: number;
  quantity:     number;
  pnl:          number;
  pnlPercent:   number;
  leverage?:    number;
  liquidation?: number | null;
  openedAt:     string | Date;
}
