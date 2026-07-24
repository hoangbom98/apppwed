/**
 * code/frontend/admin-dashboard/src/modules/dating/pages/DatingConfig.jsx
 *
 * Trang cấu hình động cho dự án Dating.
 * Route: /dating/config
 */
import React, { useState } from 'react';
import { Segmented } from 'antd';
import ProjectConfigPanel from '@admin/modules/shared/components/ProjectConfigPanel';

const TABS = [
  { key: null,           label: 'Tất cả' },
  { key: 'payment',      label: 'Thanh toán' },
  { key: 'kyc',          label: 'KYC' },
  { key: 'promotion',    label: 'Khuyến mãi' },
  { key: 'notification', label: 'Thông báo' },
  { key: 'general',      label: 'Giao diện' },
  { key: 'system',       label: 'Hệ thống' },
];

export default function DatingConfig() {
  const [activeModule, setActiveModule] = useState(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Dating — Cấu hình dự án</h1>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý cấu hình thanh toán (USDT), KYC, khuyến mãi, thông báo của VietDating</p>
        </div>
        <div className="sm:ml-auto">
          <Segmented
            options={TABS.map(t => ({ label: t.label, value: String(t.key) }))}
            value={String(activeModule)}
            onChange={val => setActiveModule(val === 'null' ? null : val)}
          />
        </div>
      </div>

      <ProjectConfigPanel
        key={`dating-${activeModule}`}
        projectCode="dating"
        moduleFilter={activeModule}
        title={null}
      />
    </div>
  );
}
