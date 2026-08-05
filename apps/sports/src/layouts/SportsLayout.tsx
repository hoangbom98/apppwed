import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home, Calendar, Trophy, Tv, User, Download,
  BarChart2, Newspaper, Video, Users, Bell, Search,
  Shield, Star, Gift,
} from 'lucide-react';
import { useAppConfig, applyColorConfig } from '@ui/hooks/useAppConfig';
import { useAuthStore } from '@/store/authStore';
import { useSportsStore } from '@/store/sportsStore';

// ── Nav items shared by desktop sidebar and mobile bottom nav ─────────────────
const PRIMARY_NAV = [
  { to: '/',          icon: Home,     label: 'Trang chủ',    end: true  },
  { to: '/schedule',  icon: Calendar, label: 'Lịch thi đấu', end: false },
  { to: '/leagues',   icon: Trophy,   label: 'Giải đấu',     end: false },
  { to: '/teams',     icon: Shield,   label: 'Đội bóng',     end: false },
  { to: '/favorites', icon: Star,     label: 'Yêu thích',    end: false },
  { to: '/profile',   icon: User,     label: 'Tôi',          end: false },
] as const;

const SECONDARY_NAV = [
  { to: '/standings',  icon: BarChart2, label: 'Bảng xếp hạng' },
  { to: '/news',       icon: Newspaper, label: 'Tin tức'         },
  { to: '/videos',     icon: Video,     label: 'Highlights'      },
  { to: '/streams',    icon: Tv,        label: 'Livestream'      },
  { to: '/community',  icon: Users,     label: 'Cộng đồng'       },
  { to: '/promotions', icon: Gift,      label: 'Khuyến mãi'      },
  { to: '/download',   icon: Download,  label: 'Tải App'         },
];

// ── Nav link style helper ─────────────────────────────────────────────────────
const navClass = ({ isActive }: { isActive: boolean }) =>
  `sports-nav-link${isActive ? ' active' : ''}`;

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar() {
  const { data: brand } = useAppConfig('brand') as { data: { site_name?: string; logo_url?: string } | undefined };
  const siteName = brand?.site_name ?? 'Sports Live';
  const logoUrl  = brand?.logo_url  ?? '';
  const { user, token, logout } = useAuthStore();
  const { unreadCount } = useSportsStore();

  return (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 py-4 flex-shrink-0 w-56 lg:w-64"
      style={{ background: 'var(--sports-bg-card)', borderRight: '1px solid var(--sports-border)' }}
    >
      {/* Brand */}
      <div className="px-5 mb-6 flex items-center gap-2.5">
        {logoUrl
          ? <img src={logoUrl} alt={siteName} className="w-8 h-8 object-contain rounded-lg"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          : <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
              style={{ background: 'var(--sports-primary)' }}>{siteName[0] ?? 'S'}</div>
        }
        <span className="font-extrabold text-lg" style={{ color: 'var(--sports-primary)' }}>{siteName}</span>
      </div>

      {/* Primary nav */}
      <nav className="px-3 flex-1 space-y-0.5 overflow-y-auto sports-scrollbar">
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--sports-text-muted)' }}>Chính</p>
        {PRIMARY_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={navClass}>
            <Icon size={17} />
            <span>{label}</span>
            {to === '/profile' && unreadCount > 0 && (
              <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold rounded-full px-1"
                style={{ background: 'var(--sports-live)', color: '#fff' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}

        <p className="px-3 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--sports-text-muted)' }}>Khám phá</p>
        {SECONDARY_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={navClass}>
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User / Login */}
      <div className="px-3 mt-4">
        {token && user ? (
          <div className="p-3 rounded-xl"
            style={{ background: 'var(--sports-primary-light)', border: '1px solid rgba(0,166,81,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                style={{ background: 'var(--sports-primary)' }}>
                {(user.fullName || user.username || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--sports-text)' }}>
                  {user.fullName || user.username}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--sports-text-muted)' }}>
                  @{user.username}
                </p>
              </div>
            </div>
            <button onClick={logout}
              className="w-full text-xs text-left transition-colors"
              style={{ color: 'var(--sports-live)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <NavLink to="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors sports-btn-primary">
            Đăng nhập
          </NavLink>
        )}
      </div>
    </aside>
  );
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
const MOBILE_NAV = PRIMARY_NAV.slice(0, 6); // all 6 items

function MobileBottomNav() {
  const { unreadCount } = useSportsStore();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 h-14 flex safe-area-bottom"
      style={{ background: 'var(--sports-bg-card)', borderTop: '1px solid var(--sports-border)' }}
    >
      {MOBILE_NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors"
          style={({ isActive }) => ({ color: isActive ? 'var(--sports-primary)' : 'var(--sports-text-muted)' })}
        >
          <div className="relative">
            <Icon size={18} />
            {to === '/profile' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 text-white text-[8px] font-bold rounded-full flex items-center justify-center"
                style={{ background: 'var(--sports-live)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

// ── SportsLayout ──────────────────────────────────────────────────────────────
export default function SportsLayout() {
  const { data: colors } = useAppConfig('colors');

  useEffect(() => {
    if (colors) {
      applyColorConfig(colors);
    } else {
      const primary = (import.meta as any).env?.VITE_PRIMARY_COLOR;
      if (primary) applyColorConfig({ primary_color: primary });
    }
  }, [colors]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--sports-bg)', color: 'var(--sports-text)' }}>
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-40 h-12 items-center justify-between px-5"
          style={{ background: 'var(--sports-bg-card)', borderBottom: '1px solid var(--sports-border)' }}>
          <div className="relative w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--sports-text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm kiếm trận đấu, đội bóng..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs focus:outline-none transition-colors"
              style={{
                background: 'var(--sports-bg-elevated)',
                border: '1px solid var(--sports-border)',
                color: 'var(--sports-text)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--sports-primary)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'var(--sports-border)')}
            />
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/notifications"
              className="relative p-1.5 transition-colors"
              style={{ color: 'var(--sports-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--sports-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--sports-text-muted)')}>
              <Bell size={17} />
            </NavLink>
          </div>
        </header>

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 h-12 flex items-center justify-between px-4"
          style={{ background: 'var(--sports-bg-card)', borderBottom: '1px solid var(--sports-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-white"
              style={{ background: 'var(--sports-primary)' }}>S</div>
            <span className="font-black text-base" style={{ color: 'var(--sports-primary)' }}>Sports Live</span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/search"
              className="p-1.5 transition-colors"
              style={{ color: 'var(--sports-text-muted)' }}>
              <Search size={18} />
            </NavLink>
            <NavLink to="/notifications"
              className="relative p-1.5 transition-colors"
              style={{ color: 'var(--sports-text-muted)' }}>
              <Bell size={18} />
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-14 md:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export { DesktopSidebar, MobileBottomNav };
