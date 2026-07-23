// frontend/admin-dashboard/src/modules/game/pages/GameRoundsPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Input, Select, Space, Typography, Flex } from 'antd';
import api from '@admin/api/client';

const { Text } = Typography;

export default function GameRoundsPage() {
  const [page, setPage]         = useState(1);
  const [gameType, setGameType] = useState('');
  const [search, setSearch]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['game-admin-rounds', page, gameType, search],
    queryFn:  () => api.get('/game/admin/rounds', {
      params: { page, limit: 20, gameType: gameType || undefined, search: search || undefined },
    }).then(r => r.data),
    staleTime: 15_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, r) => r.user?.username ?? r.userId,
    },
    {
      title: 'Game',
      key: 'game',
      render: (_, r) => (
        <div>
          <div>{r.gameName ?? r.gameCode ?? '—'}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.gameType ?? r.type ?? ''}</Text>
        </div>
      ),
    },
    {
      title: 'Cược',
      key: 'bet',
      render: (_, r) => (
        <Text style={{ color: '#fb923c', fontFamily: 'monospace' }}>
          {Number(r.betAmount ?? r.stake ?? 0).toLocaleString('vi')} ₫
        </Text>
      ),
    },
    {
      title: 'Thắng',
      key: 'win',
      render: (_, r) => {
        const win = Number(r.winAmount ?? r.win ?? 0);
        return win > 0
          ? <Text style={{ color: '#4ade80', fontFamily: 'monospace' }}>+{win.toLocaleString('vi')} ₫</Text>
          : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Kết quả',
      key: 'result',
      render: (_, r) => {
        const win = Number(r.winAmount ?? r.win ?? 0);
        return <Tag color={win > 0 ? 'success' : 'error'}>{win > 0 ? 'Thắng' : 'Thua'}</Tag>;
      },
    },
    {
      title: 'Nhà cung cấp',
      key: 'provider',
      render: (_, r) => r.provider ?? r.aggregator ?? '—',
    },
    {
      title: 'Thời gian',
      key: 'createdAt',
      render: (_, r) => new Date(r.createdAt ?? r.created_at).toLocaleString('vi'),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Game — Lịch sử vòng chơi</div>
          <Text type="secondary">Tổng: {total.toLocaleString()} vòng</Text>
        </div>
        <Space wrap>
          <Input.Search
            placeholder="Tìm user / game..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            onSearch={() => setPage(1)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={gameType}
            onChange={v => { setGameType(v); setPage(1); }}
            style={{ width: 150 }}
            options={[
              { value: '',        label: 'Tất cả' },
              { value: 'slots',   label: 'Slots' },
              { value: 'lottery', label: 'Xổ số' },
              { value: 'casino',  label: 'Casino' },
              { value: 'sports',  label: 'Thể thao' },
            ]}
          />
        </Space>
      </Flex>

      <Table
        dataSource={rows}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        size="middle"
        pagination={{
          current:   page,
          pageSize:  20,
          total,
          onChange:  p => setPage(p),
          showTotal: t => `Tổng: ${t.toLocaleString()}`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
