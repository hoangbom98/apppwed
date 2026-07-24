import React from 'react';
import { Outlet } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import DesktopHeader from './DesktopHeader';
import MobileBottomNav from './MobileBottomNav';

export default function DesktopLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bn-bg-base)', color: 'var(--bn-text-primary)' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-56 lg:w-[220px] flex-col h-screen sticky top-0">
        <DesktopSidebar />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DesktopHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ background: 'var(--bn-bg-surface)', borderTop: '1px solid var(--bn-border)' }}>
        <MobileBottomNav />
      </div>
    </div>
  );
}
