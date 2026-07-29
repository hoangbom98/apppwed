// packages/shared-ui/src/index.ts
// Barrel export for @lkvip/ui / @ui alias

// ── Components ────────────────────────────────────────────────────────────────
export { default as BackToTop }      from './components/BackToTop';
export { default as ToastNotification } from './components/common/ToastNotification';
export type { ToastType }            from './components/common/ToastNotification';
export { default as DepositForm }    from './components/deposit/DepositForm';
export type { DepositConfig }        from './components/deposit/DepositForm';
export { default as Spinner }        from './components/Spinner';
export { Pagination, default as PaginationComp } from './components/Pagination';
export type { PaginationProps }      from './components/Pagination';
export { DownloadButton }            from './components/DownloadButton';
export { DownloadModal }             from './components/DownloadModal';
export { AppDistributionPage }       from './components/AppDistributionPage';
export { SentryErrorBoundary }       from './components/SentryErrorBoundary';
export { default as CskhPage }       from './components/CskhPage';
export type { CskhConfig, CskhButton } from './components/CskhPage';
export { ChatRoom }                  from './components/ChatRoom';
export { LkvipFooter }               from './components/LkvipFooter';
export { LkvipThemeWrapper }         from './components/LkvipThemeWrapper';
export { Logo, Banner, Icon }        from './components/AssetComponents';
export { default as ResponsiveImage } from './components/ResponsiveImage';
export type { ResponsiveImageProps, ImageAspect } from './components/ResponsiveImage';

// ── Icon Library ──────────────────────────────────────────────────────────────
// Centralised Lucide icon re-exports — import from here, NOT from 'lucide-react' directly.
export * from './components/IconLibrary';
export { LkvipLayout, LkvipSplitter, Flex } from './components/LayoutComponents';
export { LkvipGrid } from './components/GridComponents';
export {
  LkvipStatusTag, LkvipStatCard, LkvipTable, LkvipForm, LkvipInput, LkvipSelect,
  LkvipInputNumber, LkvipSidebarItem, LkvipSidebarGroup,
} from './components/AdminComponents';
export { TicketForm }                from './components/TicketForm';
export { TicketList }                from './components/TicketList';
export { ArticleDetail }             from './components/ArticleDetail';
export { ArticleList }               from './components/ArticleList';
export * from './components/Pro/AppProvider';
export * from './components/Pro/ProForm';
export * from './components/Pro/ProTable';
export * from './theme/antdTheme';

// ── Custom AutoComplete (extended wrapper that accepts our props + antd compat)
export { AutoComplete } from './components/AutoComplete';

// ── Hooks ─────────────────────────────────────────────────────────────────────
export * from './hooks/useAppConfig';
export * from './hooks/useDeviceOS';
export * from './hooks/useTradingViewSymbol';
export * from './hooks/useDebounce';
export * from './hooks/useToast';
export * from './hooks/useSocket';
export * from './hooks/useForm';

// ── Stores ────────────────────────────────────────────────────────────────────
export { useAuthStore, useUIStore, useWalletStore } from './stores/sharedStores';
export type { AuthState, AuthUser } from './stores/sharedStores';
// Note: AuthUser re-exported below is removed to avoid duplicate — keep only line above

// ── API ───────────────────────────────────────────────────────────────────────
export { api, buildFormData } from './api/apiClient';

// ── H5 components ─────────────────────────────────────────────────────────────
export { H5Header, H5BottomNav, H5Layout, useUnreadCount } from './components/H5';

// ── PWA helpers ───────────────────────────────────────────────────────────────
export { InstallPrompt }         from './pwa/install';
export { UpdateBanner }          from './pwa/update';
export type { AutoCompleteItem } from './pwa/autoComplete/useAutoComplete';
export { useAutoComplete }       from './pwa/autoComplete/useAutoComplete';

// ── Validators ────────────────────────────────────────────────────────────────
export {
  loginSchema, loginByUsernameSchema, registerSchema,
  passwordChangeSchema, depositSchema, withdrawSchema, bankAccountSchema,
  emailField, passwordField, usernameField, phoneField, amountField,
} from './validators';

// ── Formatters ────────────────────────────────────────────────────────────────
export {
  formatVND, formatNumber, formatDate, formatTime, formatDateTime,
  formatRelativeTime, relativeTime, formatDuration, formatScore,
  formatDistance, formatAge, truncate, clamp, formatCoins,
  formatDecimal, fmtPct, fmtVol,
} from './formatters';
