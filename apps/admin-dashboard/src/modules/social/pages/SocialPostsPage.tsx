import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, Input, App, Typography, Flex, Image } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

const STATUS_OPTS = [
  { value: '',           label: 'Tất cả' },
  { value: 'published',  label: 'Đã đăng' },
  { value: 'hidden',     label: 'Đã ẩn' },
  { value: 'flagged',    label: 'Bị báo cáo' },
];

export default function SocialPostsPage() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['social-admin-posts', page, status, search],
    queryFn:  () => api.get('/social/admin/posts', {
      params: { page, limit: 20, status: status || undefined, search: search || undefined },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const deleteMut = useMutation({
    mutationFn: (id: string | number) => api.delete(`/social/admin/posts/${id}`),
    onSuccess: () => {
      message.success('Đã xóa bài đăng');
      qc.invalidateQueries({ queryKey: ['social-admin-posts'] });
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const hideMut = useMutation({
    mutationFn: (id: string | number) => api.patch(`/social/admin/posts/${id}/hide`),
    onSuccess: () => {
      message.success('Đã ẩn bài đăng');
      qc.invalidateQueries({ queryKey: ['social-admin-posts'] });
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    {
      title: 'Người đăng', key: 'user',
      render: (_: any, r: any) => (
        <div>
          <div className="font-medium">{r.user?.username ?? r.userId}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.user?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Nội dung', dataIndex: 'content', key: 'content',
      render: (v: string) => <Text ellipsis style={{ maxWidth: 300 }}>{v}</Text>,
    },
    {
      title: 'Ảnh', key: 'media',
      render: (_: any, r: any) => r.mediaUrls?.length
        ? <Image src={r.mediaUrls[0]} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'published' ? 'success' : s === 'hidden' ? 'default' : 'warning'}>
          {s}
        </Tag>
      ),
    },
    {
      title: 'Thời gian', key: 'createdAt',
      render: (_: any, r: any) => new Date(r.createdAt).toLocaleString('vi'),
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_: any, r: any) => (
        <Space size="small">
          {r.status !== 'hidden' && (
            <Button size="small" onClick={() => hideMut.mutate(r.id)} loading={hideMut.isPending}>
              Ẩn
            </Button>
          )}
          <Button
            size="small" danger icon={<DeleteOutlined />}
            loading={deleteMut.isPending}
            onClick={() => modal.confirm({
              title: 'Xóa bài đăng này?', okText: 'Xóa', okType: 'danger',
              onOk: () => deleteMut.mutateAsync(r.id),
            })}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Social — Bài đăng</div>
          <Text type="secondary">Quản lý nội dung bài đăng người dùng</Text>
        </div>
        <Space>
          <Input.Search
            placeholder="Tìm kiếm..."
            onSearch={v => { setSearch(v); setPage(1); }}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={status}
            onChange={v => { setStatus(v); setPage(1); }}
            style={{ width: 140 }}
            options={STATUS_OPTS}
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
