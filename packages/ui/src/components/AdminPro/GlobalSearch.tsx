import React, { useState } from 'react';
import { Modal, Input } from 'antd';
import { Search } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

export const GlobalSearch: React.FC<{ onSearch: (keyword: string) => void }> = ({ onSearch }) => {
  const [open, setOpen] = useState(false);

  useHotkeys('ctrl+k, command+k', () => setOpen(true), { preventDefault: true });

  return (
    <>
      <Input
        prefix={<Search size={16} />}
        placeholder="Tìm kiếm (Cmd+K)"
        onClick={() => setOpen(true)}
        readOnly
        className="w-64 cursor-pointer"
      />
      <Modal title="Tìm kiếm toàn cục" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Input.Search placeholder="Nhập từ khóa..." onSearch={onSearch} autoFocus />
      </Modal>
    </>
  );
};
