import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Input, Select, Space, Typography, Flex } from 'antd';
import client from '@admin/api/client';
import { ColumnType } from 'antd/es/table';

const { Text } = Typography;
const STATUS_TAG: Record<string, string> = { open: 'processing', filled: 'success', partial: 'warning', cancelled: 'default', rejected: 'error' };
const STATUS_LABEL: Record<string, string> = { open: 'Mở', filled: 'Khớp', partial: 'Khớp một phần', cancelled: 'Huỷ', rejected: 'Từ chối' };

export default function TradeOrdersPage() {
  const [page, setPage]     = useState<number>(1);
  const [symbol, setSymbol] = useState<string>('');
  const [side, setSide]     = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['trade-admin-orders', page, symbol, side],
    queryFn:  () => client.get('/trade/admin/orders', {
      params: { page, limit: 20, symbol: symbol || undefined, side: side || undefined },
    }).then(r => r.data),
  });

  const rows: any[]  = data?.data ?? [];
  const total: number = data?.total ?? 0;

  const columns: ColumnType<any>[] = [
    { title: 'User',   key: 'user',   render: (_, r: any) => r.user?.username ?? r.userId },
    {
      title: 'Cặp tiền', dataIndex: 'symbol', key: 'symbol',
      render: (v: string) => <Text code>{v ?? '—'}</Text>,
    },
    {
      title: 'Loại lệnh', key: 'side',
      render: (_, r: any) => <Tag color={r.side === 'buy' ? 'success' : 'error'}>{r.side?.toUpperCase() ?? '—'}</Tag>,
    },
    { title: 'Giá',        key: 'price',    render: (_, r: any) => r.price    ?? '—' },
    { title: 'KL lệnh',   key: 'quantity', render: (_, r: any) => r.quantity ?? r.amount ?? '—' },
    { title: 'KL khớp',   key: 'filled',   render: (_, r: any) => r.filledQty ?? r.executedQty ?? '—' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    { title: 'Thời gian', key: 'createdAt', render: (_, r: any) => new Date(r.createdAt ?? r.created_at).toLocaleString('vi') },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Trade — Lệnh giao dịch</div>
        <Space wrap>
          <Input.Search
            placeholder="Cặp tiền (VD: BTC/USDT)..."
            value={symbol}
            onChange={e => { setSymbol(e.target.value); setPage(1); }}
            style={{ width: 200 }} allowClear
          />
          <Select
            value={side} onChange={v => { setSide(v); setPage(1); }} style={{ width: 140 }}
            options={[
              { value: '',     label: 'Tất cả' },
              { value: 'buy',  label: 'Mua' },
              { value: 'sell', label: 'Bán' },
            ]}
          />
        </Space>
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${t}`, showSizeChanger: false }}
      />
    </div>
  );
}
