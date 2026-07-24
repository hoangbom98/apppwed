// frontend/admin-dashboard/src/modules/game/pages/GameRoundsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Input, Select, Space, Typography, Flex, Button, Popconfirm, App, Checkbox } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

// Boyue gameType map (học từ GameManageController.php)
const GAME_TYPES = [
  { value: '',          label: 'Tất cả loại' },
  { value: 'RNG',       label: 'Slots (RNG)' },
  { value: 'LIVE',      label: 'Live Casino' },
  { value: 'FISH',      label: 'Bắn cá (FISH)' },
  { value: 'SPORTS',    label: 'Thể thao' },
  { value: 'ESPORTS',   label: 'E-Sports' },
  { value: 'PVP',       label: 'Cờ bài (PVP)' },
  { value: 'ELOTTO',    label: 'Xổ số (Lottery)' },
  { value: 'COCKFIGHT', label: 'Đá gà' },
];

export default function GameRoundsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page,     setPage]     = useState(1);
  const [gameType, setGameType] = useState('');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState([]);    // batch select
  const [batchStatus, setBatch] = useState('inactive');

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

  // Batch toggle mutation
  const batchMut = useMutation({
    mutationFn: () => api.post('/admin/game/batch-status', { gameIds: selected, status: batchStatus }),
    onSuccess: (res) => {
      message.success(res.data?.data?.message ?? 'Đã cập nhật');
      setSelected([]);
      qc.invalidateQueries({ queryKey: ['game-admin-rounds'] });
    },
    onError: () => message.error('Lỗi cập nhật batch'),
  });

  return (
    <App>
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
          {/* Boyue gameType filter — RNG/LIVE/FISH/SPORTS/ESPORTS/PVP/ELOTTO/COCKFIGHT */}
          <Select
            value={gameType}
            onChange={v => { setGameType(v); setPage(1); }}
            style={{ width: 180 }}
            options={GAME_TYPES}
          />
        </Space>
      </Flex>

      {/* Batch action bar — hiện khi có rows được chọn */}
      {selected.length > 0 && (
        <Flex align="center" gap={8} style={{ background: '#1e3a5f', padding: '8px 12px', borderRadius: 6 }}>
          <Text style={{ color: '#93c5fd', fontSize: 13 }}>Đã chọn {selected.length} game</Text>
          <Select size="small" value={batchStatus} onChange={setBatch} style={{ width: 140 }}
            options={[
              { value: 'active',      label: 'Kích hoạt' },
              { value: 'inactive',    label: 'Tắt' },
              { value: 'maintenance', label: 'Bảo trì' },
            ]}
          />
          <Popconfirm
            title={`Cập nhật ${selected.length} game sang "${batchStatus}"?`}
            onConfirm={() => batchMut.mutate()}
            okText="Xác nhận" cancelText="Huỷ"
          >
            <Button size="small" icon={<AppstoreOutlined />} loading={batchMut.isPending} type="primary">
              Áp dụng
            </Button>
          </Popconfirm>
          <Button size="small" onClick={() => setSelected([])}>Bỏ chọn</Button>
        </Flex>
      )}

      <Table
        dataSource={rows}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        size="middle"
        rowSelection={{
          selectedRowKeys: selected,
          onChange: (keys) => setSelected(keys),
        }}
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
    </App>
  );
}
