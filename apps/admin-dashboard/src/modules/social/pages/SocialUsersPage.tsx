import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, App, Typography, Flex } from 'antd';
import api from '@admin/api/client';

const { Text } = Typography;

const STATUS_OPTS = [
  { value: 'active',    label: 'Hoạt động' },
  { value: 'suspended', label: 'Tạm khóa' },
  { value: 'banned',    label: 'Cấm' },
];

export default function SocialUsersPage() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['social-admin-users', page, status],
    queryFn:  () => api.get('/social/admin/users', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const banMut = useMutation({
    mutationFn: ({ id, action }: { id: string | number; action: string }) =>
      api.patch(`/social/admin/users/${id}/status`, { status: action }),
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái');
      qc.invalidateQueries({ queryKey: ['social-admin-users'] });
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    {
      title: 'Người dùng', key: 'user',
      render: (_: any, r: any) => (
        <div>
          <div className="font-medium">{r.username ?? r.displayName}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.email}</Text>
        </div>
      ),
    },
    { title: 'Bài đăng', dataIndex: 'postCount', key: 'postCount', render: (v: number) => v ?? 0 },
    { title: 'Người theo dõi', dataIndex: 'followerCount', key: 'followerCount', render: (v: number) => v ?? 0 },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'active' ? 'success' : s === 'suspended' ? 'warning' : 'error'}>
          {STATUS_OPTS.find(o => o.value === s)?.label ?? s}
        </Tag>
      ),
    },
    {
      title: 'Ngày tham gia', key: 'createdAt',
      render: (_: any, r: any) => new Date(r.createdAt).toLocaleDateString('vi'),
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_: any, r: any) => (
        <Space size="small">
          {r.status === 'active' && (
            <Button size="small" danger
              onClick={() => modal.confirm({
                title: `Cấm tài khoản ${r.username}?`, okText: 'Cấm', okType: 'danger',
                onOk: () => banMut.mutateAsync({ id: r.id, action: 'banned' }),
              })}
            >Cấm</Button>
          )}
          {r.status === 'banned' && (
            <Button size="small" type="primary"
              onClick={() => banMut.mutate({ id: r.id, action: 'active' })}
            >Mở khóa</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Social — Người dùng</div>
          <Text type="secondary">Quản lý tài khoản mạng xã hội</Text>
        </div>
        <Select
          value={status} onChange={v => { setStatus(v); setPage(1); }}
          style={{ width: 150 }} placeholder="Tất cả trạng thái"
          allowClear
          options={[{ value: '', label: 'Tất cả' }, ...STATUS_OPTS]}
        />
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
