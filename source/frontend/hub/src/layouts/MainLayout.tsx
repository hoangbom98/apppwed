/**
 * MainLayout — Khung giao diện chính của Hub
 * - Header: Logo + tên site từ config động (fallback: hardcode)
 * - Desktop: navbar top với links
 * - Mobile: bottom tabbar 5 item (WAP style)
 * - Components: NotificationModal, MusicController, BackToTop
 */
import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import NotificationModal from '@/components/NotificationModal';
import MusicController from '@/components/MusicController';
import BackToTop from '@/components/BackToTop';
import SearchBar from '@/components/SearchBar';
import { useAuthStore } from '@/store/authStore';
import { useAppConfig, applyColorConfig } from '@ui/hooks/useAppConfig';

// ── Desktop nav links ──────────────────────────────────────────────────
const NAV = [
  { to: '/',         label: 'Trang chủ', end: true },
  { to: '/games',    label: 'Games' },
  { to: '/websites', label: 'Websites' },
  { to: '/tools',    label: 'Công cụ' },
  { to: '/news',     label: 'Tin tức' },
  { to: '/download', label: 'Tải App' },
  { to: '/contact',  label: 'Liên hệ' },
];

// ── Mobile bottom tabbar ───────────────────────────────────────────────
const TABS = [
  { to: '/',         label: 'Trang chủ',  icon: '/assets/alliance/oklive.png',    end: true },
  { to: '/games',    label: 'Game Show',  icon: '/assets/alliance/okheart.png' },
  { to: '/download', label: 'Tải App',    icon: '/assets/png/btn-download.png' },
  { to: '/contact',  label: 'Phản hồi',  icon: '/assets/alliance/doi-tac.png' },
  { to: '/profile',  label: 'Của tôi',   icon: '/assets/alliance/thanh-vien.png' },
];

// ── Footer links ───────────────────────────────────────────────────────
const FOOTER_PARTNERS = [
  { name: 'FLY88',   img: '/assets/alliance/fly88.png' },
  { name: 'CM88',    img: '/assets/alliance/cm88.png' },
  { name: 'OK8386',  img: '/assets/alliance/ok8386.png' },
  { name: 'OPEN88',  img: '/assets/alliance/open88.png' },
  { name: 'SC88',    img: '/assets/alliance/sc88.png' },
  { name: 'C168',    img: '/assets/alliance/c168.png' },
];

export default function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [showNotif,   setShowNotif]   = useState(() => !localStorage.getItem('hub_hideNotification'));
  const [showMusic,   setShowMusic]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ── Dynamic config ─────────────────────────────────────────────────
  const { data: brand }   = useAppConfig('brand');
  const { data: colors }  = useAppConfig('colors');
  const { data: social }  = useAppConfig('social');
  const { data: feature } = useAppConfig('feature');

  // Apply dynamic CSS color vars whenever colors config loads
  useEffect(() => { applyColorConfig(colors); }, [colors]);

  const siteName    = brand?.site_name    ?? 'OKVIP Hub';
  const logoUrl     = brand?.logo_url     ?? '/assets/gif/header-logo.gif';
  const copyright   = brand?.copyright_text ?? `© ${new Date().getFullYear()} OKVIP Hub`;
  const fbUrl       = social?.facebook_url   ?? '';
  const tgUrl       = social?.telegram_url   ?? '';
  const hotline     = social?.hotline         ?? '';
  const showDownload = feature?.download_app_enabled !== false;

  const handleLogout = () => {
    clearAuth();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `hub-nav-link ${isActive ? 'hub-nav-link--active' : ''}`;

  return (
    <div className="hub-root">
      {/* ── Modals ─────────────────────────────────────────── */}
      <NotificationModal isOpen={showNotif} onClose={() => setShowNotif(false)} />
      <MusicController   isOpen={showMusic} onClose={() => setShowMusic(false)} />
      <BackToTop />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="hub-header">
        {/* Logo */}
        <Link to="/" className="hub-logo">
          <img src={logoUrl} alt={siteName} className="hub-logo-img"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </Link>

        {/* Desktop nav */}
        <nav className="hub-nav-desktop">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navCls}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: search + user + music */}
        <div className="hub-header-right">
          {/* Inline autocomplete search — desktop only */}
          <div className="hidden md:block hub-header-search">
            <SearchBar placeholder="Tìm kiếm..." />
          </div>
          {/* Mobile: search icon → /search page */}
          <button className="hub-icon-btn md:hidden" onClick={() => navigate('/search')} aria-label="Tìm kiếm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button className="hub-icon-btn" onClick={() => setShowMusic(true)} aria-label="Nhạc nền">
            <img src="/assets/gif/music.gif" alt="Music"
              className="hub-music-gif"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </button>

          {/* Auth */}
          {user ? (
            <div className="hub-user-menu">
              <button className="hub-avatar-btn" onClick={() => setUserMenuOpen(v => !v)} aria-label="Menu người dùng">
                <span className="hub-avatar">{user.username[0]?.toUpperCase()}</span>
              </button>
              {userMenuOpen && (
                <div className="hub-dropdown">
                  <Link to="/profile" className="hub-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    👤 Tài khoản
                  </Link>
                  <button className="hub-dropdown-item hub-dropdown-item--danger" onClick={handleLogout}>
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hub-btn-login hidden md:inline-flex">Đăng nhập</Link>
          )}

          {/* Mobile hamburger */}
          <button className="hub-icon-btn md:hidden" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="hub-mobile-menu">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navCls}
              onClick={() => setMobileOpen(false)}>
              {n.label}
            </NavLink>
          ))}
          {!user && (
            <Link to="/login" className="hub-btn-login w-full text-center" onClick={() => setMobileOpen(false)}>
              Đăng nhập
            </Link>
          )}
        </div>
      )}

      {/* ── Main content ───────────────────────────────────── */}
      <main className="hub-main">
        <Outlet />
      </main>

      {/* ── Footer desktop ─────────────────────────────────── */}
      <footer className="hub-footer">
        {/* Partners row */}
        <div className="hub-footer-partners">
          {FOOTER_PARTNERS.map(p => (
            <div key={p.name} className="hub-partner-logo">
              <img src={p.img} alt={p.name} loading="lazy"
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.4'; }} />
            </div>
          ))}
        </div>
        {/* Social links from config */}
        {(fbUrl || tgUrl || hotline) && (
          <div className="hub-footer-social flex gap-4 justify-center py-2 text-sm text-gray-400">
            {fbUrl     && <a href={fbUrl} target="_blank" rel="noopener noreferrer">Facebook</a>}
            {tgUrl     && <a href={tgUrl} target="_blank" rel="noopener noreferrer">Telegram</a>}
            {hotline   && <a href={`tel:${hotline}`}>{hotline}</a>}
          </div>
        )}
        {/* Links */}
        <div className="hub-footer-links">
          <Link to="/news">Tin tức</Link>
          <Link to="/contact">Liên hệ</Link>
          {showDownload && <Link to="/download">Tải ứng dụng</Link>}
          <Link to="/pages/policy">Chính sách</Link>
          <Link to="/pages/terms">Điều khoản</Link>
        </div>
        <p className="hub-footer-copy">{copyright} · Giải trí có trách nhiệm</p>
      </footer>

      {/* ── Mobile bottom tabbar ───────────────────────────── */}
      <nav className="hub-tabbar" aria-label="Điều hướng chính">
        {TABS.map(t => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `hub-tab-item ${isActive ? 'hub-tab-item--active' : ''}`}>
            <img src={t.icon} alt={t.label} className="hub-tab-icon"
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.4'; }} />
            <span className="hub-tab-label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
