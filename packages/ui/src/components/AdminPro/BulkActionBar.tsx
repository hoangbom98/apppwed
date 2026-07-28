import React from 'react';
import { Button, Space } from 'antd';

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onActivate?: () => void;
  onExport?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, onDelete, onActivate, onExport }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <span className="font-medium text-blue-800">Đã chọn {selectedCount} mục</span>
      <Space>
        {onActivate && <Button onClick={onActivate}>Kích hoạt</Button>}
        {onExport && <Button onClick={onExport}>Xuất Excel</Button>}
        <Button danger onClick={onDelete}>Xóa</Button>
      </Space>
    </div>
  );
};
