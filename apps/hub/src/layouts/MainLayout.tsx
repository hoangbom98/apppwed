/**
 * MainLayout — Hub main shell
 * antd-mini inspired: CSS token–based header + bottom tabbar
 * ConfigProvider pattern: colors loaded from server config via applyColorConfig()
 */
import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import NotificationModal from '@/components/NotificationModal';
import MusicController   from '@/components/MusicController';
import BackToTop         from '@/components/BackToTop';
import SearchBar         from '@/components/SearchBar';
import { useAuthStore }  from '@/store/authStore';
import { useAppConfig, applyColorConfig } from '@ui';
import { useSocket }     from '@/hooks/useSocket';

// ── Desktop nav links ────────────────────────────────────────────────────
const NAV = [
  { to: '/',         label: 'Trang chủ', end: true },
  { to: '/games',    label: 'Games' },
  { to: '/websites', label: 'Websites' },
  { to: '/tools',    label: 'Công cụ' },
  { to: '/news',     label: 'Tin tức' },
  { to: '/download', label: 'Tải App' },
  { to: '/contact',  label: 'Liên hệ' },
];

// ── Mobile bottom tabbar ─────────────────────────────────────────────────
const TABS = [
  { to: '/',         label: 'Trang chủ',  icon: '/assets/alliance/oklive.png',    end: true },
  { to: '/games',    label: 'Game Show',  icon: '/assets/alliance/okheart.png' },
  { to: '/download', label: 'Tải App',    icon: '/assets/png/btn-download.png' },
  { to: '/contact',  label: 'Phản hồi',   icon: '/assets/alliance/doi-tac.png' },
  { to: '/profile',  label: 'Của tôi',    icon: '/assets/alliance/thanh-vien.png' },
];

// ── Footer partner logos ─────────────────────────────────────────────────
const FOOTER_PARTNERS = [
  { name: 'FLY88',   img: '/assets/alliance/fly88.png' },
  { name: 'CM88',    img: '/assets/alliance/cm88.png' },
  { name: 'OK8386',  img: '/assets/alliance/ok8386.png' },
  { name: 'OPEN88',  img: '/assets/alliance/open88.png' },
  { name: 'SC88',    img: '/assets/alliance/sc88.png' },
  { name: 'C168',    img: '/assets/alliance/c168.png' },
];

// antd-mini: active class pattern — use CSS token .hub-nav-link--active
const navCls = ({ isActive }: { isActive: boolean }) =>
  `hub-nav-link${isActive ? ' hub-nav-link--active' : ''}`;

export default function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  useSocket();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [showNotif,    setShowNotif]    = useState(() => !localStorage.getItem('hub_hideNotification'));
  const [showMusic,    setShowMusic]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ── antd-mini ConfigProvider pattern: load server colours → CSS vars ──
  const { data: brand }   = useAppConfig('brand')   as { data: unknown };
  const { data: colors }  = useAppConfig('colors')  as { data: unknown };
  const { data: social }  = useAppConfig('social')  as { data: unknown };
  const { data: feature } = useAppConfig('feature') as { data: unknown };

  useEffect(() => { applyColorConfig(colors as Record<string, unknown>); }, [colors]);

  // ── Close menus on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.hub-user-menu')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userMenuOpen]);

  const siteName   = (brand as { site_name?: string })?.site_name    ?? 'LKVIP Hub';
  const logoUrl    = (brand as { logo_url?: string })?.logo_url     ?? '/assets/gif/header-logo.gif';
  const copyright  = (brand as { copyright_text?: string })?.copyright_text ?? `© ${new Date().getFullYear()} LKVIP Hub`;
  const fbUrl      = (social as { facebook_url?: string })?.facebook_url   ?? '';
  const tgUrl      = (social as { telegram_url?: string })?.telegram_url   ?? '';
  const hotline    = (social as { hotline?: string })?.hotline         ?? '';
  const showDl     = (feature as { download_app_enabled?: boolean })?.download_app_enabled !== false;

  const handleLogout = () => {
    clearAuth();
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="hub-root">

      {/* ── Modals ─────────────────────────────────────────────── */}
      <NotificationModal isOpen={showNotif} onClose={() => setShowNotif(false)} />
      <MusicController   isOpen={showMusic} onClose={() => setShowMusic(false)} />
      <BackToTop />

      {/* ══════════════════════════════════════════════════════════
          HEADER
          antd-mini style: sticky, token-based bg, subtle shadow
          ══════════════════════════════════════════════════════════ */}
      <header className="hub-header">

        {/* Logo */}
        <Link to="/" className="hub-logo" aria-label={siteName}>
          <img
            src={logoUrl} alt={siteName}
            className="hub-logo-img"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hub-nav-desktop" aria-label="Desktop navigation">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navCls}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hub-header-right">
          {/* Desktop inline search */}
          <div className="hidden md:block hub-header-search">
            <SearchBar placeholder="Tìm kiếm..." />
          </div>

          {/* Mobile: search icon → /search page */}
          <button
            className="hub-icon-btn md:hidden"
            onClick={() => navigate('/search')}
            aria-label="Tìm kiếm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Music controller */}
          <button
            className="hub-icon-btn"
            onClick={() => setShowMusic(true)}
            aria-label="Nhạc nền"
          >
            <img
              src="/assets/gif/music.gif" alt="Music"
              className="hub-music-gif"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </button>

          {/* Auth area */}
          {user ? (
            <div className="hub-user-menu">
              <button
                className="hub-avatar-btn"
                onClick={() => setUserMenuOpen(v => !v)}
                aria-label="Menu người dùng"
                aria-expanded={userMenuOpen}
              >
                {/* antd-mini: avatar circle with primary colour */}
                <span className="hub-avatar">
                  {user.username?.[0]?.toUpperCase()}
                </span>
              </button>

              {userMenuOpen && (
                <div className="hub-dropdown" role="menu">
                  <Link
                    to="/profile"
                    className="hub-dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                    role="menuitem"
                  >
                    Tài khoản
                  </Link>
                  <button
                    className="hub-dropdown-item hub-dropdown-item--danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hub-btn-login hidden md:inline-flex">
              Đăng nhập
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="hub-icon-btn md:hidden"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile menu dropdown — antd-mini slideDown animation */}
      {mobileOpen && (
        <nav className="hub-mobile-menu" aria-label="Mobile navigation">
          {NAV.map(n => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              className={navCls}
              onClick={() => setMobileOpen(false)}
            >
              {n.label}
            </NavLink>
          ))}
          {!user && (
            <Link
              to="/login"
              className="hub-btn-login text-center mt-2"
              onClick={() => setMobileOpen(false)}
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      )}

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════════════════════ */}
      <main className="hub-main">
        <Outlet />
      </main>

      {/* ══════════════════════════════════════════════════════════
          FOOTER (desktop)
          ══════════════════════════════════════════════════════════ */}
      <footer className="hub-footer">
        {/* Partner logos */}
        <div className="hub-footer-partners">
          {FOOTER_PARTNERS.map(p => (
            <div key={p.name} className="hub-partner-logo" title={p.name}>
              <img
                src={p.img} alt={p.name} loading="lazy"
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
              />
            </div>
          ))}
        </div>

        {/* Social links from config */}
        {(fbUrl || tgUrl || hotline) && (
          <div className="flex gap-4 justify-center py-2 text-sm"
            style={{ color: 'var(--hub-text-muted)' }}>
            {fbUrl   && <a href={fbUrl}   target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>}
            {tgUrl   && <a href={tgUrl}   target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Telegram</a>}
            {hotline && <a href={`tel:${hotline}`} className="hover:text-white transition-colors">{hotline}</a>}
          </div>
        )}

        {/* Footer links */}
        <div className="hub-footer-links">
          <Link to="/news">Tin tức</Link>
          <Link to="/contact">Liên hệ</Link>
          {showDl && <Link to="/download">Tải ứng dụng</Link>}
          <Link to="/pages/policy">Chính sách</Link>
          <Link to="/pages/terms">Điều khoản</Link>
        </div>

        <p className="hub-footer-copy">{copyright} · Giải trí có trách nhiệm</p>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          MOBILE BOTTOM TABBAR
          antd-mini: active indicator bar, token colours, safe-area
          ══════════════════════════════════════════════════════════ */}
      <nav className="hub-tabbar" aria-label="Điều hướng chính">
        {TABS.map(t => (
          <NavLink
            key={t.to} to={t.to} end={t.end}
            className={({ isActive }) =>
              `hub-tab-item${isActive ? ' hub-tab-item--active' : ''}`
            }
          >
            <img
              src={t.icon} alt={t.label}
              className="hub-tab-icon"
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.4'; }}
            />
            <span className="hub-tab-label">{t.label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}
