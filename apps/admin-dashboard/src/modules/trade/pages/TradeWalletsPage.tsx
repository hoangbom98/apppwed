// @ts-nocheck
// frontend/admin-dashboard/src/modules/trade/pages/TradeWalletsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Input, Typography, Flex } from 'antd';
import client from '@admin/api/client';
import { ColumnType } from 'antd/es/table';

const { Text } = Typography;

export default function TradeWalletsPage() {
  const [page, setPage]     = useState<number>(1);
  const [search, setSearch] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['trade-admin-wallets', page, search],
    queryFn:  () => client.get('/trade/admin/wallets', {
      params: { page, limit: 20, search: search || undefined },
    }).then(r => r.data),
  });

  const rows: any[]  = data?.data ?? [];
  const total: number = data?.total ?? 0;

  const columns: ColumnType<any>[] = [
    { title: 'User',     key: 'user',    render: (_, w: any) => w.user?.username ?? w.userId },
    {
      title: 'Tài sản', key: 'asset',
      render: (_, w: any) => <Text code>{w.asset ?? w.currency ?? '—'}</Text>,
    },
    {
      title: 'Khả dụng', key: 'free',
      render: (_, w: any) => (
        <Text style={{ color: '#4ade80', fontFamily: 'monospace' }}>
          {Number(w.free ?? w.available ?? 0).toFixed(4)}
        </Text>
      ),
    },
    {
      title: 'Đang khóa', key: 'locked',
      render: (_, w: any) => (
        <Text style={{ color: '#facc15', fontFamily: 'monospace' }}>
          {Number(w.locked ?? w.frozen ?? 0).toFixed(4)}
        </Text>
      ),
    },
    {
      title: 'Tổng', key: 'total',
      render: (_, w: any) => (
        <Text strong style={{ fontFamily: 'monospace' }}>
          {(Number(w.free ?? w.available ?? 0) + Number(w.locked ?? w.frozen ?? 0)).toFixed(4)}
        </Text>
      ),
    },
    { title: 'Cập nhật', key: 'updatedAt', render: (_, w: any) => w.updatedAt ? new Date(w.updatedAt).toLocaleString('vi-VN') : '—' },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Trade — Ví tiền</div>
          <Text type="secondary">Tổng quan số dư các ví người dùng Trade</Text>
        </div>
        <Input.Search
          placeholder="Tìm username / email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 280 }} allowClear
        />
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{
          current: page, pageSize: 20, total,
          onChange: p => setPage(p),
          showTotal: (t, [s, e]) => `Hiển thị ${s}-${e} / ${t}`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
