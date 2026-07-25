// @ts-nocheck
import React from 'react';
import { H5Header } from '../Layout/H5Header';
import { H5BottomNav } from '../Layout/H5BottomNav';

/**
 * MainLayout — standard layout for user-facing SPAs (H5 mobile-first)
 * Wraps children with Header + main content area + BottomNav
 * Usage: <MainLayout title="Home" showBack={false}>{children}</MainLayout>
 */
export default function MainLayout({
  children,
  title,
  showBack = false,
  showNav = true,
  headerActions,
  className = '',
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <H5Header title={title} showBack={showBack} actions={headerActions} />
      <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-16' : ''} ${className}`}>
        {children}
      </main>
      {showNav && <H5BottomNav />}
    </div>
  );
}
