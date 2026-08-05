import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, App, Typography, Flex } from 'antd';
import client from '@admin/api/client';

const { Text } = Typography;

export default function DatingMomentsPage() {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['dating-admin-moments', page],
    queryFn:  () => client.get('/dating/admin/moments', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;

  const deleteMut = useMutation({
    mutationFn: id => client.delete(`/dating/admin/moments/${id}`),
    onSuccess: () => { message.success('Đã xoá bài đăng'); qc.invalidateQueries({ queryKey: ['dating-admin-moments'] }); },
    onError:   () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    { title: '#', dataIndex: 'id', key: 'id', render: v => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Tác giả', key: 'user', render: (_, m) => m.user?.username ?? m.userId },
    {
      title: 'Nội dung', dataIndex: 'content', key: 'content',
      render: v => <Text ellipsis={{ tooltip: v }} style={{ maxWidth: 200 }}>{v ?? '—'}</Text>,
    },
    {
      title: 'Ảnh', key: 'images',
      render: (_, m) => {
        const count = (m.images ?? m.photos ?? []).length;
        return count > 0 ? <Text type="success">{count} ảnh</Text> : <Text type="secondary">—</Text>;
      },
    },
    { title: 'Likes',    key: 'likes',    render: (_, m) => m.likeCount    ?? m.likes    ?? 0 },
    { title: 'Comments', key: 'comments', render: (_, m) => m.commentCount ?? m.comments ?? 0 },
    { title: 'Ngày',     key: 'createdAt', render: (_, m) => new Date(m.createdAt ?? m.created_at).toLocaleString('vi') },
    {
      title: 'Thao tác', key: 'action',
      render: (_, m) => (
        <Button
          danger size="small"
          onClick={() => modal.confirm({
            title: 'Xoá bài đăng?',
            okType: 'danger',
            onOk: () => deleteMut.mutateAsync(m.id),
          })}
        >Xoá</Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div style={{ fontSize: 20, fontWeight: 700 }}>Dating — Khoảnh khắc (Feed)</div>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{
          current: page, pageSize: 20, total,
          onChange: p => setPage(p),
          showTotal: t => `Tổng: ${t}`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
