// apps/admin-dashboard/src/core/routes/menu.tsx
// Dữ liệu menu tĩnh dùng cho legacy ProLayout (nếu có).
// NAV chính được drive bởi module registry trong core/layouts/AdminLayout.tsx.
import {
  DashboardOutlined, UserOutlined, DollarOutlined, AppstoreOutlined,
  SettingOutlined, FileTextOutlined, SafetyOutlined, TeamOutlined,
  CreditCardOutlined, BarChartOutlined, CommentOutlined, GiftOutlined,
  NotificationOutlined, AlertOutlined, MonitorOutlined, HeartOutlined,
  TrophyOutlined, LineChartOutlined, ShopOutlined, CloudServerOutlined,
} from '@ant-design/icons';

export const menuData = [
  // ── Tổng quan ────────────────────────────────────────────────────────────────
  { path: '/',      name: 'Dashboard',          icon: <DashboardOutlined /> },
  { path: '/mine',  name: 'Trang cá nhân',      icon: <UserOutlined /> },

  // ── Quản trị chung ───────────────────────────────────────────────────────────
  {
    name: 'Quản trị chung', icon: <TeamOutlined />,
    children: [
      { path: '/members',       name: 'Thành viên',          icon: <UserOutlined /> },
      { path: '/finance',       name: 'Nạp / Rút tiền',      icon: <CreditCardOutlined /> },
      { path: '/transactions',  name: 'Giao dịch',           icon: <DollarOutlined /> },
      { path: '/rebates',       name: 'Hoàn trả (Rebate)',   icon: <GiftOutlined /> },
      { path: '/agents',        name: 'Đại lý',              icon: <TeamOutlined /> },
      { path: '/promotions',    name: 'Khuyến mãi',          icon: <GiftOutlined /> },
      { path: '/announcements', name: 'Thông báo',           icon: <NotificationOutlined /> },
      { path: '/im',            name: 'IM & Support',        icon: <CommentOutlined /> },
      { path: '/risk',          name: 'Rủi ro & Audit',      icon: <SafetyOutlined /> },
      { path: '/logs',          name: 'Audit Logs',          icon: <FileTextOutlined /> },
      { path: '/monitor',       name: 'Giám sát Realtime',   icon: <MonitorOutlined /> },
      { path: '/realtime',      name: 'Live Feed',           icon: <AlertOutlined /> },
    ],
  },

  // ── Tài chính tổng hợp ────────────────────────────────────────────────────────
  {
    name: 'Tài chính nhóm', icon: <BarChartOutlined />,
    children: [
      { path: '/group-finance',         name: 'Tổng quan tài chính', icon: <BarChartOutlined /> },
      { path: '/group-finance/fee-cfg', name: 'Cấu hình phí',        icon: <SettingOutlined /> },
      { path: '/group-finance/loans',   name: 'Khoản vay nội bộ',    icon: <DollarOutlined /> },
    ],
  },

  // ── Game ─────────────────────────────────────────────────────────────────────
  {
    name: 'Game', icon: <AppstoreOutlined />,
    children: [
      { path: '/game/users',       name: 'Người dùng',     icon: <UserOutlined /> },
      { path: '/game/deposits',    name: 'Nạp tiền',       icon: <CreditCardOutlined /> },
      { path: '/game/withdrawals', name: 'Rút tiền',       icon: <DollarOutlined /> },
      { path: '/game/rounds',      name: 'Rounds',         icon: <AppstoreOutlined /> },
      { path: '/game/providers',   name: 'Providers',      icon: <ShopOutlined /> },
      { path: '/game/lottery',     name: 'Xổ số',          icon: <TrophyOutlined /> },
      { path: '/game/statistics',  name: 'Thống kê',       icon: <BarChartOutlined /> },
      { path: '/game/vip-config',  name: 'Cấu hình VIP',  icon: <TrophyOutlined /> },
      { path: '/game/config',      name: 'Cấu hình khác', icon: <SettingOutlined /> },
    ],
  },

  // ── Hub Content ──────────────────────────────────────────────────────────────
  {
    name: 'Hub Content', icon: <CloudServerOutlined />,
    children: [
      { path: '/games',       name: 'Games',      icon: <AppstoreOutlined /> },
      { path: '/categories',  name: 'Danh mục',   icon: <AppstoreOutlined /> },
      { path: '/websites',    name: 'Websites',   icon: <CloudServerOutlined /> },
      { path: '/tools',       name: 'Công cụ',    icon: <SettingOutlined /> },
      { path: '/news',        name: 'Tin tức',    icon: <FileTextOutlined /> },
      { path: '/pages',       name: 'Pages',      icon: <FileTextOutlined /> },
      { path: '/banners',     name: 'Banners',    icon: <AppstoreOutlined /> },
      { path: '/menus',       name: 'Menus',      icon: <AppstoreOutlined /> },
      { path: '/feedbacks',   name: 'Phản hồi',   icon: <CommentOutlined /> },
      { path: '/seo',         name: 'SEO',        icon: <FileTextOutlined /> },
      { path: '/app-catalog', name: 'App Catalog',icon: <AppstoreOutlined /> },
      { path: '/hub/config',  name: 'Cấu hình',  icon: <SettingOutlined /> },
    ],
  },

  // ── Dating ───────────────────────────────────────────────────────────────────
  {
    name: 'Dating', icon: <HeartOutlined />,
    children: [
      { path: '/dating/users',    name: 'Người dùng', icon: <UserOutlined /> },
      { path: '/dating/profiles', name: 'Hồ sơ',      icon: <UserOutlined /> },
      { path: '/dating/matches',  name: 'Kết đôi',    icon: <HeartOutlined /> },
      { path: '/dating/gifts',    name: 'Quà tặng',   icon: <GiftOutlined /> },
      { path: '/dating/moments',  name: 'Moments',    icon: <FileTextOutlined /> },
      { path: '/dating/reports',  name: 'Báo cáo vi phạm', icon: <AlertOutlined /> },
      { path: '/dating/config',   name: 'Cấu hình',   icon: <SettingOutlined /> },
    ],
  },

  // ── Sports ───────────────────────────────────────────────────────────────────
  {
    name: 'Sports', icon: <TrophyOutlined />,
    children: [
      { path: '/sports',          name: 'Tổng quan',    icon: <BarChartOutlined /> },
      { path: '/sports/users',    name: 'Người dùng',  icon: <UserOutlined /> },
      { path: '/sports/leagues',  name: 'Giải đấu',    icon: <TrophyOutlined /> },
      { path: '/sports/teams',    name: 'Đội bóng',    icon: <TeamOutlined /> },
      { path: '/sports/matches',  name: 'Trận đấu',    icon: <AppstoreOutlined /> },
      { path: '/sports/bets',     name: 'Cược',        icon: <DollarOutlined /> },
      { path: '/sports/articles', name: 'Bài viết',    icon: <FileTextOutlined /> },
      { path: '/sports/config',   name: 'Cấu hình',    icon: <SettingOutlined /> },
    ],
  },

  // ── Trade ────────────────────────────────────────────────────────────────────
  {
    name: 'Trade', icon: <LineChartOutlined />,
    children: [
      { path: '/trade/users',       name: 'Người dùng',   icon: <UserOutlined /> },
      { path: '/trade/kyc',         name: 'KYC',          icon: <SafetyOutlined /> },
      { path: '/trade/orders',      name: 'Lệnh giao dịch', icon: <AppstoreOutlined /> },
      { path: '/trade/wallets',     name: 'Ví',            icon: <CreditCardOutlined /> },
      { path: '/trade/deposits',    name: 'Nạp tiền',     icon: <CreditCardOutlined /> },
      { path: '/trade/withdrawals', name: 'Rút tiền',     icon: <DollarOutlined /> },
      { path: '/trade/investments', name: 'Đầu tư',       icon: <LineChartOutlined /> },
      { path: '/trade/packages',    name: 'Gói đầu tư',   icon: <AppstoreOutlined /> },
      { path: '/trade/config',      name: 'Cấu hình',     icon: <SettingOutlined /> },
    ],
  },

  // ── Vận hành ─────────────────────────────────────────────────────────────────
  {
    name: 'Vận hành', icon: <MonitorOutlined />,
    children: [
      { path: '/ops',           name: 'Tổng quan',   icon: <MonitorOutlined /> },
      { path: '/ops/tasks',     name: 'Tasks',       icon: <AppstoreOutlined /> },
      { path: '/ops/segments',  name: 'Segments',    icon: <TeamOutlined /> },
      { path: '/ops/reports',   name: 'Báo cáo',     icon: <BarChartOutlined /> },
      { path: '/ops/campaigns', name: 'Campaigns',   icon: <NotificationOutlined /> },
    ],
  },

  // ── Hệ thống ─────────────────────────────────────────────────────────────────
  {
    name: 'Hệ thống', icon: <SettingOutlined />,
    children: [
      { path: '/payment-gateways',             name: 'Cổng thanh toán',      icon: <CreditCardOutlined /> },
      { path: '/config/general',               name: 'Giao diện & Preview',  icon: <AppstoreOutlined /> },
      { path: '/config',                       name: 'Cấu hình hệ thống',    icon: <SettingOutlined /> },
      { path: '/settings/security',            name: 'Bảo mật',              icon: <SafetyOutlined /> },
      { path: '/settings/admins',              name: 'Tài khoản Admin',      icon: <UserOutlined /> },
      { path: '/settings/roles',               name: 'Roles & Quyền',        icon: <SafetyOutlined /> },
      { path: '/settings/system',              name: 'Thông tin hệ thống',   icon: <CloudServerOutlined /> },
      { path: '/settings/integrations',        name: 'Tích hợp & Tính năng', icon: <AppstoreOutlined /> },
      { path: '/settings/general',             name: 'Cài đặt chung',        icon: <SettingOutlined /> },
      { path: '/settings/connections',         name: 'Kết nối',              icon: <CloudServerOutlined /> },
      { path: '/settings/notification-tpl',    name: 'Template thông báo',   icon: <NotificationOutlined /> },
      { path: '/settings/cron-jobs',           name: 'Cron Jobs',            icon: <MonitorOutlined /> },
      { path: '/settings/widgets',             name: 'Widgets & Addons',     icon: <AppstoreOutlined /> },
      { path: '/settings/telegram-broadcast',  name: 'Telegram Broadcast',   icon: <CommentOutlined /> },
      { path: '/settings/telegram-bot',        name: 'Telegram Bot CSKH',    icon: <CommentOutlined /> },
    ],
  },
];
