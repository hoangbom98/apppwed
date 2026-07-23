/**
 * source/frontend/admin-dashboard/src/modules/sports/pages/SportsConfig.tsx
 *
 * Trang cấu hình động cho dự án Sports.
 * Route: /sports/config
 */
import React, { useState } from 'react';
import ProjectConfigPanel from '@admin/modules/shared/components/ProjectConfigPanel';

const TABS = [
  { key: null,      label: 'Tất cả' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'feature', label: 'Tính năng' },
  { key: 'general', label: 'Giao diện' },
];

export default function SportsConfig() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Sports — Cấu hình dự án</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Quản lý cấu hình thanh toán, cá cược, phát sóng thể thao trực tiếp
          </p>
        </div>
        <div className="sm:ml-auto flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={String(t.key)}
              type="button"
              onClick={() => setActiveModule(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeModule === t.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ProjectConfigPanel
        key={`sports-${activeModule}`}
        projectCode="sports"
        moduleFilter={activeModule}
        title={null}
      />
    </div>
  );
}
