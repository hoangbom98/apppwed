/**
 * source/frontend/admin-dashboard/src/modules/game/pages/GameConfig.jsx
 *
 * Trang cấu hình động cho dự án Game.
 * Route: /game/config
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

export default function GameConfig() {
  const [activeModule, setActiveModule] = useState(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Game — Cấu hình dự án</h1>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý cấu hình thanh toán, KYC, khuyến mãi, thông báo của Game Center</p>
        </div>
        <div className="sm:ml-auto flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={String(t.key)}
              type="button"
              onClick={() => setActiveModule(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeModule === t.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ProjectConfigPanel
        key={`game-${activeModule}`}
        projectCode="game"
        moduleFilter={activeModule}
        title={null}
      />
    </div>
  );
}
