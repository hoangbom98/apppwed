import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Typography, Flex, Input } from 'antd';
import api from '@admin/api/client';

const { Text } = Typography;

export default function ProdevsProjectsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['prodevs-projects', search],
    queryFn:  () => api.get('/admin/prodevs/projects', {
      params: { search: search || undefined },
    }).then(r => r.data?.data ?? r.data ?? []),
    staleTime: 30_000,
  });

  const rows = Array.isArray(data) ? data : [];

  const columns = [
    { title: 'Tên dự án', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Template', dataIndex: 'template', key: 'template', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Framework', dataIndex: 'framework', key: 'framework' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'completed' ? 'success' : s === 'building' ? 'processing' : 'default'}>{s}</Tag>
      ),
    },
    {
      title: 'Người tạo', key: 'creator',
      render: (_: any, r: any) => r.createdBy?.username ?? r.createdBy ?? '—',
    },
    {
      title: 'Thời gian', key: 'createdAt',
      render: (_: any, r: any) => new Date(r.createdAt).toLocaleString('vi'),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>ProDevs — Dự án đã scaffold</div>
          <Text type="secondary">Danh sách dự án đã được tạo qua CLI</Text>
        </div>
        <Input.Search
          placeholder="Tìm dự án..."
          onSearch={v => setSearch(v)}
          style={{ width: 220 }}
          allowClear
        />
      </Flex>
      <Table dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle" />
    </div>
  );
}
