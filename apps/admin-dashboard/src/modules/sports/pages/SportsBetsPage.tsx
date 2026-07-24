// frontend/admin-dashboard/src/modules/sports/pages/SportsBetsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, App, Typography, Flex } from 'antd';
import { adminBets } from '../api';
import { ColumnType } from 'antd/es/table';

const { Text } = Typography;
const STATUS_TAG: Record<string, string> = { pending: 'warning', won: 'success', lost: 'error', void: 'default', settled: 'processing' };
const STATUS_LABEL: Record<string, string> = { pending: 'Chờ kết quả', won: 'Thắng', lost: 'Thua', void: 'Huỷ', settled: 'Đã kết toán' };

export default function SportsBetsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState<number>(1);
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['sports-admin-bets', page, status],
    queryFn:  () => adminBets.list({ page, limit: 20, status: status || undefined }).then((r: any) => r.data),
  });

  const rows: any[]  = data?.data ?? [];
  const total: number = data?.total ?? 0;

  const settleMut = useMutation({
    mutationFn: ({ id, result }: { id: string | number, result: string }) => adminBets.update(id, { result }),
    onSuccess: () => { message.success('Đã cập nhật kết quả'); qc.invalidateQueries({ queryKey: ['sports-admin-bets'] }); },
    onError:   () => message.error('Có lỗi xảy ra'),
  });

  const columns: ColumnType<any>[] = [
    { title: '#', dataIndex: 'id', key: 'id', render: (v: string) => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'User', key: 'user', render: (_, b: any) => b.user?.username ?? b.userId },
    {
      title: 'Trận đấu', key: 'match',
      render: (_, b: any) => <Text style={{ fontSize: 12 }}>{b.match?.homeTeam?.name ?? '?'} vs {b.match?.awayTeam?.name ?? '?'}</Text>,
      ellipsis: true,
    },
    { title: 'Loại cược', key: 'betType', render: (_, b: any) => b.betType ?? b.marketType ?? '—' },
    { title: 'Số tiền',  key: 'amount',  render: (_, b: any) => <Text strong>{Number(b.amount ?? b.stake ?? 0).toLocaleString('vi')} ₫</Text> },
    { title: 'Tỉ lệ',   dataIndex: 'odds', key: 'odds', render: (v: any) => <Text style={{ color: '#facc15' }}>{v ?? '—'}</Text> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag> },
    { title: 'Ngày', key: 'createdAt', render: (_, b: any) => new Date(b.createdAt ?? b.created_at).toLocaleString('vi') },
    {
      title: 'Thao tác', key: 'action',
      render: (_, b: any) => b.status === 'pending' ? (
        <Space size="small">
          <Button type="primary" size="small" onClick={() => settleMut.mutate({ id: b.id, result: 'won' })}>Win</Button>
          <Button danger size="small" onClick={() => settleMut.mutate({ id: b.id, result: 'lost' })}>Loss</Button>
          <Button size="small" onClick={() => settleMut.mutate({ id: b.id, result: 'void' })}>Void</Button>
        </Space>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Sports — Cược</div>
        <Select
          value={status} onChange={v => { setStatus(v); setPage(1); }} style={{ width: 160 }}
          options={[
            { value: '',        label: 'Tất cả' },
            { value: 'pending', label: 'Chờ kết quả' },
            { value: 'won',     label: 'Thắng' },
            { value: 'lost',    label: 'Thua' },
            { value: 'void',    label: 'Huỷ' },
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
