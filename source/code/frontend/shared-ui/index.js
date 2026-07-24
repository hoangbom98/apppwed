// frontend/shared-ui/index.js
// Barrel export for all shared UI components, hooks, stores, and utilities.

// ── TradingView ──────────────────────────────────────────────────────────────
export { TradingViewWidget } from './src/components/TradingView/TradingViewWidget.tsx';
export { useTradingViewSymbol } from './src/hooks/useTradingViewSymbol.ts';
export * from './src/utils/tradingview.ts';

// ── Pro Components ────────────────────────────────────────────────────────────
export { AppProvider } from './src/components/Pro/AppProvider.tsx';
export { ProTable } from './src/components/Pro/ProTable.tsx';
export { ProForm } from './src/components/Pro/ProForm.tsx';

// App distribution (App Store / Play Store style download page)
export { AppDistributionPage, AppDistributionPage as default_AppDistributionPage } from './components/AppDistributionPage';
export { DownloadButton }  from './components/DownloadButton';
export { DownloadModal }   from './components/DownloadModal';

// ── Base Components ───────────────────────────────────────────────────────────
export { default as Button }        from './components/Button';
export { default as Card }          from './components/Card';
export { default as Modal }         from './components/Modal';
export { default as Toast }         from './components/Toast';
export { default as Pagination }    from './components/Pagination';
// export { default as Skeleton }      from './components/Skeleton'; // <-- Đã xóa dòng trùng
export { default as Badge }         from './components/Badge';
export { default as Spinner }       from './components/Spinner';
export { default as BackToTop }     from './components/BackToTop';
export { default as SearchBar }     from './components/SearchBar';
export { default as Tabs }          from './components/Tabs';
export { default as Table }         from './components/Table';
export { default as Avatar }        from './components/Avatar';
export { default as Progress }      from './components/Progress';
export { default as Rating }        from './components/Rating';
export { default as Breadcrumb }    from './components/Breadcrumb';
export { default as Checkbox }      from './components/Checkbox';
export { default as Switch }        from './components/Switch';
export { default as ErrorBoundary } from './components/ErrorBoundary';
// ── Form Components ───────────────────────────────────────────────────────────
export { default as Input }      from './components/Form/Input';
export { default as Select }     from './components/Form/Select';
export { default as Textarea }   from './components/Form/Textarea';
export { default as FormField }  from './components/Form/FormField';

// ── Layout Components ─────────────────────────────────────────────────────────
export { default as PageHeader }  from './components/Layout/PageHeader';
export { default as EmptyState }  from './components/Layout/EmptyState';
export { default as DataTable }   from './components/Layout/DataTable';
export { default as H5Layout }    from './components/Layout/H5Layout';
export { H5Header, H5BottomNav } from './components/Layout';
export { default as MainLayout }  from './components/Layout/MainLayout';
export { default as AdminLayout } from './components/Layout/AdminLayout';

// ── Auth Components ───────────────────────────────────────────────────────────
export { default as LoginForm }    from './components/auth/LoginForm';
export { default as RegisterForm } from './components/auth/RegisterForm';

// Payment components
export { default as GatewaySelector }     from './components/payment/GatewaySelector';
export { default as DepositInstructions } from './components/payment/DepositInstructions';
export { default as WalletBalance }       from './components/payment/WalletBalance';
export { default as WithdrawForm }        from './components/payment/WithdrawForm';
export { default as TransactionHistory }  from './components/payment/TransactionHistory';
// U Station payment additions
export { PaymentSelector }   from './components/payment/PaymentSelector';
export { USDTDeposit }       from './components/payment/USDTDeposit';
export { MultiWithdraw }     from './components/payment/MultiWithdraw';

// Support
export { default as ChatRoom }   from './components/Support/ChatRoom';
export { default as TicketForm } from './components/Support/TicketForm';
export { default as TicketList } from './components/Support/TicketList';

// Knowledge
export { default as ArticleList }   from './components/Knowledge/ArticleList';
export { default as ArticleDetail } from './components/Knowledge/ArticleDetail';

// Notifications
export { default as NotificationBadge }  from './components/Notification/NotificationBadge';
export { default as NotificationDrawer } from './components/Notification/NotificationDrawer';

// ── PWA ──────────────────────────────────────────────────────────────────────
export { ServiceWorkerManager } from './pwa/serviceWorker/ServiceWorkerManager';
export { useServiceWorker }     from './pwa/serviceWorker/useServiceWorker';
export { useInstallPrompt }     from './pwa/install/useInstallPrompt';
export { InstallPrompt }        from './pwa/install/InstallPrompt';
export { useNetworkStatus, useOffline } from './pwa/network/useNetworkStatus';
export { UpdateBanner }         from './pwa/update/UpdateBanner';
export { AutoComplete }         from './pwa/autoComplete/AutoComplete';
export { useAutoComplete }      from './pwa/autoComplete/useAutoComplete';
// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useAuth }                  from './hooks/useAuth';
export { usePWADownload }           from './hooks/usePWADownload';
export { useVirtualList }           from './hooks/useVirtualList';
export { useInfiniteScroll }        from './hooks/useInfiniteScroll';
export { useOfflineStorage, offlineDb } from './hooks/useOfflineStorage';
export { useToast }                 from './hooks/useToast';
export { useMediaQuery }            from './hooks/useMediaQuery';
export { useDebounce }              from './hooks/useDebounce';
export { useSocket, getSocket }     from './hooks/useSocket';
export { useDeviceOS }              from './hooks/useDeviceOS';
export { useAppConfig, applyColorConfig } from './hooks/useAppConfig';
export { useLocalStorage }          from './hooks/useLocalStorage';
export { useClickOutside }          from './hooks/useClickOutside';
export { useApi }                   from './hooks/useApi';
export { usePagination }            from './hooks/usePagination';
export { useSort }                  from './hooks/useSort';
export { useUnreadCount }           from './hooks/useUnreadCount';
// ── Performance hooks ────────────────────────────────────────────────────────
export { useOptimisticMutation }    from './hooks/useOptimisticMutation';
export { useImageSrc }              from './hooks/useImageSrc';
export { usePrefetch, prefetchOnHover } from './hooks/usePrefetch';
// ── Tầng 6: New shared hooks ─────────────────────────────────────────────────
export { useWebSocket }             from './hooks/useWebSocket';
export { useBalance }               from './hooks/useBalance';

// Config context (ConfigProvider wraps app root; useConfig reads per-project flat map)
export { ConfigProvider, useConfig } from './contexts/ConfigContext';

// Stores
export { useAuthStore }   from './store/authStore';
export { useWalletStore } from './store/walletStore';
export { useUIStore }     from './store/uiStore';

// API client
export { default as api } from './api/client';

// Utils — constants
export * from './utils/constants';

// ── Skeleton variants ─────────────────────────────────────────────────────────
export { Skeleton, CardSkeleton, RowSkeleton, GameCardSkeleton, ListItemSkeleton, AvatarSkeleton } from './components/Skeleton';

// Utils — formatters (gộp từ game/dating/sports/trade)
export * from './utils/formatters';

// Utils — validators / Yup schemas (dùng chung)
export * from './utils/validators';
