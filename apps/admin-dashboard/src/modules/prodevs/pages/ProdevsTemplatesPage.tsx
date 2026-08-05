import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, App, Typography, Flex, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

export default function ProdevsTemplatesPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['prodevs-templates'],
    queryFn:  () => api.get('/admin/prodevs/templates').then(r => r.data?.data ?? r.data ?? []),
    staleTime: 60_000,
  });

  const rows = Array.isArray(data) ? data : [];

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string | number; active: boolean }) =>
      api.patch(`/admin/prodevs/templates/${id}`, { active }),
    onSuccess: () => {
      message.success('Đã cập nhật template');
      qc.invalidateQueries({ queryKey: ['prodevs-templates'] });
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Framework', dataIndex: 'framework', key: 'framework', render: (v: string) => <Tag color="purple">{v}</Tag> },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', render: (v: string) => <Text type="secondary">{v || '—'}</Text> },
    { title: 'Phiên bản', dataIndex: 'version', key: 'version' },
    {
      title: 'Kích hoạt', dataIndex: 'active', key: 'active',
      render: (v: boolean, r: any) => (
        <Switch checked={v} size="small" onChange={checked => toggleMut.mutate({ id: r.id, active: checked })} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>ProDevs — Templates</div>
          <Text type="secondary">Quản lý template scaffold có sẵn</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => message.info('Tính năng thêm template đang phát triển')}>
          Thêm template
        </Button>
      </Flex>
      <Table dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle" />
    </div>
  );
}
