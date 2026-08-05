import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, App, Typography, Flex } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

const REASON_OPTS = [
  { value: '',              label: 'Tất cả lý do' },
  { value: 'spam',          label: 'Spam' },
  { value: 'inappropriate', label: 'Không phù hợp' },
  { value: 'harassment',    label: 'Quấy rối' },
  { value: 'violence',      label: 'Bạo lực' },
  { value: 'other',         label: 'Khác' },
];

export default function SocialReportsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('pending');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['social-admin-reports', page, status, reason],
    queryFn:  () => api.get('/social/admin/reports', {
      params: { page, limit: 20, status: status || undefined, reason: reason || undefined },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const resolveMut = useMutation({
    mutationFn: ({ id, action }: { id: string | number; action: string }) =>
      api.patch(`/social/admin/reports/${id}/resolve`, { action }),
    onSuccess: () => {
      message.success('Đã xử lý báo cáo');
      qc.invalidateQueries({ queryKey: ['social-admin-reports'] });
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    {
      title: 'Người báo cáo', key: 'reporter',
      render: (_: any, r: any) => r.reporter?.username ?? r.reporterId,
    },
    {
      title: 'Nội dung bị báo cáo', key: 'target',
      render: (_: any, r: any) => (
        <div>
          <Tag color="blue">{r.targetType ?? 'post'}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}> #{r.targetId}</Text>
        </div>
      ),
    },
    {
      title: 'Lý do', dataIndex: 'reason', key: 'reason',
      render: (v: string) => <Tag>{REASON_OPTS.find(o => o.value === v)?.label ?? v}</Tag>,
    },
    {
      title: 'Mô tả', dataIndex: 'description', key: 'description',
      render: (v: string) => <Text ellipsis style={{ maxWidth: 200 }}>{v || '—'}</Text>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'pending' ? 'warning' : s === 'resolved' ? 'success' : 'default'}>
          {s === 'pending' ? 'Chờ xử lý' : s === 'resolved' ? 'Đã xử lý' : s}
        </Tag>
      ),
    },
    {
      title: 'Thời gian', key: 'createdAt',
      render: (_: any, r: any) => new Date(r.createdAt).toLocaleString('vi'),
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_: any, r: any) => r.status === 'pending' ? (
        <Space size="small">
          <Button
            type="primary" size="small" icon={<CheckOutlined />}
            loading={resolveMut.isPending}
            onClick={() => resolveMut.mutate({ id: r.id, action: 'approve' })}
          >Xử lý</Button>
          <Button
            size="small" icon={<CloseOutlined />}
            loading={resolveMut.isPending}
            onClick={() => resolveMut.mutate({ id: r.id, action: 'dismiss' })}
          >Bỏ qua</Button>
        </Space>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Social — Báo cáo vi phạm</div>
          <Text type="secondary">Xét duyệt các báo cáo từ người dùng</Text>
        </div>
        <Space>
          <Select
            value={status} onChange={v => { setStatus(v); setPage(1); }}
            style={{ width: 140 }}
            options={[
              { value: '',         label: 'Tất cả' },
              { value: 'pending',  label: 'Chờ xử lý' },
              { value: 'resolved', label: 'Đã xử lý' },
              { value: 'dismissed',label: 'Bỏ qua' },
            ]}
          />
          <Select
            value={reason} onChange={v => { setReason(v); setPage(1); }}
            style={{ width: 160 }} options={REASON_OPTS} allowClear
          />
        </Space>
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{
          current: page, pageSize: 20, total,
          onChange: p => setPage(p),
          showTotal: t => `Tổng: ${t.toLocaleString()}`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
