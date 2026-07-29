import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Key, RefreshCw, LogOut, Store } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const CUSTOMER_NAV = [
  { to: '/customer',                label: 'Tài nguyên của tôi', icon: Package, end: true },
  { to: '/customer/orders',         label: 'Đơn hàng',           icon: ShoppingBag },
  { to: '/customer/api-keys',       label: 'API Keys',            icon: Key },
  { to: '/customer/subscriptions',  label: 'Subscriptions',       icon: RefreshCw },
];

export default function CustomerLayout() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)', maxWidth: 1200, margin: '0 auto', padding: '24px 20px', gap: 24 }}>
      {/* Sidebar */}
      <aside style={{ width: 240, flexShrink: 0 }}>
        {/* User card */}
        <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--store-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{(user?.fullName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}</span>
          </div>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--store-text)', marginBottom: 2 }}>{user?.fullName ?? 'Thành viên'}</p>
          <p style={{ fontSize: 12, color: 'var(--store-muted)' }}>{user?.email}</p>
        </div>

        {/* Nav links */}
        <nav style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, overflow: 'hidden' }}>
          {CUSTOMER_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                color: isActive ? 'var(--store-primary)' : 'var(--store-text)',
                background: isActive ? '#eff6ff' : 'transparent',
                borderLeft: isActive ? '3px solid var(--store-primary)' : '3px solid transparent',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => { logout(); nav('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', width: '100%', background: 'transparent', border: 'none', borderTop: '1px solid var(--store-border)', fontSize: 14, color: 'var(--store-danger)', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </nav>

        {/* Back to store */}
        <button
          onClick={() => nav('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 16px', width: '100%', background: 'transparent', border: '1px solid var(--store-border)', borderRadius: 8, fontSize: 13, color: 'var(--store-muted)', cursor: 'pointer' }}
        >
          <Store size={15} />
          Quay lại cửa hàng
        </button>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
