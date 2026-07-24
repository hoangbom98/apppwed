// frontend/admin-dashboard/src/modules/shared/components/Breadcrumb.tsx
// Auto-generates breadcrumbs from the current route path.
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const LABELS: Record<string, string> = {
  // root
  '':              'Dashboard',
  // cross-project
  users:           'Người dùng',
  members:         'Thành viên',
  finance:         'Tài chính',
  transactions:    'Giao dịch',
  announcements:   'Thông báo',
  risk:            'Rủi ro & Audit',
  // system
  config:          'Cấu hình',
  general:         'Giao diện',
  settings:        'Cài đặt',
  security:        'Bảo mật',
  admins:          'Tài khoản Admin',
  system:          'Hệ thống',
  'payment-gateways': 'Cổng thanh toán',
  mine:            'Trang cá nhân',
  // game
  game:            'Game',
  deposits:        'Nạp tiền',
  withdrawals:     'Rút tiền',
  rounds:          'Rounds / Sessions',
  providers:       'Nhà cung cấp',
  lottery:         'Xổ số',
  // dating
  dating:          'Dating',
  profiles:        'Profiles',
  gifts:           'Quà tặng',
  matches:         'Matches',
  reports:         'Báo cáo vi phạm',
  moments:         'Moments',
  // sports
  sports:          'Sports',
  leagues:         'Giải đấu',
  teams:           'Đội bóng',
  bets:            'Cược',
  articles:        'Bài viết',
  // trade
  trade:           'Trade',
  orders:          'Lệnh giao dịch',
  wallets:         'Ví',
  kyc:             'KYC',
  // hub
  hub:             'Hub',
  games:           'Games',
  categories:      'Danh mục',
  websites:        'Websites',
  tools:           'Công cụ',
  news:            'Tin tức',
  pages:           'Pages',
  banners:         'Banners',
  menus:           'Menus',
  feedbacks:       'Phản hồi',
  seo:             'SEO',
  'app-catalog':   'App Catalog',
  // ops
  ops:             'Vận hành tự động',
  tasks:           'Task Queue',
  segments:        'Phân khúc KH',
  campaigns:       'Campaigns',
};

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = [
    { label: 'Dashboard', to: '/' },
    ...segments.map((seg, i) => ({
      label: LABELS[seg] ?? seg,
      to:    '/' + segments.slice(0, i + 1).join('/'),
      last:  i === segments.length - 1,
    })),
  ];

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4">
      <Home size={12} />
      {crumbs.map((c, i) => (
        <React.Fragment key={c.to}>
          {i > 0 && <ChevronRight size={12} className="flex-shrink-0" />}
          {c.last
            ? <span className="text-gray-300">{c.label}</span>
            : <Link to={c.to} className="hover:text-gray-300 transition-colors">{c.label}</Link>
          }
        </React.Fragment>
      ))}
    </nav>
  );
}
