import { Outlet, NavLink } from 'react-router-dom';
import { TrendingUp, BarChart2, Star, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/',          label: 'Thị trường',  icon: TrendingUp, end: true },
  { to: '/watchlist', label: 'Theo dõi',    icon: Star },
  { to: '/chart',     label: 'Biểu đồ',     icon: BarChart2 },
  { to: '/profile',   label: 'Tài khoản',   icon: User },
];

export default function CryptoLayout() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cr-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: 'var(--cr-surface)', borderBottom: '1px solid var(--cr-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--cr-primary)' }}>
            <TrendingUp size={14} color="#fff" />
          </div>
          <span className="font-black text-lg tracking-tight" style={{ color: 'var(--cr-text)' }}>LKVIP Crypto</span>
        </div>
        <button
          onClick={() => { logout(); nav('/login', { replace: true }); }}
          className="text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'var(--cr-surface-2)', color: 'var(--cr-muted)', border: '1px solid var(--cr-border)' }}
        >
          {user?.email?.split('@')[0] ?? 'Member'}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex safe-bottom" style={{ background: 'var(--cr-surface)', borderTop: '1px solid var(--cr-border)' }}>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 flex flex-col items-center py-2 text-xs transition-colors"
            style={({ isActive }) => ({ color: isActive ? 'var(--cr-primary)' : 'var(--cr-muted)', fontWeight: isActive ? 700 : 400 })}
          >
            <Icon size={20} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
