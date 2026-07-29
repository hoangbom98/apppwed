import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV = [
  { to: '/',        label: 'Trang chủ',   icon: LayoutDashboard, end: true },
  { to: '/courses', label: 'Khóa học',    icon: BookOpen },
  { to: '/my',      label: 'Đã học',      icon: GraduationCap },
];

export default function AcademyLayout() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ac-bg)' }}>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--ac-primary)', color: '#fff' }}>
        <span className="font-black text-lg tracking-tight">LKVIP Academy</span>
        <button
          onClick={() => { logout(); nav('/login', { replace: true }); }}
          className="text-xs opacity-80 hover:opacity-100"
        >
          {user?.email?.split('@')[0] ?? 'Member'} ↗
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex safe-bottom"
        style={{ background: 'var(--ac-surface)', borderTop: '1px solid var(--ac-border)' }}>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${isActive ? 'font-bold' : 'text-gray-400'}`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--ac-primary)' : undefined })}
          >
            <Icon size={20} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
