// frontend/admin-dashboard/src/core/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { lazy, Suspense, type ReactNode } from 'react';
import AdminLayout    from '../layouts/AdminLayout';
import AuthLayout     from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// ── Critical path: eager-loaded ──
import Login     from '@admin/modules/auth/pages/Login';
import Dashboard from '@admin/modules/shared/pages/Dashboard';

// ── Helpers ────────────────────────────────────────────────────────────────────
const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[400px] opacity-50">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
      <span className="text-sm font-medium tracking-wider uppercase">Đang tải...</span>
    </div>
  </div>
);

function lazyPage(importFn: () => Promise<{ default: React.ComponentType }>): ReactNode {
  const Component = lazy(importFn);
  return <Suspense fallback={<PageFallback />}><Component /></Suspense>;
}

// ── Shared Page Components ─────────────────────────────────────────────────────
const RolesPage        = () => lazyPage(() => import('@admin/modules/shared/pages/RolesPage'));
const RebatePage       = () => lazyPage(() => import('@admin/modules/shared/pages/RebatePage'));
const AdminIMPage      = () => lazyPage(() => import('@admin/modules/shared/pages/AdminIMPage'));
const Users            = () => lazyPage(() => import('@admin/modules/shared/pages/Users'));
const ProjectUsers     = () => lazyPage(() => import('@admin/modules/shared/pages/ProjectUsers'));
const Transactions     = () => lazyPage(() => import('@admin/modules/shared/pages/Transactions'));
const Finance          = () => lazyPage(() => import('@admin/modules/shared/pages/Finance'));
const Config           = () => lazyPage(() => import('@admin/modules/shared/pages/Config'));
const GeneralConfig    = () => lazyPage(() => import('@admin/modules/shared/pages/GeneralConfig'));
const AdminSettings         = () => lazyPage(() => import('@admin/modules/shared/pages/AdminSettings'));
const AdminUserManagement   = () => lazyPage(() => import('@admin/modules/shared/pages/AdminUserManagement'));
const SecuritySettings = () => lazyPage(() => import('@admin/modules/shared/pages/SecuritySettings'));
const PaymentGateways  = () => lazyPage(() => import('@admin/modules/shared/pages/PaymentGateways'));
const Announcements    = () => lazyPage(() => import('@admin/modules/shared/pages/Announcements'));
const RiskAudit        = () => lazyPage(() => import('@admin/modules/shared/pages/RiskAudit'));
const MinePage         = () => lazyPage(() => import('@admin/modules/shared/pages/MinePage'));
const SystemPage       = () => lazyPage(() => import('@admin/modules/shared/pages/SystemPage'));
const AgentsPage       = () => lazyPage(() => import('@admin/modules/shared/pages/AgentsPage'));
const PromotionPage    = () => lazyPage(() => import('@admin/modules/shared/pages/PromotionPage'));
const MonitorPage      = () => lazyPage(() => import('@admin/modules/shared/pages/MonitorPage'));
const AuditLogPage     = () => lazyPage(() => import('@admin/modules/shared/pages/AuditLogPage'));
const RealtimePage     = () => lazyPage(() => import('@admin/modules/realtime/RealtimeLayout'));

// ── Settings extended pages ────────────────────────────────────────────────────
const IntegrationSettingsPage   = () => lazyPage(() => import('@admin/modules/settings/pages/IntegrationSettings'));
const GeneralSettingsPage       = () => lazyPage(() => import('@admin/modules/settings/pages/GeneralSettings'));
const ConnectionsPage           = () => lazyPage(() => import('@admin/modules/settings/pages/ConnectionsPage'));
const NotificationTemplatesPage = () => lazyPage(() => import('@admin/modules/settings/pages/NotificationTemplatesPage'));
const CronJobsPage              = () => lazyPage(() => import('@admin/modules/settings/pages/CronJobsPage'));
const WidgetsPage               = () => lazyPage(() => import('@admin/modules/settings/pages/WidgetsPage'));
const TelegramBroadcastPage     = () => lazyPage(() => import('@admin/modules/settings/pages/TelegramBroadcastPage'));
const TelegramAutoReplyPage     = () => lazyPage(() => import('@admin/modules/settings/pages/TelegramAutoReplyPage'));

// ── Unified Project Users Component ────────────────────────────────────────────
const UnifiedUsers = lazy(() => import('@admin/modules/shared/pages/ProjectUsersPage'));

interface ProjectUserPageProps {
  project: string;
  title: string;
  columns: Array<{ key: string; label: string; render?: (v: unknown, row: unknown) => ReactNode }>;
}

const ProjectUserPage = ({ project, title, columns }: ProjectUserPageProps) => (
  <Suspense fallback={<PageFallback />}>
    <UnifiedUsers project={project} title={title} columns={columns} />
  </Suspense>
);

// ── Column Configurations for Unified Users ───────────────────────────────────
const DATING_COLUMNS = [
  { key: 'isVip', label: 'VIP', render: (v: unknown) => (v as boolean) ? <span className="text-pink-400 font-bold">YES</span> : '—' },
  { key: 'coins', label: 'Coins', render: (v: unknown) => <span className="text-amber-400 font-mono font-bold">{Number(v || 0).toLocaleString()}</span> },
];

const GAME_COLUMNS = [
  { key: 'role', label: 'Vai trò' },
  {
    key: 'wallets',
    label: 'Số dư VND',
    render: (v: unknown) => {
      const wallets = v as Array<{ currency: string; balance: number }> | undefined;
      const balance = wallets?.find(w => w.currency === 'VND')?.balance ?? 0;
      return <span className="text-emerald-400 font-mono font-bold">{balance.toLocaleString('vi')} ₫</span>;
    }
  },
];

const TRADE_COLUMNS = [
  { key: 'kycLevel', label: 'KYC Level', render: (v: unknown) => `Level ${(v as number) || 0}` },
];

const SPORTS_COLUMNS = [
  { key: 'totalBets', label: 'Tổng cược', render: (v: unknown) => Number(v || 0).toLocaleString() },
];

// ── Route definitions ──────────────────────────────────────────────────────────
const ADMIN_CHILD_ROUTES = [
  { index: true,               element: <Dashboard /> },
  { path: 'users',             element: <Users /> },
  { path: 'members',           element: <ProjectUsers /> },
  // ── Group Finance ─────────────────────────────────────────────────────────
  { path: 'group-finance',         element: lazyPage(() => import('@admin/modules/finance/GroupFinanceDashboard')) },
  { path: 'group-finance/fee-cfg', element: lazyPage(() => import('@admin/modules/finance/FeeConfigPage'))        },
  { path: 'group-finance/loans',   element: lazyPage(() => import('@admin/modules/finance/InternalLoansPage'))    },
  // ── Legacy finance (deposit/withdraw approval) ────────────────────────────
  { path: 'finance',           element: <Finance /> },
  { path: 'transactions',      element: <Transactions /> },
  { path: 'announcements',     element: <Announcements /> },
  { path: 'risk',              element: <RiskAudit /> },
  { path: 'agents',            element: <AgentsPage /> },
  { path: 'promotions',        element: <PromotionPage /> },
  { path: 'monitor',           element: <MonitorPage /> },
  { path: 'logs',              element: <AuditLogPage /> },
  { path: 'realtime',          element: <RealtimePage /> },
  { path: 'config',            element: <Config /> },
  { path: 'config/general',    element: <GeneralConfig /> },
  { path: 'settings',          element: <AdminSettings /> },
  { path: 'settings/security', element: <SecuritySettings /> },
  { path: 'settings/admins',   element: <AdminUserManagement /> },
  { path: 'settings/system',   element: <SystemPage /> },
  { path: 'payment-gateways',  element: <PaymentGateways /> },
  { path: 'mine',              element: <MinePage /> },
  { path: 'rebates',           element: <RebatePage /> },
  { path: 'im',                element: <AdminIMPage /> },
  { path: 'settings/roles',    element: <RolesPage /> },

  // Hub
  { path: 'games',             element: lazyPage(() => import('@admin/modules/hub/pages/AdminGamesPage')) },
  { path: 'categories',        element: lazyPage(() => import('@admin/modules/hub/pages/AdminCategoriesPage')) },
  { path: 'websites',          element: lazyPage(() => import('@admin/modules/hub/pages/AdminWebsitesPage')) },
  { path: 'tools',             element: lazyPage(() => import('@admin/modules/hub/pages/AdminToolsPage')) },
  { path: 'news',              element: lazyPage(() => import('@admin/modules/hub/pages/AdminNewsPage')) },
  { path: 'pages',             element: lazyPage(() => import('@admin/modules/hub/pages/AdminPagesPage')) },
  { path: 'banners',           element: lazyPage(() => import('@admin/modules/hub/pages/AdminBannersPage')) },
  { path: 'menus',             element: lazyPage(() => import('@admin/modules/hub/pages/AdminMenusPage')) },
  { path: 'feedbacks',         element: lazyPage(() => import('@admin/modules/hub/pages/AdminFeedbacksPage')) },
  { path: 'seo',               element: lazyPage(() => import('@admin/modules/hub/pages/AdminSeoPage')) },
  { path: 'hub/config',        element: lazyPage(() => import('@admin/modules/hub/pages/HubConfig')) },
  { path: 'app-catalog',       element: lazyPage(() => import('@admin/modules/hub/pages/AppCatalogPage')) },

  // Game
  { path: 'game/users',        element: <ProjectUserPage project="game" title="Game — Người dùng" columns={GAME_COLUMNS} /> },
  { path: 'game/deposits',     element: lazyPage(() => import('@admin/modules/game/pages/GameDepositsPage')) },
  { path: 'game/withdrawals',  element: lazyPage(() => import('@admin/modules/game/pages/GameWithdrawalsPage')) },
  { path: 'game/rounds',       element: lazyPage(() => import('@admin/modules/game/pages/GameRoundsPage')) },
  { path: 'game/providers',    element: lazyPage(() => import('@admin/modules/game/pages/GameProvidersPage')) },
  { path: 'game/config',       element: lazyPage(() => import('@admin/modules/game/pages/GameConfig')) },
  { path: 'game/lottery',      element: lazyPage(() => import('@admin/modules/game/pages/GameLotteryPage')) },
  { path: 'game/statistics',   element: lazyPage(() => import('@admin/modules/game/pages/GameStatisticsPage')) },
  { path: 'game/vip-config',   element: lazyPage(() => import('@admin/modules/game/pages/VipConfigPage')) },

  // Dating
  { path: 'dating/users',      element: <ProjectUserPage project="dating" title="Dating — Người dùng" columns={DATING_COLUMNS} /> },
  { path: 'dating/profiles',   element: lazyPage(() => import('@admin/modules/dating/pages/DatingProfilesPage')) },
  { path: 'dating/matches',    element: lazyPage(() => import('@admin/modules/dating/pages/DatingMatchesPage')) },
  { path: 'dating/gifts',      element: lazyPage(() => import('@admin/modules/dating/pages/DatingGiftsPage')) },
  { path: 'dating/moments',    element: lazyPage(() => import('@admin/modules/dating/pages/DatingMomentsPage')) },
  { path: 'dating/reports',    element: lazyPage(() => import('@admin/modules/dating/pages/DatingReportsPage')) },
  { path: 'dating/config',     element: lazyPage(() => import('@admin/modules/dating/pages/DatingConfig')) },

  // Sports
  { path: 'sports',            element: lazyPage(() => import('@admin/modules/sports/pages/SportsOverviewPage')) },
  { path: 'sports/users',      element: <ProjectUserPage project="sports" title="Sports — Người dùng" columns={SPORTS_COLUMNS} /> },
  { path: 'sports/leagues',    element: lazyPage(() => import('@admin/modules/sports/pages/SportsLeaguesPage')) },
  { path: 'sports/teams',      element: lazyPage(() => import('@admin/modules/sports/pages/SportsTeamsPage')) },
  { path: 'sports/matches',    element: lazyPage(() => import('@admin/modules/sports/pages/SportsMatchesPage')) },
  { path: 'sports/bets',       element: lazyPage(() => import('@admin/modules/sports/pages/SportsBetsPage')) },
  { path: 'sports/articles',   element: lazyPage(() => import('@admin/modules/sports/pages/SportsArticlesPage')) },
  { path: 'sports/config',     element: lazyPage(() => import('@admin/modules/sports/pages/SportsConfig')) },

  // Trade
  { path: 'trade/users',       element: <ProjectUserPage project="trade" title="Trade — Người dùng" columns={TRADE_COLUMNS} /> },
  { path: 'trade/kyc',         element: lazyPage(() => import('@admin/modules/trade/pages/TradeKycPage')) },
  { path: 'trade/orders',      element: lazyPage(() => import('@admin/modules/trade/pages/TradeOrdersPage')) },
  { path: 'trade/wallets',     element: lazyPage(() => import('@admin/modules/trade/pages/TradeWalletsPage')) },
  { path: 'trade/deposits',    element: lazyPage(() => import('@admin/modules/trade/pages/TradeDepositsPage')) },
  { path: 'trade/withdrawals', element: lazyPage(() => import('@admin/modules/trade/pages/TradeWithdrawalsPage')) },
  { path: 'trade/investments', element: lazyPage(() => import('@admin/modules/trade/pages/TradeInvestmentsPage')) },
  { path: 'trade/packages',    element: lazyPage(() => import('@admin/modules/trade/pages/TradeInvestmentsPage').then(m => ({ default: m.PackagesList }))) },
  { path: 'trade/config',      element: lazyPage(() => import('@admin/modules/trade/pages/TradeConfig')) },

  // Settings extended
  { path: 'settings/integrations',        element: <IntegrationSettingsPage /> },
  { path: 'settings/general',             element: <GeneralSettingsPage /> },
  { path: 'settings/connections',         element: <ConnectionsPage /> },
  { path: 'settings/notification-tpl',    element: <NotificationTemplatesPage /> },
  { path: 'settings/cron-jobs',           element: <CronJobsPage /> },
  { path: 'settings/widgets',             element: <WidgetsPage /> },
  { path: 'settings/telegram-broadcast',  element: <TelegramBroadcastPage /> },
  { path: 'settings/telegram-bot',        element: <TelegramAutoReplyPage /> },

  // Ops
  { path: 'ops',               element: lazyPage(() => import('@admin/modules/ops/pages/OperationsDashboard')) },
  { path: 'ops/tasks',         element: lazyPage(() => import('@admin/modules/ops/pages/TasksPage')) },
  { path: 'ops/segments',      element: lazyPage(() => import('@admin/modules/ops/pages/SegmentsPage')) },
  { path: 'ops/reports',       element: lazyPage(() => import('@admin/modules/ops/pages/ReportsPage')) },
  { path: 'ops/campaigns',     element: lazyPage(() => import('@admin/modules/ops/pages/CampaignsPage')) },
];

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: '/',
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    children: ADMIN_CHILD_ROUTES,
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
