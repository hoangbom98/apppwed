import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Select, App, Typography, Flex } from 'antd';
import api from '@admin/api/client';

const { Text } = Typography;
const MATCH_STATUS_TAG = { matched: 'success', unmatched: 'default', blocked: 'error' };
const MATCH_STATUS_LABEL = { matched: 'Đã ghép', unmatched: 'Đã unmatch', blocked: 'Bị chặn' };

export default function DatingMatchesPage() {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dating-admin-matches', page, status],
    queryFn:  () => api.get('/dating/admin/matches', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/dating/admin/matches/${id}`),
    onSuccess: () => { message.success('Đã xoá cặp ghép đôi'); qc.invalidateQueries({ queryKey: ['dating-admin-matches'] }); },
    onError:   () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    { title: 'User 1', key: 'user1', render: (_, m) => m.user1?.username ?? m.userId1 ?? '—' },
    { title: 'User 2', key: 'user2', render: (_, m) => m.user2?.username ?? m.userId2 ?? '—' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: s => <Tag color={MATCH_STATUS_TAG[s] ?? 'default'}>{MATCH_STATUS_LABEL[s] ?? s}</Tag>,
    },
    { title: 'Tin nhắn', key: 'messages', render: (_, m) => (m.messageCount ?? 0).toLocaleString() },
    { title: 'Cuộc gọi', key: 'calls',    render: (_, m) => (m.callCount ?? 0).toLocaleString() },
    { title: 'Ngày ghép', key: 'createdAt', render: (_, m) => new Date(m.createdAt ?? m.created_at).toLocaleString('vi') },
    {
      title: 'Thao tác', key: 'action',
      render: (_, m) => (
        <Button
          danger size="small"
          onClick={() => modal.confirm({
            title: 'Xoá cặp ghép đôi?',
            okType: 'danger',
            onOk: () => deleteMut.mutateAsync(m.id),
          })}
        >Xoá</Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Dating — Ghép đôi</div>
          <Text type="secondary">Quản lý các cặp ghép đôi trên nền tảng</Text>
        </div>
        <Select
          value={status} onChange={v => { setStatus(v); setPage(1); }} style={{ width: 160 }}
          options={[
            { value: '',          label: 'Tất cả' },
            { value: 'matched',   label: 'Đã ghép' },
            { value: 'unmatched', label: 'Unmatch' },
          ]}
        />
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${t.toLocaleString()}`, showSizeChanger: false }}
      />
    </div>
  );
}
