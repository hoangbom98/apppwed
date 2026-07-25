// @ts-nocheck
import React from 'react';
import H5Header from './H5Header';
import H5BottomNav from './H5BottomNav';

/**
 * H5Layout — Shell layout for mobile-first H5 apps (Game, Dating, Sports).
 *
 * Props:
 *   children         ReactNode      Page content (via <Outlet /> in router context)
 *   bottomNavItems   array          Passed directly to H5BottomNav
 *   headerProps?     object         Spread onto H5Header (siteName, logoUrl, unreadCount, rightSlot, …)
 *   mainClassName?   string         Extra classes on <main>
 *   footer?          ReactNode      Optional footer node rendered below main (before BottomNav)
 */
export default function H5Layout({
  children,
  bottomNavItems,
  headerProps = {},
  mainClassName = '',
  footer,
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark text-gray-900 dark:text-gray-100 max-w-md mx-auto relative">
      <H5Header {...headerProps} />

      <main className={`flex-1 pb-20 overflow-y-auto ${mainClassName}`}>
        {children}
      </main>

      {footer}

      <H5BottomNav items={bottomNavItems} />
    </div>
  );
}
