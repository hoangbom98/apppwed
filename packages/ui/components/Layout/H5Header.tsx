// @ts-nocheck
import React from 'react';
import { Bell, Search, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '../../hooks/useAppConfig';

/**
 * H5Header — antd-mini inspired shared mobile header.
 *
 * Design principles (from antd-mini guide):
 *  - CSS variable tokens: uses --color-primary, --color-bg-elevated, etc.
 *  - ConfigProvider-compatible: colours applied via applyColorConfig()
 *  - Supports light and dark mode auto-switch via prefers-color-scheme
 *
 * Props:
 *   siteName?    string         Override brand name
 *   logoUrl?     string         Override logo URL
 *   unreadCount? number         Notification badge count (default 0)
 *   onSearch?    () => void     Search icon handler (default: navigate('/search'))
 *   onNotif?     () => void     Bell icon handler (default: navigate('/notifications'))
 *   onBack?      () => void     If set, shows a back chevron instead of logo
 *   title?       string         Page title shown in centre (only when onBack is set)
 *   rightSlot?   ReactNode      Extra content right of actions (wallet balance etc.)
 *   themeColor?  string         CSS gradient string for site name text (Tailwind gradient class)
 *   showSearch?  boolean        (default true)
 *   showNotif?   boolean        (default true)
 *   className?   string
 */
export default function H5Header({
  siteName,
  logoUrl,
  unreadCount = 0,
  onSearch,
  onNotif,
  onBack,
  title,
  rightSlot,
  themeColor,
  showSearch = true,
  showNotif  = true,
  className  = '',
}) {
  const navigate  = useNavigate();
  const { data: brand } = useAppConfig('brand');

  const resolvedName  = siteName ?? brand?.site_name  ?? 'Platform';
  const resolvedLogo  = logoUrl  ?? brand?.logo_url;
  const resolvedColor = themeColor ?? 'from-primary to-accent';

  const handleSearch = onSearch ?? (() => navigate('/search'));
  const handleNotif  = onNotif  ?? (() => navigate('/notifications'));
  const handleBack   = onBack   ?? (() => navigate(-1));

  const isSubPage = Boolean(onBack || title);

  return (
    <header
      className={`h5-header ${className}`}
      style={{
        /* antd-mini: uses CSS tokens, not hardcoded values */
        background: 'var(--color-bg-elevated)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* ── Left: back button OR logo ──────────────────────────── */}
      {isSubPage ? (
        <button
          onClick={handleBack}
          className="h5-icon-btn flex-shrink-0"
          aria-label="Quay lại"
        >
          <ChevronLeft size={22} style={{ color: 'var(--color-text)' }} />
        </button>
      ) : (
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          {resolvedLogo ? (
            <img
              src={resolvedLogo}
              alt={resolvedName}
              style={{ height: 28, width: 'auto', objectFit: 'contain', borderRadius: 8 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div
              style={{
                width: 28, height: 28,
                borderRadius: 8,
                background: 'var(--color-primary)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, flexShrink: 0,
              }}
            >
              {resolvedName[0]?.toUpperCase() ?? 'P'}
            </div>
          )}
          <span
            className={`font-black tracking-tight truncate max-w-[140px] bg-gradient-to-r ${resolvedColor} bg-clip-text text-transparent`}
            style={{ fontSize: 'var(--font-size-md)' }}
          >
            {resolvedName}
          </span>
        </div>
      )}

      {/* ── Centre: page title (sub-pages only) ───────────────── */}
      {isSubPage && title && (
        <span
          className="flex-1 text-center truncate"
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          {title}
        </span>
      )}

      {/* ── Spacer for logo layout (pushes actions right) ─────── */}
      {!isSubPage && <div className="flex-1" />}

      {/* ── Right: search + bell + custom slot ────────────────── */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {showSearch && (
          <button
            onClick={handleSearch}
            className="h5-icon-btn"
            aria-label="Tìm kiếm"
          >
            <Search size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        )}

        {showNotif && (
          <button
            onClick={handleNotif}
            className="h5-icon-btn"
            aria-label="Thông báo"
          >
            <Bell size={18} style={{ color: 'var(--color-text-secondary)' }} />
            {unreadCount > 0 && (
              <span className="h5-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {rightSlot && (
          <div className="flex items-center gap-1.5 ml-1">{rightSlot}</div>
        )}
      </div>
    </header>
  );
}
