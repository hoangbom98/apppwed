// @ts-nocheck
/**
 * code/frontend/admin-dashboard/src/modules/hub/pages/HubConfig.jsx
 *
 * Trang cấu hình động cho dự án Hub.
 * Route: /hub/config
 */
import React, { useState } from 'react';
import ProjectConfigPanel from '@admin/modules/shared/components/ProjectConfigPanel';

const TABS = [
  { key: null,          label: 'Tất cả' },
  { key: 'payment',     label: 'Thanh toán' },
  { key: 'kyc',         label: 'KYC' },
  { key: 'promotion',   label: 'Khuyến mãi' },
  { key: 'notification',label: 'Thông báo' },
  { key: 'general',     label: 'Giao diện' },
  { key: 'system',      label: 'Hệ thống' },
];

export default function HubConfig() {
  const [activeModule, setActiveModule] = useState(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Hub — Cấu hình dự án</h1>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý cấu hình chức năng của Hub Portal</p>
        </div>
        {/* Module tabs */}
        <div className="sm:ml-auto flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={String(t.key)}
              type="button"
              onClick={() => setActiveModule(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeModule === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ProjectConfigPanel
        key={`hub-${activeModule}`}
        projectCode="hub"
        moduleFilter={activeModule}
        title={null}
      />
    </div>
  );
}
