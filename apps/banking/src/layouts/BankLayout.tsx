import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Home, ArrowDownToLine, ArrowUpFromLine, History,
  CreditCard, User, ArrowLeftRight,
} from 'lucide-react';

const NAV = [
  { to: '/',         label: 'Trang chủ', icon: Home },
  { to: '/deposit',  label: 'Nạp tiền',  icon: ArrowDownToLine },
  { to: '/withdraw', label: 'Rút tiền',  icon: ArrowUpFromLine },
  { to: '/transfer', label: 'Chuyển',    icon: ArrowLeftRight },
  { to: '/history',  label: 'Lịch sử',   icon: History },
];

export default function BankLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bank-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: 'var(--bank-primary)', color: '#fff' }}>
        <span className="font-bold text-lg tracking-tight">LKVIP Bank</span>
        <NavLink to="/profile" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <User size={16} color="#fff" />
        </NavLink>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex safe-bottom" style={{ background: 'var(--bank-surface)', borderTop: '1px solid var(--bank-border)' }}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${isActive ? 'font-semibold' : 'text-gray-400'}`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--bank-primary)' : undefined })}
          >
            <Icon size={20} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
