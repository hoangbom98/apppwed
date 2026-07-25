/**
 * DatingLayout — H5 shell for the Dating app
 * antd-mini ConfigProvider pattern:
 *   - useAppConfig('colors') → applyColorConfig() sets CSS vars on :root
 *   - Theme tokens propagate to all child components via CSS variables
 *   - Supports prefers-color-scheme auto-switch (defined in index.css)
 *   - VITE_PRIMARY_COLOR env var can override at build time
 */
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { H5Layout, useUnreadCount, useWalletStore, useAuthStore, useAppConfig, applyColorConfig } from '@ui';

/**
 * applyDatingTheme — maps server config colours to dating-specific CSS tokens.
 * This is the "ConfigProvider" equivalent for the dating app:
 * like <ant-config-provider themeVars={...}> in antd-mini.
 */
function applyDatingTheme(colors: any) {
  if (!colors || typeof document === 'undefined') return;
  const root = document.documentElement;

  // Shared colour tokens (used by shared-ui components)
  if (colors.primary_color) {
    root.style.setProperty('--color-primary', colors.primary_color);
    root.style.setProperty('--dating-primary', colors.primary_color);
    root.style.setProperty('--dating-btn-primary-bg', colors.primary_color);
  }
  if (colors.secondary_color) {
    root.style.setProperty('--color-secondary', colors.secondary_color);
    root.style.setProperty('--dating-secondary', colors.secondary_color);
  }
  if (colors.accent_color) {
    root.style.setProperty('--color-accent', colors.accent_color);
    root.style.setProperty('--dating-accent', colors.accent_color);
  }
}

export default function DatingLayout({ bottomNavItems }: { bottomNavItems: any[] }) {
  useAuthStore();
  const unreadCount = useUnreadCount();
  useWalletStore();
  const { data: colors } = useAppConfig('colors');

  // antd-mini ConfigProvider pattern: apply theme vars on config load
  useEffect(() => {
    if (colors) {
      applyDatingTheme(colors);
    } else {
      // Fallback: VITE_PRIMARY_COLOR build-time override
      const primary = (import.meta as any).env?.VITE_PRIMARY_COLOR;
      if (primary) {
        applyColorConfig({ primary_color: primary });
        document.documentElement.style.setProperty('--dating-primary', primary);
      }
    }
  }, [colors]);

  return (
    <H5Layout
      bottomNavItems={bottomNavItems}
      headerProps={{
        // antd-mini style: gradient class applies to site name text
        themeColor:   'from-pink-500 to-rose-400',
        unreadCount,
        showSearch:   true,
        showNotif:    true,
      }}
      mainClassName=""
    >
      <Outlet />
    </H5Layout>
  );
}
