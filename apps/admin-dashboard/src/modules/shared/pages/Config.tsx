import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Modal, Input, Typography, Button, App } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Config() {
  const { message } = App.useApp();
  const [editingItem, setEditingItem] = useState(null);
  const [newValue,    setNewValue]    = useState('');
  const [jsonError,   setJsonError]   = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminConfig'],
    queryFn:  () => api.get('/admin/config').then(r => r.data?.data ?? r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => api.put('/admin/config', { updates }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminConfig'] });
      setEditingItem(null);
      setJsonError('');
      message.success('Đã lưu cấu hình');
    },
    onError: () => message.error('Lỗi khi lưu'),
  });

  const handleSave = () => {
    try {
      const parsed = JSON.parse(newValue);
      updateMutation.mutate([{ ...editingItem, value: parsed }]);
    } catch {
      setJsonError('JSON không hợp lệ');
    }
  };

  const columns = [
    { title: 'Module', dataIndex: 'module', key: 'module', render: v => <Text className="text-xs">{v}</Text> },
    { title: 'Nhóm',   dataIndex: 'group',  key: 'group',  render: v => <Text type="secondary" className="text-xs">{v}</Text> },
    {
      title: 'Key', dataIndex: 'key', key: 'key',
      render: v => <Text code className="text-xs text-blue-400">{v}</Text>,
    },
    {
      title: 'Giá trị', dataIndex: 'value', key: 'value', ellipsis: true,
      render: v => <Text type="secondary" className="font-mono text-xs">{JSON.stringify(v)}</Text>,
    },
    {
      title: '', key: 'actions', width: 70,
      render: (_, row) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingItem(row); setNewValue(JSON.stringify(row.value, null, 2)); setJsonError(''); }}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} className="mb-4">Cấu hình hệ thống</Title>

      <Table dataSource={data ?? []} columns={columns} rowKey="id" loading={isLoading} size="small" scroll={{ x: 700 }} pagination={false} />

      <Modal
        open={!!editingItem}
        title={<>Sửa cấu hình: <Text code className="text-blue-400">{editingItem?.key}</Text></>}
        onOk={handleSave}
        onCancel={() => { setEditingItem(null); setJsonError(''); }}
        okText="Lưu" cancelText="Huỷ"
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
      >
        <TextArea
          rows={6}
          value={newValue}
          onChange={e => { setNewValue(e.target.value); setJsonError(''); }}
          style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}
        />
        {jsonError && <Text type="danger" className="text-xs mt-1 block">{jsonError}</Text>}
      </Modal>
    </div>
  );
}
