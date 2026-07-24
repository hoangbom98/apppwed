import { AxiosInstance } from 'axios';
import type * as Yup from 'yup';

// ── AppConfig (used by AppDistributionPage) ───────────────────────────────
export interface AppConfig {
  name: string;
  developer: string;
  icon: string;
  tagline?: string;
  inAppPurchases?: boolean;
  rating: number;
  reviewsCount: string | number;
  ageLimit: number;
  downloads: string;
  category?: string;
  androidLink: string;
  iosLink: string;
  qrCodeUrl?: string;
  screenshots?: Array<{ url: string; alt?: string }>;
  description: string;
  features?: string[];
  reviews?: Array<{ author: string; rating: number; date: string; body: string; avatar?: string }>;
  version?: string;
  size?: string;
  updatedAt?: string;
  primaryColor?: string;
}

// ── Shared exports ────────────────────────────────────────────────────────
declare module '@ui' {
  // API
  export const api: AxiosInstance;

  // App distribution
  export const AppDistributionPage: React.FC<{ appData: AppConfig }>;

  // Smart download components
  export const DownloadButton: React.FC<{
    androidLink: string;
    iosLink: string;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    primaryColor?: string;
    style?: object;
    className?: string;
    onSuccess?: () => void;
  }>;
  export const DownloadModal: React.FC<{
    open: boolean;
    onClose: () => void;
    appName?: string;
    appIcon?: string;
    androidLink: string;
    iosLink: string;
    qrCodeUrl?: string;
    primaryColor?: string;
  }>;

  // Components
  export const Button: any;
  export const Card: any;
  export const Modal: any;
  export const Toast: any;
  export const Pagination: any;
  export const Skeleton: any;
  export const Badge: any;
  export const Spinner: any;
  export const Input: any;
  export const Select: any;
  export const Textarea: any;
  export const FormField: any;
  export const PageHeader: any;
  export const EmptyState: any;
  export const DataTable: any;
  export const H5Layout: any;
  export const H5Header: any;
  export const H5BottomNav: any;

  // Payment components
  export const GatewaySelector: any;
  export const DepositInstructions: any;
  export const WalletBalance: any;
  export const WithdrawForm: any;
  export const TransactionHistory: any;

  // U Station additions
  export const PaymentSelector: React.FC<{
    type: 'deposit' | 'withdraw';
    onSelect: (code: string, gateway: any) => void;
    selected?: string | null;
    filter?: string[];
    className?: string;
  }>;
  export const USDTDeposit: React.FC<{
    onSuccess?: (orderId: string) => void;
    minAmount?: number;
  }>;
  export const MultiWithdraw: React.FC<{
    balance?: number;
    minAmount?: number;
    onSuccess?: (orderId: string) => void;
  }>;
  export const OptimisticImage: React.FC<{
    src: string | null | undefined;
    alt?: string;
    placeholder?: string;
    fallback?: string;
    loadingClassName?: string;
    loadedClassName?: string;
    wrapperClassName?: string;
    className?: string;
    loading?: 'lazy' | 'eager';
    [key: string]: any;
  }>;

  // Support / Knowledge
  export const ChatRoom: any;
  export const TicketForm: any;
  export const TicketList: any;
  export const ArticleList: any;
  export const ArticleDetail: any;

  // Notifications
  export const NotificationBadge: any;
  export const NotificationDrawer: any;

  // Hooks
  // AutoComplete
  export interface AutoCompleteItem {
    id: string;
    label: string;
    value: any;
    category?: string;
    image?: string | null;
    score?: number;
  }
  export const AutoComplete: React.FC<{
    value: string;
    onChange: (v: string) => void;
    onSelect: (item: AutoCompleteItem) => void;
    apiPrefix: string;
    source?: string;
    placeholder?: string;
    inputClassName?: string;
    className?: string;
    minChars?: number;
    maxResults?: number;
    debounceMs?: number;
    cache?: boolean;
    renderItem?: (item: AutoCompleteItem, active: boolean) => React.ReactNode;
  }>;
  export function useAutoComplete(query: string, options: {
    apiPrefix: string;
    source?: string;
    minChars?: number;
    maxResults?: number;
    debounceMs?: number;
    cache?: boolean;
  }): { results: any[]; flatItems: AutoCompleteItem[]; isLoading: boolean; hasResults: boolean };

  export function useAuth(): any;
  export function useToast(): any;
  export function useMediaQuery(query: string): boolean;
  export function useDebounce<T>(value: T, delay?: number): T;
  export function useSocket(): any;
  export function getSocket(): any;
  export function useDeviceOS(): 'android' | 'ios' | 'desktop' | 'unknown';
  export function useUnreadCount(): number;
  export function useAppConfig(key?: string): { data: any; isLoading: boolean };
  export function applyColorConfig(colors: any): void;
  export function usePWADownload(opts: { androidLink: string; iosLink: string }): {
    os: 'android' | 'ios' | 'desktop' | 'unknown';
    mode: 'pwa-install' | 'android' | 'ios' | 'desktop' | 'unknown';
    isPWAInstallable: boolean;
    isInstalled: boolean;
    showIOSSafariGuide: boolean;
    triggerInstall: () => Promise<boolean>;
    downloadLink: string;
    ctaLabel: string;
    ctaIcon: string;
  };
  export function useVirtualList(opts: {
    count: number;
    getScrollElement: () => HTMLElement | null;
    estimateSize: (index: number) => number;
    overscan?: number;
  }): { virtualItems: Array<{ index: number; start: number; end: number; size: number; key: number }>; totalHeight: number };
  export function useInfiniteScroll(opts: {
    onLoadMore: () => void | Promise<void>;
    hasMore: boolean;
    threshold?: number;
    rootMargin?: string;
    debounce?: number;
  }): { sentinelRef: React.RefObject<HTMLDivElement>; isFetching: boolean };
  export function useOptimisticMutation<TData = unknown, TError = Error, TVariables = void>(opts: {
    queryKey: readonly unknown[];
    mutationFn: (variables: TVariables) => Promise<TData>;
    onOptimisticUpdate: (currentData: any, variables: TVariables) => any;
    onSuccess?: (data: TData, variables: TVariables, context: any) => void;
    onRollback?: (error: TError, variables: TVariables) => void;
    [key: string]: any;
  }): import('@tanstack/react-query').UseMutationResult<TData, TError, TVariables, any>;
  export function useImageSrc(opts: {
    src: string | null | undefined;
    placeholder?: string;
    fallback?: string;
  }): { src: string; isLoaded: boolean; isError: boolean };
  export function usePrefetch<TData = unknown>(
    queryKey: readonly unknown[],
    fetcher: () => Promise<TData>,
    options?: { delay?: number; staleTime?: number }
  ): () => void;
  export function prefetchOnHover<TData = unknown>(
    queryClient: any,
    queryKey: readonly unknown[],
    fetcher: () => Promise<TData>,
    options?: { staleTime?: number }
  ): { onMouseEnter: () => void; onFocus: () => void };
  export function useOfflineStorage(): {
    get<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlMs?: number): Promise<void>;
    del(key: string): Promise<void>;
    enqueue(item: { endpoint: string; method: string; data: unknown; headers?: Record<string, string> }): Promise<void>;
    processQueue(): Promise<{ ok: number; failed: number }>;
  };
  export const offlineDb: any;

  // Skeleton variants
  export const Skeleton: React.FC<{ className?: string; rounded?: boolean; style?: object }>;
  export const CardSkeleton: React.FC;
  export const RowSkeleton: React.FC<{ cols?: number }>;
  export const GameCardSkeleton: React.FC;
  export const ListItemSkeleton: React.FC;
  export const AvatarSkeleton: React.FC<{ size?: number }>;

  // Stores
  export function useAuthStore(): {
    user: any;
    token: string | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login(credentials: object): Promise<any>;
    register(payload: object): Promise<any>;
    logout(): void;
    setAuth(user: any, accessToken: string, refreshToken?: string): void;
    clearAuth(): void;
    setUser(u: object): void;
    fetchProfile(): Promise<void>;
  };
  export function useWalletStore(): {
    balance: number;
    coins: number;
    diamonds: number;
    currency: string;
    isLoading: boolean;
    fetchBalance(): Promise<void>;
    setBalance(b: number): void;
    addCoins(n: number): void;
    spendCoins(n: number): void;
    updateBalance(b: number): void;
  };
  export function useUIStore(): {
    darkMode: boolean;
    sidebarOpen: boolean;
    activeTab: string;
    toggleDarkMode(): void;
    toggleSidebar(): void;
    setActiveTab(tab: string): void;
  };

  // ── Formatters ─────────────────────────────────────────────────────────
  export function formatVND(n: number | string): string;
  export function formatNumber(n: number | string): string;
  export function formatCoins(n: number): string;
  export function formatDecimal(n: number, decimals?: number): string;
  export function fmtPct(n: number): string;
  export function fmtVol(n: number): string;
  export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions): string;
  export function formatTime(d: string | Date): string;
  export function formatDateTime(d: string | Date): string;
  export function formatRelativeTime(d: string | Date): string;
  /** alias of formatRelativeTime */
  export function relativeTime(d: string | Date): string;
  export function formatDuration(seconds?: number | null): string;
  export function formatScore(home?: number | null, away?: number | null): string;
  export function formatDistance(meters: number): string;
  export function formatAge(dob: string): number;
  export function truncate(s: string, len?: number): string;
  export function clamp(val: number, min: number, max: number): number;

  // ── Validators (Yup schemas) ───────────────────────────────────────────
  export const emailField: any;
  export const passwordField: any;
  export const usernameField: any;
  export const phoneField: any;
  export function amountField(min?: number, label?: string): any;
  export const loginSchema: any;
  export const loginByUsernameSchema: any;
  export const registerSchema: any;
  export const passwordChangeSchema: any;
  export function depositSchema(min?: number): any;
  export function withdrawSchema(min?: number, maxBalance?: number): any;
  export const bankAccountSchema: any;

  // Types
  export type { AppConfig };
}

declare module '@ui/index' {
  export * from '@ui';
}
