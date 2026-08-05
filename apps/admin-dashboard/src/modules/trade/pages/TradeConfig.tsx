/**
 * admin-dashboard/src/modules/trade/pages/TradeConfig.tsx
 * Route: /trade/config
 * Dynamic project config editor for Trade platform.
 */
import React, { useState } from 'react';
import ProjectConfigPanel from '@admin/modules/shared/components/ProjectConfigPanel';

const TABS = [
  { key: null,        label: 'Tất cả' },
  { key: 'trading',   label: 'Giao dịch' },
  { key: 'payment',   label: 'Thanh toán' },
  { key: 'kyc',       label: 'KYC' },
  { key: 'feature',   label: 'Tính năng' },
  { key: 'general',   label: 'Giao diện' },
];

export default function TradeConfig() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Trade — Cấu hình dự án</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Quản lý cấu hình sàn giao dịch, thanh toán, KYC, đòn bẩy, phí giao dịch
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
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ProjectConfigPanel
        key={`trade-${activeModule}`}
        projectCode="trade"
        moduleFilter={activeModule}
        title={null}
      />
    </div>
  );
}
