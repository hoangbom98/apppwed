import React, { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home, Calendar, Trophy, Tv, User, Download,
  BarChart2, Newspaper, Video, Users, Bell, Search,
  Shield, Star, Gift,
} from 'lucide-react';
import { useAppConfig, applyColorConfig } from '@ui/hooks/useAppConfig';
import { useAuthStore } from '@/store/authStore';
import { useSportsStore } from '@/store/sportsStore';

// ── Nav items shared by both desktop sidebar and mobile bottom nav ────────────
const PRIMARY_NAV = [
  { to: '/',          icon: Home,     label: 'Trang chủ',   end: true  },
  { to: '/schedule',  icon: Calendar, label: 'Lịch thi đấu', end: false },
  { to: '/leagues',   icon: Trophy,   label: 'Giải đấu',    end: false },
  { to: '/teams',     icon: Shield,   label: 'Đội bóng',    end: false },
  { to: '/favorites', icon: Star,     label: 'Yêu thích',   end: false },
  { to: '/profile',   icon: User,     label: 'Tôi',         end: false },
] as const;

const SECONDARY_NAV = [
  { to: '/standings',   icon: BarChart2, label: 'Bảng xếp hạng' },
  { to: '/news',        icon: Newspaper, label: 'Tin tức'         },
  { to: '/videos',      icon: Video,     label: 'Highlights'      },
  { to: '/streams',     icon: Tv,        label: 'Livestream'      },
  { to: '/community',   icon: Users,     label: 'Cộng đồng'       },
  { to: '/promotions',  icon: Gift,      label: 'Khuyến mãi'      },
  { to: '/download',    icon: Download,  label: 'Tải App'         },
];

// ── Desktop Sidebar ────────────────────────────────────────────────────────────
function DesktopSidebar() {
  const { data: brand } = useAppConfig('brand') as { data: { site_name?: string; logo_url?: string } | undefined };
  const siteName = brand?.site_name ?? 'Sports Live';
  const logoUrl  = brand?.logo_url  ?? '';
  const { user, token, logout } = useAuthStore();
  const { unreadCount } = useSportsStore();

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 h-screen sticky top-0 bg-gray-900 border-r border-gray-800 py-4 flex-shrink-0">
      {/* Brand */}
      <div className="px-5 mb-6 flex items-center gap-2.5">
        {logoUrl
          ? <img src={logoUrl} alt={siteName} className="w-8 h-8 object-contain rounded-lg"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          : <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center font-black text-white text-sm">{siteName[0] ?? 'S'}</div>
        }
        <span className="font-extrabold text-lg text-green-400">{siteName}</span>
      </div>

      {/* Primary nav */}
      <nav className="px-3 flex-1 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Chính</p>
        {PRIMARY_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-950/60 text-green-400 border border-green-800/40'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
            {to === '/profile' && unreadCount > 0 && (
              <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}

        <p className="px-3 mt-4 mb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Khám phá</p>
        {SECONDARY_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-950/60 text-green-400 border border-green-800/40'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User / Login */}
      <div className="px-3 mt-4">
        {token && user ? (
          <div className="p-3 rounded-xl bg-green-950/30 border border-green-900/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center font-bold text-white text-xs">
                {(user.fullName || user.username || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.fullName || user.username}</p>
                <p className="text-[10px] text-gray-500 truncate">@{user.username}</p>
              </div>
            </div>
            <button onClick={logout} className="w-full text-xs text-red-400 hover:text-red-300 text-left transition-colors">
              Đăng xuất
            </button>
          </div>
        ) : (
          <NavLink to="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-sm transition-colors">
            Đăng nhập
          </NavLink>
        )}
      </div>
    </aside>
  );
}

// ── Mobile Bottom Nav ──────────────────────────────────────────────────────────
const MOBILE_NAV = PRIMARY_NAV.slice(0, 6); // all 6 items

function MobileBottomNav() {
  const { unreadCount } = useSportsStore();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gray-900 border-t border-gray-800 h-14 flex">
      {MOBILE_NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
            }`
          }
        >
          <div className="relative">
            <Icon size={18} />
            {to === '/profile' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
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

// ── SportsLayout ───────────────────────────────────────────────────────────────
export default function SportsLayout() {
  const { data: colors } = useAppConfig('colors');

  // Apply dynamic colors from config OR static VITE_PRIMARY_COLOR env var
  useEffect(() => {
    if (colors) {
      applyColorConfig(colors);
    } else {
      const primary = (import.meta as any).env?.VITE_PRIMARY_COLOR;
      if (primary) applyColorConfig({ primary_color: primary });
    }
  }, [colors]);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-40 bg-gray-900 border-b border-gray-800 h-12 items-center justify-between px-5">
          <div className="relative w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm trận đấu, đội bóng..."
              className="w-full pl-9 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/notifications" className="relative p-1.5 text-gray-400 hover:text-white">
              <Bell size={17} />
            </NavLink>
          </div>
        </header>

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 bg-gray-900 border-b border-gray-800 h-12 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center font-black text-sm text-white">S</div>
            <span className="font-black text-green-400 text-base">Sports Live</span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/search" className="p-1.5 text-gray-400 hover:text-white">
              <Search size={18} />
            </NavLink>
            <NavLink to="/notifications" className="relative p-1.5 text-gray-400 hover:text-white">
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
