import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { H5Layout, useUnreadCount, useWalletStore, useAuthStore, useAppConfig, applyColorConfig } from '@ui';

/**
 * DatingLayout — H5 shell for the Dating app.
 *
 * Uses the shared H5Layout (Header + main + BottomNav) from @ui.
 * bottomNavItems come from App.tsx and use PNG activeSrc/inactiveSrc icons.
 *
 * Colors: loaded dynamically from useAppConfig('colors') — falls back to pink theme.
 * Static fallback: VITE_PRIMARY_COLOR env var can override at build time.
 */
export default function DatingLayout({ bottomNavItems }) {
  const { user }    = useAuthStore();
  const unreadCount = useUnreadCount();
  const { balance } = useWalletStore();
  const { data: colors } = useAppConfig('colors');

  // Apply dynamic colors from config OR static VITE_PRIMARY_COLOR env var
  useEffect(() => {
    if (colors) {
      applyColorConfig(colors);
    } else {
      const primary = (import.meta as any).env?.VITE_PRIMARY_COLOR;
      if (primary) applyColorConfig({ primary_color: primary });
    }
  }, [colors]);

  return (
    <H5Layout
      bottomNavItems={bottomNavItems}
      headerProps={{
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
