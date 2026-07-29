import { Outlet, NavLink } from 'react-router-dom';
import { TrendingUp, LayoutDashboard, Briefcase, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/',          label: 'Tổng quan',  icon: LayoutDashboard, end: true },
  { to: '/packages',  label: 'Gói đầu tư', icon: TrendingUp },
  { to: '/portfolio', label: 'Danh mục',   icon: Briefcase },
];

export default function InvestLayout() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--inv-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: 'var(--inv-primary)', color: '#fff' }}>
        <span className="font-black text-lg tracking-tight">LKVIP Invest</span>
        <button
          onClick={() => { logout(); nav('/login', { replace: true }); }}
          className="text-xs opacity-80 hover:opacity-100"
        >
          {user?.email?.split('@')[0] ?? 'Member'} ↗
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex safe-bottom" style={{ background: 'var(--inv-surface)', borderTop: '1px solid var(--inv-border)' }}>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${isActive ? 'font-bold' : 'text-gray-400'}`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--inv-primary)' : undefined })}
          >
            <Icon size={20} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
