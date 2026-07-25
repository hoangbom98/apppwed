// @ts-nocheck
// frontend/admin-dashboard/src/modules/game/pages/GameConfig.jsx
// Route: /game/config
import React, { useState } from 'react';
import { Segmented, Typography, Flex } from 'antd';
import ProjectConfigPanel from '@admin/modules/shared/components/ProjectConfigPanel';

const { Text } = Typography;

const TABS = [
  { value: null,           label: 'Tất cả' },
  { value: 'payment',      label: 'Thanh toán' },
  { value: 'kyc',          label: 'KYC' },
  { value: 'promotion',    label: 'Khuyến mãi' },
  { value: 'notification', label: 'Thông báo' },
  { value: 'general',      label: 'Giao diện' },
  { value: 'system',       label: 'Hệ thống' },
];

export default function GameConfig() {
  const [activeModule, setActiveModule] = useState(null);

  return (
    <div className="space-y-5">
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap={16}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Game — Cấu hình dự án</div>
          <Text type="secondary">Quản lý cấu hình thanh toán, KYC, khuyến mãi, thông báo của Game Center</Text>
        </div>
        <Segmented
          options={TABS.map(t => ({ value: String(t.value), label: t.label }))}
          value={String(activeModule)}
          onChange={v => setActiveModule(v === 'null' ? null : v)}
        />
      </Flex>

      <ProjectConfigPanel
        key={`game-${activeModule}`}
        projectCode="game"
        moduleFilter={activeModule}
        title={null}
      />
    </div>
  );
}
