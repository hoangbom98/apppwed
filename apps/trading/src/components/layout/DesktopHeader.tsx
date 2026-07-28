import { useState } from 'react';
import { Bell, Search, Sun, Moon, LogIn, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/api/trade';

export default function DesktopHeader() {
  const [darkMode, setDarkMode] = useState(true); // trade is always dark
  const { user, token, logout } = useAuthStore();

  const { data: unreadData } = useQuery({
    queryKey: ['notif-unread'],
    queryFn:  getUnreadCount,
    enabled:  !!token,
    refetchInterval: 30_000,
  });
  const unreadCount: number = (unreadData as { data?: { count?: number } })?.data?.count ?? 0;

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <header
      className="sticky top-0 z-40 h-16 px-4 md:px-6 flex items-center justify-between"
      style={{
        background:   'var(--bn-bg-surface)',
        borderBottom: '1px solid var(--bn-border)',
      }}
    >
      {/* Search */}
      <div className="relative w-56 hidden md:block">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--bn-text-muted)' }} />
        <input
          type="text"
          placeholder="Tìm cặp giao dịch..."
          className="w-full pl-8 pr-4 py-1.5 text-xs rounded-lg outline-none transition-colors"
          style={{
            background: 'var(--bn-bg-elevated)',
            border:     '1px solid var(--bn-border)',
            color:      'var(--bn-text-primary)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--bn-yellow)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bn-border)')}
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--bn-text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--bn-yellow)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--bn-text-secondary)')}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification bell */}
        <button
          className="relative p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--bn-text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--bn-yellow)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--bn-text-secondary)')}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold px-0.5"
              style={{ background: 'var(--bn-red)', color: '#fff' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-4" style={{ background: 'var(--bn-border)' }} />

        {/* User */}
        {token && user ? (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
              style={{ background: 'var(--bn-yellow)', color: '#0b0e11' }}
            >
              {((user as any).fullName || (user as any).email || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold hidden sm:inline" style={{ color: 'var(--bn-text-secondary)' }}>
              {(user as any).fullName || (user as any).email}
            </span>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--bn-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--bn-red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--bn-text-muted)')}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{ background: 'var(--bn-yellow)', color: '#0b0e11' }}
          >
            <LogIn size={12} /> Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
