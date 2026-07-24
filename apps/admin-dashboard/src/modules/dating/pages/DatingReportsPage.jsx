// frontend/admin-dashboard/src/modules/dating/pages/DatingReportsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, App, Typography, Flex } from 'antd';
import client from '@admin/api/client';

const { Text } = Typography;
const STATUS_TAG = { pending: 'warning', reviewed: 'processing', resolved: 'success', dismissed: 'default' };
const STATUS_LABEL = { pending: 'Chờ xử lý', reviewed: 'Đang xem', resolved: 'Đã xử lý', dismissed: 'Bỏ qua' };

export default function DatingReportsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dating-admin-reports', page, status],
    queryFn:  () => client.get('/dating/admin/reports', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;

  const resolveMut = useMutation({
    mutationFn: ({ id, action }) => client.patch(`/dating/admin/reports/${id}`, { status: action }),
    onSuccess: () => { message.success('Đã cập nhật'); qc.invalidateQueries({ queryKey: ['dating-admin-reports'] }); },
    onError:   () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    { title: '#', dataIndex: 'id', key: 'id', render: v => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Người báo cáo', key: 'reporter', render: (_, r) => r.reporter?.username ?? r.reporterId },
    { title: 'Đối tượng',     key: 'reported', render: (_, r) => r.reported?.username ?? r.reportedId },
    {
      title: 'Lý do', key: 'reason',
      render: (_, r) => <Text ellipsis={{ tooltip: r.reason ?? r.type }}>{r.reason ?? r.type ?? '—'}</Text>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    { title: 'Ngày', key: 'createdAt', render: (_, r) => new Date(r.createdAt ?? r.created_at).toLocaleString('vi') },
    {
      title: 'Thao tác', key: 'action',
      render: (_, r) => r.status === 'pending' ? (
        <Space size="small">
          <Button type="primary" size="small" onClick={() => resolveMut.mutate({ id: r.id, action: 'resolved' })}>Xử lý</Button>
          <Button size="small" onClick={() => resolveMut.mutate({ id: r.id, action: 'dismissed' })}>Bỏ qua</Button>
        </Space>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Dating — Báo cáo vi phạm</div>
        <Select
          value={status} onChange={v => { setStatus(v); setPage(1); }} style={{ width: 160 }}
          options={[
            { value: '',          label: 'Tất cả' },
            { value: 'pending',   label: 'Chờ xử lý' },
            { value: 'reviewed',  label: 'Đang xem' },
            { value: 'resolved',  label: 'Đã xử lý' },
            { value: 'dismissed', label: 'Bỏ qua' },
          ]}
        />
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${t}`, showSizeChanger: false }}
      />
    </div>
  );
}
