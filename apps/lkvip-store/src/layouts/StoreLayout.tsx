import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Store } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const NAV_CATEGORIES = [
  { to: '/products?type=service',       label: 'Dịch vụ số' },
  { to: '/products?type=source_code',   label: 'Source code' },
  { to: '/products?type=template',      label: 'Templates' },
  { to: '/products?type=api',           label: 'API & Plugins' },
  { to: '/products?type=course',        label: 'Khoá học' },
];

export default function StoreLayout() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isLoggedIn, user } = useAuthStore();
  const { totalItems, toggleCart }  = useCartStore();
  const nav = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) nav(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--store-bg)' }}>
      {/* Top header */}
      <header style={{ background: 'var(--store-surface)', borderBottom: '1px solid var(--store-border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>
          {/* Logo */}
          <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--store-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--store-text)', letterSpacing: '-0.3px' }}>LKVIP<span style={{ color: 'var(--store-primary)' }}>Store</span></span>
          </NavLink>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ flex: 1, display: 'flex', border: '1.5px solid var(--store-border)', borderRadius: 8, overflow: 'hidden', background: '#f8fafc' }}>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, dịch vụ, source code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 14, color: 'var(--store-text)', outline: 'none' }}
              />
              <button
                type="submit"
                style={{ padding: '9px 16px', background: 'var(--store-primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Search size={17} color="#fff" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Cart button */}
            <button
              onClick={toggleCart}
              style={{ position: 'relative', padding: '8px 10px', background: 'transparent', border: '1px solid var(--store-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ShoppingCart size={20} color="var(--store-text)" />
              {totalItems() > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--store-primary)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {totalItems()}
                </span>
              )}
            </button>

            {/* Auth */}
            {isLoggedIn ? (
              <button
                onClick={() => nav('/customer')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <User size={15} />
                {user?.fullName?.split(' ').slice(-1)[0] ?? 'Tài khoản'}
              </button>
            ) : (
              <button
                onClick={() => nav('/login')}
                style={{ padding: '7px 14px', background: 'transparent', color: 'var(--store-primary)', border: '1.5px solid var(--store-primary)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Đăng nhập
              </button>
            )}

            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6 }}
              className="md:hidden"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Category nav bar */}
        <div style={{ background: '#f1f5f9', borderTop: '1px solid var(--store-border)' }} className="hidden md:block">
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 4, overflowX: 'auto' }}>
            <NavLink
              to="/products"
              end
              style={({ isActive }) => ({
                padding: '9px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap',
                color: isActive ? 'var(--store-primary)' : 'var(--store-muted)',
                borderBottom: isActive ? '2px solid var(--store-primary)' : '2px solid transparent',
              })}
            >
              Tất cả
            </NavLink>
            {NAV_CATEGORIES.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  padding: '9px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap',
                  color: isActive ? 'var(--store-primary)' : 'var(--store-muted)',
                  borderBottom: isActive ? '2px solid var(--store-primary)' : '2px solid transparent',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--store-surface)', borderTop: '1px solid var(--store-border)', padding: '32px 20px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--store-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Store size={16} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, color: 'var(--store-text)', fontSize: 15 }}>LKVIP<span style={{ color: 'var(--store-primary)' }}>Store</span></span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--store-muted)' }}>© {new Date().getFullYear()} LKVIP Group. Mọi quyền được bảo lưu.</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <a href="https://lkvipgroup.com" target="_blank" rel="noreferrer" style={{ color: 'var(--store-muted)', textDecoration: 'none' }}>lkvipgroup.com</a>
              <NavLink to="/contact" style={{ color: 'var(--store-muted)', textDecoration: 'none' }}>Hỗ trợ</NavLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
