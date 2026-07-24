import React, { useState } from 'react';

/**
 * AdminLayout — sidebar layout for admin dashboard SPA
 * Usage:
 *   <AdminLayout sidebar={<Sidebar />} header={<AdminHeader />}>
 *     <PageContent />
 *   </AdminLayout>
 */
export default function AdminLayout({
  children,
  sidebar,
  header,
  className = '',
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar — hidden on mobile unless toggled */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform
          lg:relative lg:translate-x-0 lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebar}
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        {header && (
          <header className="flex items-center h-16 bg-white border-b border-gray-200 px-4 gap-3 shadow-sm">
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1">{header}</div>
          </header>
        )}

        {/* Content */}
        <main className={`flex-1 overflow-y-auto p-6 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
