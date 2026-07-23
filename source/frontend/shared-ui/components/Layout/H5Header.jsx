import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '../../hooks/useAppConfig';

/**
 * H5Header — Shared mobile-first header for Game, Dating, Sports H5 apps.
 *
 * Props:
 *   siteName?    string         Override brand name (fallback: appConfig brand.site_name)
 *   logoUrl?     string         Override logo URL
 *   unreadCount? number         Notification badge count
 *   onSearch?    () => void     Search icon click handler (defaults to navigate('/search'))
 *   onNotif?     () => void     Bell icon click handler (defaults to navigate('/notifications'))
 *   rightSlot?   ReactNode      Extra content rendered right of the icon row (e.g. wallet balance)
 *   themeColor?  string         Active gradient color for site name text
 *   showSearch?  boolean        Show search icon (default: true)
 *   showNotif?   boolean        Show notification bell (default: true)
 *   className?   string         Extra classes on <header>
 */
export default function H5Header({
  siteName,
  logoUrl,
  unreadCount = 0,
  onSearch,
  onNotif,
  rightSlot,
  themeColor,
  showSearch = true,
  showNotif  = true,
  className  = '',
}) {
  const navigate  = useNavigate();
  const { data: brand } = useAppConfig('brand');

  const resolvedName  = siteName  ?? brand?.site_name  ?? 'Platform';
  const resolvedLogo  = logoUrl   ?? brand?.logo_url;
  const resolvedColor = themeColor ?? 'from-primary to-accent';

  const handleSearch = onSearch ?? (() => navigate('/search'));
  const handleNotif  = onNotif  ?? (() => navigate('/notifications'));

  return (
    <header
      className={`sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between ${className}`}
    >
      {/* ── Left: Logo + site name ─────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        {resolvedLogo ? (
          <img
            src={resolvedLogo}
            alt={resolvedName}
            className="w-8 h-8 rounded-xl object-contain flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
            style={{ background: 'var(--color-primary, #6366f1)' }}
          >
            {resolvedName[0]?.toUpperCase() ?? 'P'}
          </div>
        )}
        <span
          className={`font-bold text-lg tracking-tight bg-gradient-to-r ${resolvedColor} bg-clip-text text-transparent truncate max-w-[120px]`}
        >
          {resolvedName}
        </span>
      </div>

      {/* ── Right: search + bell + extra slot ──────────────── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {showSearch && (
          <button
            onClick={handleSearch}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Tìm kiếm"
          >
            <Search size={20} />
          </button>
        )}

        {showNotif && (
          <button
            onClick={handleNotif}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            aria-label="Thông báo"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Project-specific extra slot (wallet balance, dark toggle, etc.) */}
        {rightSlot && <div className="flex items-center gap-1.5">{rightSlot}</div>}
      </div>
    </header>
  );
}
