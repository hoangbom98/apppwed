import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BarChart2, Star, TrendingUp, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const NAV = [
  { to: '/crypto',          label: 'Thị trường', icon: TrendingUp, end: true },
  { to: '/crypto/watchlist', label: 'Theo dõi',   icon: Star },
  { to: '/crypto/chart',     label: 'Biểu đồ',    icon: BarChart2 },
  { to: '/crypto/profile',   label: 'Tài khoản',  icon: User },
];

export default function CryptoLayout() {
  const { token, user } = useAuthStore();
  const nav = useNavigate();

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bn-bg-base)', color: 'var(--bn-text-primary)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-52 flex-col h-screen sticky top-0"
        style={{ background: 'var(--bn-bg-surface)', borderRight: '1px solid var(--bn-border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid var(--bn-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bn-primary)' }}>
            <TrendingUp size={16} color="#fff" />
          </div>
          <span className="font-black text-base" style={{ color: 'var(--bn-text-primary)' }}>LKVIP Crypto</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={({ isActive }) => ({
                background:  isActive ? 'var(--bn-yellow-muted)' : 'transparent',
                color:       isActive ? 'var(--bn-primary)' : 'var(--bn-text-secondary)',
                fontWeight:  isActive ? 700 : 400,
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--bn-border)' }}>
          {token ? (
            <p className="text-xs truncate" style={{ color: 'var(--bn-text-secondary)' }}>
              {(user as { email?: string })?.email ?? 'Đã đăng nhập'}
            </p>
          ) : (
            <button
              onClick={() => nav('/login')}
              className="w-full py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--bn-primary)', color: '#fff' }}
            >
              Đăng nhập
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--bn-bg-surface)', borderBottom: '1px solid var(--bn-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bn-primary)' }}>
              <TrendingUp size={13} color="#fff" />
            </div>
            <span className="font-black text-sm" style={{ color: 'var(--bn-text-primary)' }}>LKVIP Crypto</span>
          </div>
          {token ? (
            <button onClick={() => nav('/crypto/profile')} className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>
              {(user as { email?: string })?.email?.split('@')[0] ?? 'Member'}
            </button>
          ) : (
            <button onClick={() => nav('/login')} className="text-xs font-semibold" style={{ color: 'var(--bn-primary)' }}>
              Đăng nhập
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
          style={{ background: 'var(--bn-bg-surface)', borderTop: '1px solid var(--bn-border)' }}>
          <div className="flex">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="flex-1 flex flex-col items-center py-2 text-[11px] transition-colors"
                style={({ isActive }) => ({
                  color:      isActive ? 'var(--bn-primary)' : 'var(--bn-text-secondary)',
                  fontWeight: isActive ? 700 : 400,
                })}
              >
                <Icon size={19} />
                <span className="mt-0.5">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
