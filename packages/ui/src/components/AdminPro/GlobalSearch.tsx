import React, { useState, useEffect } from 'react';
import { Modal, Input } from 'antd';
import { Search } from 'lucide-react';

export const GlobalSearch: React.FC<{ onSearch: (keyword: string) => void }> = ({ onSearch }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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
